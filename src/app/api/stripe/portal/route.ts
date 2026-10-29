// 「管理訂閱」：送去 Stripe 的訂閱管理頁（改方案、取消、換信用卡、看收據）
// POST → { url }
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServer } from "@/lib/supabase/server";
import { portalUrl } from "@/lib/stripe-portal-server";

export async function POST() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Stripe 未設定" }, { status: 500 });

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  const customerId = (profile?.stripe_customer_id as string | null) ?? null;
  if (!customerId) return NextResponse.json({ error: "還沒有在暖暖付款訂閱過" }, { status: 404 });

  try {
    return NextResponse.json({ url: await portalUrl(new Stripe(stripeKey), customerId) });
  } catch (e) {
    console.error("[api] Stripe 訂閱管理頁建立失敗:", e);
    return NextResponse.json({ error: "訂閱管理頁暫時打不開，請稍後再試" }, { status: 500 });
  }
}
