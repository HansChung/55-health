// ────────────────────────────────────────────────
// 每日關懷問候
// 每天早上給「近 30 天有使用」的長輩一句個人化問候，提升黏著
// 有推播訂閱 → 推播（免費）；今天天氣推播已經送到的人（daily_weather_sent_on＝今天）不再多推
// 排在 08:00（天氣是 07:00，Hobby 方案會在那個小時內任何時間跑），天氣一定先跑完
// 沒推播 → 寄 Email，每天最多 DAILY_CARE_EMAIL_MAX 封（預設 60，Resend 免費版每天只能寄 100 封），最近有在用的人優先
// 由 Vercel Cron 觸發（見 vercel.json），CRON_SECRET 保護
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { buildDailyCareEmail } from "@/lib/email/templates";
import { mapWithConcurrency, createDeadline } from "@/lib/concurrency";
import { isWebPushConfigured, sendPushToUser } from "@/lib/push/send";
import { taipeiDate } from "@/lib/daily-weather";
import { isPlaceholderEmail } from "@/lib/line-login";
import { buildDailyCarePush, byLatestActivity, dailyCareChannel, dailyCareEmailMax } from "@/lib/daily-care";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const USER_CONCURRENCY = 6;
const TIME_BUDGET_MS = 45_000;
/** .in() 一次最多帶幾個 id（網址長度） */
const ID_CHUNK = 200;

interface Medication { reminder_enabled?: boolean }

interface ProfileRow {
  id: string;
  display_name?: string | null;
  medications?: unknown;
  notification_settings?: unknown;
  daily_weather_sent_on?: string | null;
}

