// ────────────────────────────────────────────────
// 陪伴機器人 — 今日提醒（裝置 token 認證）
//
// GET → 回傳「今天還沒吃的藥」+「健康警示」，附好唸的 speech_text。
// 重用 App 的 medication-utils / health-alerts 純函式（server 端直接 import），
// 但時間一律換算台灣時區（Vercel 伺服器是 UTC）。
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireDevice, touchDevice } from "@/lib/device-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { generateHealthAlerts } from "@/lib/health-alerts";
import type { HealthMetric, MealRecord, ProfileMedication } from "@/lib/api-client";
import { taiwanDayKey, pendingMedsTaiwan } from "@/lib/device-utils";

const TW_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 把絕對時間往後平移 8 小時：之後用 UTC 欄位比較 = 用台灣日曆比較 */
function shiftToTaiwan(iso: string): string {
  return new Date(new Date(iso).getTime() + TW_OFFSET_MS).toISOString();
}

export async function GET(req: NextRequest) {
  const device = await requireDevice(req);
  if (!device) return NextResponse.json({ error: "裝置未授權" }, { status: 401 });
  void touchDevice(device.deviceId);

  const supabase = createSupabaseAdmin();
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: profile }, { data: meals }, { data: metrics }] = await Promise.all([
    supabase.from("profiles").select("display_name, medications").eq("id", device.userId).single(),
    supabase.from("meals").select("id, meal_type, eaten_at").eq("user_id", device.userId).gte("eaten_at", since),
    supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", device.userId)
      .gte("measured_at", since)
      .order("measured_at", { ascending: false }),
  ]);

  const medications: ProfileMedication[] = profile?.medications ?? [];
  const pending = pendingMedsTaiwan(medications, now);

  // 健康警示：把時間全部平移成台灣時間再丟進共用函式
  const taiwanNow = new Date(now.getTime() + TW_OFFSET_MS);
  const alerts = generateHealthAlerts({
    meals: (meals ?? []).map((m: { eaten_at: string }) => ({ ...m, eaten_at: shiftToTaiwan(m.eaten_at) })) as MealRecord[],
    metrics: (metrics ?? []) as HealthMetric[],
    medications: medications.map((med) => ({
      ...med,
      last_taken_at: med.last_taken_at ? shiftToTaiwan(med.last_taken_at) : med.last_taken_at,
    })),
    now: taiwanNow,
  });

  const name = profile?.display_name || "";
  const reminders = pending.map(({ med, time }) => ({
    id: `${med.name}-${time}`,
    time,
    med_name: med.name,
    dose: med.dose ?? null,
    speech_text: `${name ? name + "，" : ""}${time.startsWith("2") || time.startsWith("19") ? "晚上" : Number(time.slice(0, 2)) < 12 ? "早上" : "下午"}${time} 記得吃${med.name}${med.dose ? "，" + med.dose : ""}喔。`,
  }));

  return NextResponse.json({
    now: now.toISOString(),
    taiwan_day: taiwanDayKey(now),
    reminders,
    alerts: alerts.map((a) => ({
      id: a.id,
      level: a.level,
      speech_text: `${a.title}。${a.message}`,
    })),
  });
}
