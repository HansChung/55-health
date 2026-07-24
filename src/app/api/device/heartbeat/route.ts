// ────────────────────────────────────────────────
// 陪伴機器人 — 心跳（裝置 token 認證）
//
// POST { fw_version? } → 更新 last_seen_at，回傳「現在該播報的提醒」。
// 「該播報」= 提醒時間已到、且在 30 分鐘內、且今天還沒吃。
// 機器人端自己記住播過的 id，避免重複唸（伺服器不存播報狀態）。
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireDevice, touchDevice } from "@/lib/device-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { taiwanDayKey, pendingMedsTaiwan } from "@/lib/device-utils";
import type { ProfileMedication } from "@/lib/api-client";

const ANNOUNCE_WINDOW_MIN = 30;

export async function POST(req: NextRequest) {
  const device = await requireDevice(req);
  if (!device) return NextResponse.json({ error: "裝置未授權" }, { status: 401 });

  let fwVersion: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.fw_version === "string") fwVersion = body.fw_version.substring(0, 30);
  } catch {}
  await touchDevice(device.deviceId, fwVersion);

  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, medications")
    .eq("id", device.userId)
    .single();

  const now = new Date();
  const pending = pendingMedsTaiwan((profile?.medications ?? []) as ProfileMedication[], now);

  // 台灣現在時刻（分鐘），拿來跟 "HH:MM" 提醒時間比
  const taiwanNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const nowMinutes = taiwanNow.getUTCHours() * 60 + taiwanNow.getUTCMinutes();

  const name = profile?.display_name || "";
  const due = pending.filter(({ time }) => {
    const [h, m] = time.split(":").map(Number);
    const t = h * 60 + m;
    return nowMinutes >= t && nowMinutes - t <= ANNOUNCE_WINDOW_MIN;
  });

  return NextResponse.json({
    ok: true,
    now: now.toISOString(),
    taiwan_day: taiwanDayKey(now),
    pending_count: pending.length,
    announcements: due.map(({ med, time }) => ({
      id: `${taiwanDayKey(now)}-${med.name}-${time}`, // 機器人用這個 id 去重
      speech_text: `${name ? name + "，" : ""}吃藥時間到了，記得吃${med.name}${med.dose ? "，" + med.dose : ""}喔。`,
    })),
  });
}
