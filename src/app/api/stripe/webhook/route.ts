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
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;
    if (userId && plan) {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      await supabase
        .from("profiles")
        .update({
          subscription_tier: plan,
          subscription_expires_at: expires.toISOString(),
        })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customer = await stripe.customers.retrieve(sub.customer as string);
    const email = (customer as Stripe.Customer).email;
    if (email) {
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const user = users.find((u: { email?: string }) => u.email === email);
      if (user) {
        await supabase
          .from("profiles")
          .update({ subscription_tier: "free", subscription_expires_at: null })
          .eq("id", user.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
