// ────────────────────────────────────────────────
// 每天早上的天氣＋健康提醒（Web Push）
// 對象：notification_settings.daily_weather 有開、選了縣市、這台裝置有訂閱推播的人
// 一個請求查全部縣市的氣象署預報；每人先「搶」今天的記號（daily_weather_sent_on）才發，同一天不重複
// 由 Vercel Cron 觸發（見 vercel.json，23:00 UTC＝台灣 7 點），CRON_SECRET 保護；需要 CWA_API_KEY、VAPID
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isWebPushConfigured, sendPushToUser } from "@/lib/push/send";
import { countiesForecast, isWeatherConfigured } from "@/lib/weather-server";
import { buildDailyWeatherPush, dailyWeatherCounty, taipeiDate, todayAndTonight } from "@/lib/daily-weather";
import { createDeadline, mapWithConcurrency } from "@/lib/concurrency";
import type { TaiwanCounty } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const USER_CONCURRENCY = 8;
const TIME_BUDGET_MS = 45_000;
const MAX_USERS = 2000;
const ID_CHUNK = 300;

interface ProfileRow {
  id: string;
  chronic_conditions: string[] | null;
  notification_settings: Record<string, unknown> | null;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isWeatherConfigured() || !isWebPushConfigured()) {
    return NextResponse.json({ ok: true, skipped: "CWA_API_KEY 或 VAPID 金鑰沒設定" });
  }

  const admin = createSupabaseAdmin();
  const now = new Date();
  const today = taipeiDate(now);
  const deadline = createDeadline(TIME_BUDGET_MS);

  // 有選縣市、今天還沒發過的人
  const { data, error } = await admin
    .from("profiles")
    .select("id, chronic_conditions, notification_settings")
    .not("notification_settings->daily_weather->>county", "is", null)
    .or(`daily_weather_sent_on.is.null,daily_weather_sent_on.lt.${today}`)
    .order("id")
    .limit(MAX_USERS);
  if (error) {
    console.error("[cron] daily-weather profiles:", error);
    return NextResponse.json({ error: "讀取失敗" }, { status: 500 });
  }
  const candidates = ((data ?? []) as ProfileRow[])
    .map((p) => ({ ...p, county: dailyWeatherCounty(p.notification_settings) }))
    .filter((p): p is ProfileRow & { county: TaiwanCounty } => p.county !== null);

  // 只發給有訂閱推播的人（沒訂閱的不搶記號，之後開了推播當天還收得到）
  const subscribed = new Set<string>();
  for (let i = 0; i < candidates.length; i += ID_CHUNK) {
    const ids = candidates.slice(i, i + ID_CHUNK).map((p) => p.id);
    const { data: subs, error: subErr } = await admin.from("push_subscriptions").select("user_id").in("user_id", ids);
    if (subErr) {
      console.error("[cron] daily-weather subscriptions:", subErr);
      return NextResponse.json({ error: "讀取失敗" }, { status: 500 });
    }
    for (const s of (subs ?? []) as { user_id: string }[]) subscribed.add(s.user_id);
  }
  const targets = candidates.filter((p) => subscribed.has(p.id));
  if (targets.length === 0) return NextResponse.json({ ok: true, candidates: candidates.length, sent: 0 });

  const forecasts = await countiesForecast(targets.map((p) => p.county));
  let sent = 0;
  let noForecast = 0;
  let skippedForTime = 0;

  await mapWithConcurrency(targets, USER_CONCURRENCY, async (p) => {
    if (deadline.expired) {
      skippedForTime++;
      return;
    }
    const periods = forecasts.get(p.county);
    const pair = periods ? todayAndTonight(periods, now) : null;
    if (!pair) {
      noForecast++;
      return;
    }
    // 搶今天的記號：搶到才發（重跑、同時跑都不會發兩次）
    const { data: claimed, error: claimErr } = await admin
      .from("profiles")
      .update({ daily_weather_sent_on: today })
      .eq("id", p.id)
      .or(`daily_weather_sent_on.is.null,daily_weather_sent_on.lt.${today}`)
      .select("id");
    if (claimErr || !claimed?.length) {
      if (claimErr) console.warn("[cron] daily-weather claim:", claimErr.message);
      return;
    }
    const msg = buildDailyWeatherPush({ county: p.county, ...pair, conditions: p.chronic_conditions ?? [] });
    const res = await sendPushToUser(p.id, { ...msg, url: "/", tag: `daily-weather-${today}` }).catch((e) => {
      console.warn("[cron] daily-weather push:", e);
      return { sent: 0 };
    });
    if (res.sent > 0) sent++;
  });

  if (skippedForTime > 0) console.error(`[cron] 天氣提醒時間不足，${skippedForTime} 位未發（總數 ${targets.length}）`);
  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    targets: targets.length,
    counties: forecasts.size,
    sent,
    no_forecast: noForecast,
    skipped_for_time: skippedForTime,
    took_ms: deadline.elapsedMs,
  });
}
