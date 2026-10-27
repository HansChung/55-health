// ────────────────────────────────────────────────
// Stripe 訂閱 → 會員方案（純函式，方便測試；伺服器端見 stripe-subscription-server.ts）
// 以「這位會員現在綁的那一份訂閱」為準：stripe_subscription_id 一樣才降級，
// 這樣升級／降級時舊訂閱被取消，不會把正在付錢的人打回免費版
// ────────────────────────────────────────────────

export type PaidPlan = "basic" | "pro";
export type Tier = "free" | PaidPlan;

type Env = Record<string, string | undefined>;

/** Stripe 價格 → 方案（認不得的價格回 null：不動方案） */
export function planForPrice(priceId: string | null | undefined, env: Env = process.env): PaidPlan | null {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === env.STRIPE_PRICE_BASIC) return "basic";
  return null;
}

/** 這些狀態算「有在訂閱」：past_due 是扣款失敗、Stripe 還在重試，先不降級 */
const LIVE = new Set(["active", "trialing", "past_due"]);
/** 這些狀態確定沒了 */
const ENDED = new Set(["canceled", "unpaid", "incomplete_expired", "paused"]);

export function isLiveStatus(status: string): boolean {
  return LIVE.has(status);
}

export interface SubscriptionSnapshot {
  id: string;
  status: string;
  priceId: string | null;
  /** 這一期結束（Unix 秒） */
  periodEnd: number | null;
}

export type ProfileChange =
  | { kind: "none"; reason: string }
  | { kind: "set"; tier: Tier; subscriptionId: string | null; expiresAt: string | null };

/**
 * 依訂閱現況決定要不要改會員的方案
 * storedSubscriptionId＝資料庫裡這位會員現在綁的訂閱
 */
export function decideProfileChange(sub: SubscriptionSnapshot, storedSubscriptionId: string | null, env: Env = process.env): ProfileChange {
  if (isLiveStatus(sub.status)) {
    const plan = planForPrice(sub.priceId, env);
    if (!plan) return { kind: "none", reason: `unknown price ${sub.priceId}` };
    return {
      kind: "set",
      tier: plan,
      subscriptionId: sub.id,
      expiresAt: sub.periodEnd ? new Date(sub.periodEnd * 1000).toISOString() : null,
    };
  }
  if (ENDED.has(sub.status)) {
    // 只有「現在綁的那一份」結束才降級；換方案時舊的那份被取消不影響
    if (storedSubscriptionId !== sub.id) return { kind: "none", reason: "not the current subscription" };
    return { kind: "set", tier: "free", subscriptionId: null, expiresAt: null };
  }
  // incomplete：第一次付款還沒完成，等下一個事件
  return { kind: "none", reason: `status ${sub.status}` };
}
