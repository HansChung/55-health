// Stripe 的訂閱管理頁（改方案、取消、換信用卡都在那裡；Stripe 後台 → Settings → Billing → Customer portal 要先開）
import type Stripe from "stripe";
import { isLiveStatus } from "./stripe-subscription";

export function appUrl(path: string): string {
  return `${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "")}${path}`;
}

export async function portalUrl(stripe: Stripe, customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: appUrl("/pricing") });
  return session.url;
}

/**
 * 這位會員現在有沒有還在扣款的訂閱
 * 先看資料庫記的那一份；沒記到（這次改版前就訂閱的人）再用 Stripe 客戶、Email 去找
 * Stripe 連不上會丟錯（不知道就不放行，免得開出第二份訂閱）；訂閱已被刪掉才當作沒有
 */
export async function findLiveSubscription(
  stripe: Stripe,
  opts: { subscriptionId: string | null; customerId: string | null; email: string | null | undefined },
): Promise<Stripe.Subscription | null> {
  if (opts.subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(opts.subscriptionId);
      if (isLiveStatus(sub.status)) return sub;
    } catch (e) {
      if ((e as { code?: string })?.code !== "resource_missing") throw e;
    }
  }
  const customers = opts.customerId
    ? [opts.customerId]
    : opts.email
      ? (await stripe.customers.list({ email: opts.email, limit: 10 })).data.map((c) => c.id)
      : [];
  for (const customer of customers) {
    const { data } = await stripe.subscriptions.list({ customer, status: "all", limit: 20 });
    const live = data.find((s) => isLiveStatus(s.status));
    if (live) return live;
  }
  return null;
}
