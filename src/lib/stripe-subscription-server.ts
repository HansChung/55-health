// ────────────────────────────────────────────────
// Stripe 訂閱同步到 profiles（webhook 用）
// 每次都向 Stripe 重新讀這份訂閱的最新狀態，不用事件裡的舊資料 → 事件晚到、順序顛倒都沒關係
// 寫資料庫失敗會丟錯，webhook 回 500，Stripe 會自動重送
// ────────────────────────────────────────────────
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decideProfileChange, type SubscriptionSnapshot } from "./stripe-subscription";

export function snapshotOf(sub: Stripe.Subscription): SubscriptionSnapshot {
  const item = sub.items?.data?.[0];
  return {
    id: sub.id,
    status: sub.status,
    priceId: item?.price?.id ?? null,
    periodEnd: item?.current_period_end ?? null,
  };
}

/** 這份訂閱是誰的：訂閱上的 metadata → 資料庫記的訂閱／客戶 → 當初結帳頁的 client_reference_id */
async function ownerOf(stripe: Stripe, admin: SupabaseClient, sub: Stripe.Subscription, hintUserId: string | null): Promise<string | null> {
  const fromMeta = sub.metadata?.user_id;
  if (fromMeta) return fromMeta;
  if (hintUserId) return hintUserId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  for (const [col, value] of [["stripe_subscription_id", sub.id], ["stripe_customer_id", customerId]] as const) {
    if (!value) continue;
    const { data, error } = await admin.from("profiles").select("id").eq(col, value).limit(2);
    if (error) throw new Error(`find owner by ${col}: ${error.message}`);
    if (data?.length === 1) return (data[0] as { id: string }).id;
  }
  const sessions = await stripe.checkout.sessions.list({ subscription: sub.id, limit: 1 });
  return sessions.data[0]?.client_reference_id ?? null;
}

export async function syncSubscription(
  stripe: Stripe,
  admin: SupabaseClient,
  subscriptionId: string,
  hintUserId: string | null = null,
): Promise<{ userId: string | null; change: string }> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = await ownerOf(stripe, admin, sub, hintUserId);
  if (!userId) {
    console.error("[stripe] 找不到這份訂閱的會員:", subscriptionId);
    return { userId: null, change: "no owner" };
  }

  const { data: profile, error: readErr } = await admin
    .from("profiles").select("stripe_subscription_id, stripe_customer_id").eq("id", userId).maybeSingle();
  if (readErr) throw new Error(`read profile: ${readErr.message}`);
  if (!profile) {
    console.error("[stripe] 會員不存在:", userId, subscriptionId);
    return { userId, change: "no profile" };
  }

  const stored = profile as { stripe_subscription_id: string | null; stripe_customer_id: string | null };
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const decision = decideProfileChange(snapshotOf(sub), stored.stripe_subscription_id ?? null, process.env, {
    storedCustomerId: stored.stripe_customer_id ?? null,
    customerId,
  });
  if (decision.kind === "none") return { userId, change: decision.reason };

  const { error } = await admin
    .from("profiles")
    .update({
      subscription_tier: decision.tier,
      subscription_expires_at: decision.expiresAt,
      stripe_subscription_id: decision.subscriptionId,
      ...(customerId ? { stripe_customer_id: customerId } : {}),
    })
    .eq("id", userId);
  if (error) throw new Error(`update profile: ${error.message}`);
  return { userId, change: `tier=${decision.tier}` };
}
