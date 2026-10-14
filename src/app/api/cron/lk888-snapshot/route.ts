// 每天記一次 lk888 的累計用量和餘額（後台「每月成本」用來算每個月實際扣了多少）
// Vercel Cron（見 vercel.json，15:00 UTC＝台北晚上 11 點那一小時）：記成「今天結束時」的累計；CRON_SECRET 保護；只查詢，不扣點
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { fetchLk888Balance, saveSnapshot } from "@/lib/admin-costs-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const balance = await fetchLk888Balance();
  if (!balance) return NextResponse.json({ ok: true, skipped: "LK888_API_KEY 沒設或查不到" });
  await saveSnapshot(createSupabaseAdmin(), balance);
  return NextResponse.json({ ok: true, ...balance });
}
