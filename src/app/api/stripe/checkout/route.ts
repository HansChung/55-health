import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServer } from "@/lib/supabase/server";

const PLAN_PRICE: Record<string, string | undefined> = {
  basic: process.env.STRIPE_PRICE_BASIC,
  pro: process.env.STRIPE_PRICE_PRO,
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let rawPlan: unknown;
  try {
    ({ plan: rawPlan } = await req.json());
  } catch {
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }
  const plan = typeof rawPlan === "string" ? rawPlan : "";
  const priceId = PLAN_PRICE[plan];
  if (!priceId) return NextResponse.json({ error: "方案不存在" }, { status: 400 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Stripe 未設定" }, { status: 500 });

  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?subscribed=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { user_id: user.id, plan },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[api] Stripe checkout 建立失敗:", e);
    return NextResponse.json({ error: "結帳建立失敗，請稍後再試" }, { status: 500 });
  }
}
