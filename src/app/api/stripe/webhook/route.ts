// ────────────────────────────────────────────────
// Stripe webhook：訂閱的每個變化都重新向 Stripe 讀最新狀態，同步到 profiles
// 要在 Stripe 後台把這幾個事件送到這裡：checkout.session.completed、
//   customer.subscription.created、customer.subscription.updated、customer.subscription.deleted
// 寫資料庫失敗回 500 → Stripe 會自動重送（以前一律回 200，付了錢卻沒升級也不會重試）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { syncSubscription } from "@/lib/stripe-subscription-server";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe 未設定" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature 驗證失敗" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (session.mode === "subscription" && subId) {
        const hint = session.client_reference_id ?? session.metadata?.user_id ?? null;
        const r = await syncSubscription(stripe, admin, subId, hint);
        console.info("[stripe] checkout 完成:", subId, r.change);
      }
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const r = await syncSubscription(stripe, admin, sub.id);
      console.info("[stripe]", event.type, sub.id, r.change);
    }
  } catch (e) {
    console.error("[stripe] webhook 同步失敗:", event.type, e);
    return NextResponse.json({ error: "sync failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
