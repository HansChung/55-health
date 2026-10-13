// ────────────────────────────────────────────────
// 每日平安打卡的排程（Vercel Cron，見 vercel.json；CRON_SECRET 保護；需要 VAPID）
// ?step=remind&slot=12：截止時間是 12 點、今天還沒報平安的長輩 → 推播提醒長輩
// ?step=alert&slot=12 ：兩個小時後還是沒報平安 → 推播通知家人（Hobby 排程在那個小時內某個時間跑，隔兩小時才保證至少差一小時）
// 每人先「搶」今天的記號（checkin_reminded_on／checkin_alerted_on）才發，重跑也不會重複
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isWebPushConfigured, sendPushToUser } from "@/lib/push/send";
import { checkinFamilyAlertPush, checkinReminderPush, checkinSetting, parseCheckinCronParams, taipeiDay } from "@/lib/daily-checkin";
import { acceptedFamilyIds, todayCheckins } from "@/lib/daily-checkin-server";
import { createDeadline, mapWithConcurrency } from "@/lib/concurrency";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const USER_CONCURRENCY = 8;
const TIME_BUDGET_MS = 45_000;
const MAX_USERS = 2000;
const ID_CHUNK = 300;

interface ProfileRow {
  id: string;
  display_name: string | null;
  notification_settings: Record<string, unknown> | null;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = parseCheckinCronParams(req.nextUrl.searchParams.get("step"), req.nextUrl.searchParams.get("slot"));
  if (!params) return NextResponse.json({ error: "step／slot 不對" }, { status: 400 });
  if (!isWebPushConfigured()) return NextResponse.json({ ok: true, skipped: "VAPID 金鑰沒設定" });

  const admin = createSupabaseAdmin();
  const now = new Date();
  const today = taipeiDay(now);
  const deadline = createDeadline(TIME_BUDGET_MS);
  const claimCol = params.step === "remind" ? "checkin_reminded_on" : "checkin_alerted_on";

  // 有開平安打卡、今天這一步還沒做過的人；截止時間在程式裡比（沒存時間的人算預設 12 點）
  const { data, error } = await admin
    .from("profiles")
    .select("id, display_name, notification_settings")
    .eq("notification_settings->daily_checkin->>on", "true")
    .or(`${claimCol}.is.null,${claimCol}.lt.${today}`)
    .order("id")
    .limit(MAX_USERS);
  if (error) {
    console.error("[cron] daily-checkin profiles:", error);
    return NextResponse.json({ error: "讀取失敗（add-daily-checkin.sql 跑了嗎？）" }, { status: 500 });
  }
  const inSlot = ((data ?? []) as ProfileRow[]).filter(
    (p) => checkinSetting(p.notification_settings?.daily_checkin).deadline === params.slot
  );

  // 今天已經報平安的不用管
  const checked = new Map<string, string>();
  for (let i = 0; i < inSlot.length; i += ID_CHUNK) {
    const part = await todayCheckins(admin, inSlot.slice(i, i + ID_CHUNK).map((p) => p.id), now);
    for (const [k, v] of part) checked.set(k, v);
  }
  const targets = inSlot.filter((p) => !checked.has(p.id));

  let notified = 0;
  let skippedForTime = 0;
  await mapWithConcurrency(targets, USER_CONCURRENCY, async (p) => {
    if (deadline.expired) {
      skippedForTime++;
      return;
    }
    // 搶今天的記號：搶到才發（重跑、同時跑都不會發兩次）
    const { data: claimed, error: claimErr } = await admin
      .from("profiles")
      .update({ [claimCol]: today })
      .eq("id", p.id)
      .or(`${claimCol}.is.null,${claimCol}.lt.${today}`)
      .select("id");
    if (claimErr || !claimed?.length) {
      if (claimErr) console.warn("[cron] daily-checkin claim:", claimErr.message);
      return;
    }
    if (params.step === "remind") {
      const res = await sendPushToUser(p.id, { ...checkinReminderPush(), url: "/", tag: `checkin-${today}` }).catch((e) => {
        console.warn("[cron] daily-checkin remind push:", e);
        return { sent: 0 };
      });
      if (res.sent > 0) notified++;
      return;
    }
    const family = await acceptedFamilyIds(admin, p.id);
    const msg = checkinFamilyAlertPush({ elderName: p.display_name?.trim() || "長輩", deadline: params.slot });
    const results = await Promise.all(
      family.map((fid) =>
        sendPushToUser(fid, { ...msg, url: "/?open=caregiver", tag: `checkin-${p.id}-${today}` }).catch((e) => {
          console.warn("[cron] daily-checkin alert push:", e);
          return { sent: 0 };
        })
      )
    );
    if (results.some((r) => r.sent > 0)) notified++;
  });

  if (skippedForTime > 0) console.error(`[cron] 平安打卡時間不足，${skippedForTime} 位未處理（總數 ${targets.length}）`);
  return NextResponse.json({
    ok: true,
    step: params.step,
    slot: params.slot,
    enabled: inSlot.length,
    checked_in: checked.size,
    targets: targets.length,
    notified,
    skipped_for_time: skippedForTime,
    took_ms: deadline.elapsedMs,
  });
}