const TIPS = [
  "記得多喝水，一天 6–8 杯剛剛好。",
  "飯後散步 10 分鐘，幫助消化也活動筋骨。",
  "今天的菜可以多一點蔬菜、少一點鹽。",
  "量一下血壓，記錄下來會更清楚自己的狀況。",
  "起身時慢一點，避免頭暈。",
  "曬點太陽、補充維生素 D，對骨頭很好。",
  "睡前少滑手機，幫助睡得更好。",
];

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86400000);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 86400000).toISOString();
  const since7 = new Date(now.getTime() - 7 * 86400000).toISOString();

  // 近 30 天有活動的 user（飲食 or 健康數值），記下每人最近一次的時間（Email 名額不夠時先給最近有在用的人）
  const [{ data: recentMeals }, { data: recentMetrics }] = await Promise.all([
    supabase.from("meals").select("user_id, eaten_at").gte("eaten_at", since30),
    supabase.from("health_metrics").select("user_id, measured_at").gte("measured_at", since30),
  ]);
  const latest = new Map<string, string>();
  const seen = (id: string, at: string | null | undefined) => {
    const t = at ?? "";
    if (!latest.has(id) || t > (latest.get(id) ?? "")) latest.set(id, t);
  };
  (recentMeals ?? []).forEach((r: { user_id: string; eaten_at: string | null }) => seen(r.user_id, r.eaten_at));
  (recentMetrics ?? []).forEach((r: { user_id: string; measured_at: string | null }) => seen(r.user_id, r.measured_at));
  if (latest.size === 0) return NextResponse.json({ ok: true, sent: 0 });

  const tip = TIPS[dayOfYear(now) % TIPS.length];
  const greeting = "早安";
  let sent = 0;
  let pushed = 0;
  let coveredByWeather = 0;
  let skippedForBudget = 0;
  let skippedForTime = 0;
  let emailLeft = dailyCareEmailMax();
  const pushReady = isWebPushConfigured();
  const today = taipeiDate(now);

  const userIds = byLatestActivity(latest).slice(0, 500);
  const deadline = createDeadline(TIME_BUDGET_MS);

  // 共用資料一次撈完（取代迴圈內每人各查一次 profile / email）
  const [profilesRes, emailMap] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, medications, notification_settings, daily_weather_sent_on")
      .in("id", userIds),
    loadUserEmails(supabase),
  ]);
  const profileById = new Map<string, ProfileRow>();
  for (const p of (profilesRes.data ?? []) as ProfileRow[]) profileById.set(p.id, p);

  // 誰有推播訂閱（讀不到就當沒有，改寄 Email，名額照樣有上限）
  const hasPush = new Set<string>();
  if (pushReady) {
    for (let i = 0; i < userIds.length; i += ID_CHUNK) {
      const { data: subs, error: subErr } = await supabase
        .from("push_subscriptions").select("user_id").in("user_id", userIds.slice(i, i + ID_CHUNK));
      if (subErr) {
        console.error("[cron] 每日關懷讀推播訂閱失敗:", subErr);
        break;
      }
      for (const s of (subs ?? []) as { user_id: string }[]) hasPush.add(s.user_id);
    }
  }

  await mapWithConcurrency(userIds, USER_CONCURRENCY, async (userId) => {
    if (deadline.expired) {
      skippedForTime++;
      return;
    }

    const profile = profileById.get(userId);
    if (!profile) return;

    // 尊重關閉設定（預設開啟）
    const ns = (profile.notification_settings ?? {}) as { daily_care?: { on?: boolean } };
    const channel = dailyCareChannel({
      off: ns.daily_care?.on === false,
      hasPush: hasPush.has(userId),
      weatherSentToday: profile.daily_weather_sent_on === today,
    });
    if (channel === "off") return;
    if (channel === "weather") {
      coveredByWeather++;
      return;
    }

    const email = emailMap.get(userId);
    // Email 先佔名額再查資料（同時跑好幾位，不會超寄）
    const takeEmailSlot = (): boolean => {
      // 只用 LINE 登入的帳號沒有真的 Email，不佔名額
      if (!email || isPlaceholderEmail(email)) return false;
      if (emailLeft <= 0) {
        skippedForBudget++;
        return false;
      }
      emailLeft--;
      return true;
    };
    if (channel === "email" && !takeEmailSlot()) return;

    const name = profile.display_name ?? "您";

    // 個人化內容
    const lines: string[] = [];

    // 昨天有沒有記錄
    const yStart = new Date(now.getTime() - 24 * 3600 * 1000);
    const { count: yMeals } = await supabase
      .from("meals").select("*", { count: "exact", head: true })
      .eq("user_id", userId).gte("eaten_at", yStart.toISOString());
    if ((yMeals ?? 0) > 0) lines.push(`昨天您記錄了 ${yMeals} 餐，做得很好，繼續保持！`);
    else lines.push("昨天還沒看到您的記錄，今天拍張照片就能輕鬆開始喔。");

    // 最近血壓
    const { data: bp } = await supabase
      .from("health_metrics").select("systolic, diastolic")
      .eq("user_id", userId).eq("metric_type", "blood_pressure")
      .gte("measured_at", since7).order("measured_at", { ascending: false }).limit(1);
    if (bp?.[0]?.systolic != null) {
      const s = bp[0].systolic, d = bp[0].diastolic;
      lines.push(s >= 140 || d >= 90
        ? `最近血壓 ${s}/${d}，記得清淡飲食、按時量測。`
        : `最近血壓 ${s}/${d}，很穩定，真棒！`);
    }

    // 用藥提醒
    const meds = (profile.medications ?? []) as Medication[];
    if (meds.some((m) => m?.reminder_enabled)) {
      lines.push("別忘了今天的藥要按時吃喔。");
    }

    if (channel === "push") {
      const msg = buildDailyCarePush({ name, lines, tip });
      const res = await sendPushToUser(userId, { ...msg, url: "/", tag: `daily-care-${today}` }).catch((e) => {
        console.warn("[cron] 每日關懷推播失敗:", e);
        return { sent: 0, removed: 0 };
      });
      if (res.sent > 0) {
        pushed++;
        return;
      }
      // 訂閱都失效了（換手機、清掉資料）→ 改寄 Email
      if (!takeEmailSlot()) return;
    }

    const res = await sendEmail({
      to: email!,
      subject: `${greeting}，${name}　暖暖來關心您了 ☀️`,
      html: buildDailyCareEmail({ name, greeting, lines: ["新的一天開始囉，暖暖來跟您問聲好 ☀️", ...lines], tip }),
    });
    if (res.ok) sent++;
  });

  if (skippedForTime > 0) {
    console.error(`[cron] 每日關懷時間不足，${skippedForTime} 位未送出（總數 ${userIds.length}）`);
  }
  if (skippedForBudget > 0) {
    console.warn(`[cron] 每日關懷 Email 名額用完，${skippedForBudget} 位沒寄（上限 ${dailyCareEmailMax()} 封）`);
  }

  return NextResponse.json({
    ok: true,
    active: latest.size,
    sent,
    pushed,
    covered_by_weather: coveredByWeather,
    skipped_for_budget: skippedForBudget,
    skipped_for_time: skippedForTime,
    took_ms: deadline.elapsedMs,
    ran_at: now.toISOString(),
  });
}

/** 一次載入所有使用者 email（取代迴圈內逐筆 getUserById） */
async function loadUserEmails(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    for (let page = 1; page <= 10; page++) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      const users = data?.users ?? [];
      for (const u of users) if (u.email) map.set(u.id, u.email);
      if (users.length < 1000) break;
    }
  } catch (e) {
    console.error("[cron] 載入使用者 email 失敗:", e);
  }
  return map;
}
