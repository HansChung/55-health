// ────────────────────────────────────────────────
// 回診提醒的排程（Vercel Cron，見 vercel.json；CRON_SECRET 保護；需要 VAPID）
// ?kind=day_before：明天的回診（12:00 UTC＝台北晚上 8 點）
// ?kind=same_day  ：今天的回診（23:00 UTC＝台北早上 7 點）
// 每筆先「搶」記號（reminded_*_at）才發，重跑不會重複；notify_family 的話家人也收到
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isWebPushConfigured, sendPushToUser } from "@/lib/push/send";
import { appointmentFamilyPush, appointmentPush, parseReminderKind, taipeiDate, type ClinicAppointment } from "@/lib/clinic-appointments";
import { APPOINTMENT_COLUMNS, toClientAppointment } from "@/lib/clinic-appointments-server";
import { acceptedFamilyIds, elderName } from "@/lib/daily-checkin-server";
import { createDeadline, mapWithConcurrency } from "@/lib/concurrency";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONCURRENCY = 8;
const TIME_BUDGET_MS = 45_000;
const PAGE = 500;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kind = parseReminderKind(req.nextUrl.searchParams.get("kind"));
  if (!kind) return NextResponse.json({ error: "kind 不對" }, { status: 400 });
  if (!isWebPushConfigured()) return NextResponse.json({ ok: true, skipped: "VAPID 金鑰沒設定" });

  const admin = createSupabaseAdmin();
  const now = new Date();
  const day = taipeiDate(now, kind === "day_before" ? 1 : 0);
  const col = kind === "day_before" ? "reminded_day_before_at" : "reminded_same_day_at";
  const deadline = createDeadline(TIME_BUDGET_MS);

  let found = 0;
  let elders = 0;
  let family = 0;
  let skippedForTime = false;
  // 每一輪拿還沒提醒的前 PAGE 筆；處理完都會搶走記號，所以下一輪從頭拿就是下一批
  while (!deadline.expired) {
    const { data, error } = await admin
      .from("clinic_appointments")
      .select(`${APPOINTMENT_COLUMNS}, user_id`)
      .eq("appt_date", day)
      .is(col, null)
      .order("id")
      .limit(PAGE);
    if (error) {
      console.error("[cron] clinic-reminders load:", error);
      return NextResponse.json({ error: "讀取失敗（add-clinic-appointments.sql 跑了嗎？）" }, { status: 500 });
    }
    const rows = (data ?? []) as (Record<string, unknown> & { user_id: string })[];
    if (rows.length === 0) break;
    found += rows.length;
    let claimedAny = false;

    await mapWithConcurrency(rows, CONCURRENCY, async (row) => {
      if (deadline.expired) {
        skippedForTime = true;
        return;
      }
      const { data: claimed, error: claimErr } = await admin
        .from("clinic_appointments")
        .update({ [col]: new Date().toISOString() })
        .eq("id", row.id as string)
        .is(col, null)
        .select("id");
      if (claimErr || !claimed?.length) {
        if (claimErr) console.warn("[cron] clinic-reminders claim:", claimErr.message);
        return;
      }
      claimedAny = true;
      const a: ClinicAppointment = toClientAppointment(row);
      const tag = `clinic-${a.id}-${kind}`;
      const res = await sendPushToUser(row.user_id, { ...appointmentPush(a, kind), url: "/?open=clinic", tag }).catch((e) => {
        console.warn("[cron] clinic-reminders push:", e);
        return { sent: 0 };
      });
      if (res.sent > 0) elders++;
      if (!a.notify_family) return;
      const [ids, name] = await Promise.all([acceptedFamilyIds(admin, row.user_id), elderName(admin, row.user_id)]);
      const msg = appointmentFamilyPush(a, kind, name);
      for (const fid of ids) {
        const r = await sendPushToUser(fid, { ...msg, url: "/?open=caregiver", tag }).catch((e) => {
          console.warn("[cron] clinic-reminders family push:", e);
          return { sent: 0 };
        });
        if (r.sent > 0) family++;
      }
    });
    // 這一輪一筆都沒搶到（都被別的執行搶走、或資料庫出錯）：不要一直重拿同一批
    if (!claimedAny) break;
  }
  if (deadline.expired) skippedForTime = true;
  if (skippedForTime) console.error(`[cron] 回診提醒時間不足（${kind}，${day}），沒處理到的這次收不到`);

  return NextResponse.json({ ok: true, kind, day, found, elders_notified: elders, family_notified: family, skipped_for_time: skippedForTime, took_ms: deadline.elapsedMs });
}
