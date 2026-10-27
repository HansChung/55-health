// ────────────────────────────────────────────────
// 訂閱結帳
// 已經有訂閱的人 → 不再開新的（以前升級會多一份訂閱、兩份一起扣），改送去 Stripe 的訂閱管理頁換方案
// 新訂閱 → 沿用同一個 Stripe 客戶；訂閱上記 user_id，webhook 才找得到人
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServer } from "@/lib/supabase/server";
import { appUrl, hasLiveSubscription, portalUrl } from "@/lib/stripe-portal-server";

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

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();
  if (profileErr) {
    console.error("[api] Stripe checkout 讀會員失敗:", profileErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const customerId = (profile?.stripe_customer_id as string | null) ?? null;
  const subscriptionId = (profile?.stripe_subscription_id as string | null) ?? null;

  try {
    if (customerId && (await hasLiveSubscription(stripe, subscriptionId))) {
      return NextResponse.json({ url: await portalUrl(stripe, customerId), portal: true });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId ? { customer: customerId } : { customer_email: user.email }),
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id, plan } },
      success_url: appUrl("/?subscribed=1"),
      cancel_url: appUrl("/pricing"),
      metadata: { user_id: user.id, plan },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[api] Stripe checkout 建立失敗:", e);
    return NextResponse.json({ error: "結帳建立失敗，請稍後再試" }, { status: 500 });
  }
}
