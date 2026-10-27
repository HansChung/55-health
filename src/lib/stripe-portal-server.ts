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

/** 這位會員現在有沒有還在扣款的訂閱（查不到、已取消都算沒有） */
export async function hasLiveSubscription(stripe: Stripe, subscriptionId: string | null): Promise<boolean> {
  if (!subscriptionId) return false;
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    return isLiveStatus(sub.status);
  } catch (e) {
    console.warn("[stripe] 讀訂閱失敗:", subscriptionId, e);
    return false;
  }
}
