import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";

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
  } catch (e) {
    return NextResponse.json({ error: "Webhook signature 驗證失敗" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // 優先用 client_reference_id，其次 metadata.user_id
    const userId = session.client_reference_id ?? session.metadata?.user_id;
    const plan = session.metadata?.plan;
    if (userId && plan) {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      // 同時存下 Stripe customer id，之後退訂可直接對應用戶（不必用 email 比對）
      const customerId = typeof session.customer === "string" ? session.customer : null;
      await supabase
        .from("profiles")
        .update({
          subscription_tier: plan,
          subscription_expires_at: expires.toISOString(),
          ...(customerId ? { stripe_customer_id: customerId } : {}),
        })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    // 1. 先用 stripe_customer_id 精準對應（不受用戶量影響）
    const { data: byCustomer } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    let targetUserId = byCustomer?.id ?? null;

    // 2. 後備：舊資料沒存 customer id 時，才用 email 對應
    if (!targetUserId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;
        if (email) {
          const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          targetUserId = users.find((u: { email?: string }) => u.email === email)?.id ?? null;
        }
      } catch (e) {
        console.error("[api] Stripe 退訂 email 後備對應失敗:", e);
      }
    }

    if (targetUserId) {
      await supabase
        .from("profiles")
        .update({ subscription_tier: "free", subscription_expires_at: null })
        .eq("id", targetUserId);
    } else {
      console.error("[api] Stripe 退訂找不到對應用戶, customer:", customerId);
    }
  }

  return NextResponse.json({ received: true });
}
