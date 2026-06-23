// ────────────────────────────────────────────────
// 每日關懷推播（Email）
// 每天早上寄一句個人化問候給「近 30 天有使用」的長輩，提升黏著
// 由 Vercel Cron 觸發（見 vercel.json），CRON_SECRET 保護
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { buildDailyCareEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Medication { reminder_enabled?: boolean }

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

  // 近 30 天有活動的 user（飲食 or 健康數值）
  const [{ data: recentMeals }, { data: recentMetrics }] = await Promise.all([
    supabase.from("meals").select("user_id").gte("eaten_at", since30),
    supabase.from("health_metrics").select("user_id").gte("measured_at", since30),
  ]);
  const activeIds = new Set<string>();
  (recentMeals ?? []).forEach((r: { user_id: string }) => activeIds.add(r.user_id));
  (recentMetrics ?? []).forEach((r: { user_id: string }) => activeIds.add(r.user_id));
  if (activeIds.size === 0) return NextResponse.json({ ok: true, sent: 0 });

  const tip = TIPS[dayOfYear(now) % TIPS.length];
  const greeting = "早安";
  let sent = 0;

  for (const userId of Array.from(activeIds).slice(0, 200)) {
    // 個資 + 偏好
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, medications, notification_settings")
      .eq("id", userId)
      .single();
    if (!profile) continue;

    // 尊重關閉設定（預設開啟）
    const ns = (profile.notification_settings ?? {}) as { daily_care?: { on?: boolean } };
    if (ns.daily_care?.on === false) continue;

    const { data: famData } = await supabase.auth.admin.getUserById(userId);
    const email = famData?.user?.email;
    if (!email) continue;

    const name = profile.display_name ?? "您";

    // 個人化內容
    const lines: string[] = ["新的一天開始囉，暖暖來跟您問聲好 ☀️"];

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

    const res = await sendEmail({
      to: email,
      subject: `${greeting}，${name}　暖暖來關心您了 ☀️`,
      html: buildDailyCareEmail({ name, greeting, lines, tip }),
    });
    if (res.ok) sent++;
  }

  return NextResponse.json({ ok: true, active: activeIds.size, sent, ran_at: now.toISOString() });
}
