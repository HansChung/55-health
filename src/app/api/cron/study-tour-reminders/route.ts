// ────────────────────────────────────────────────
// 研學團行前提醒（Vercel Cron，見 vercel.json；CRON_SECRET 保護）
//   ?kind=day_before → 每天 20:00（台灣）提醒明天出發的團
//   ?kind=same_day   → 每天 06:00（台灣）提醒今天出發的團
// 每筆報名每種提醒只推一次，重跑不會重複
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendTourReminders } from "@/lib/study-tours-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kind = req.nextUrl.searchParams.get("kind");
  if (kind !== "day_before" && kind !== "same_day") {
    return NextResponse.json({ error: "kind must be day_before or same_day" }, { status: 400 });
  }
  try {
    const result = await sendTourReminders(createSupabaseAdmin(), kind);
    console.log(`[study-tour-reminders] ${kind}:`, result);
    return NextResponse.json({ ok: true, kind, ...result });
  } catch (e) {
    console.error("[study-tour-reminders] failed:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
