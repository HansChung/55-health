// ────────────────────────────────────────────────
// 模擬感測事件（demo 用）
// 登入長輩本人觸發 → 首次自動建立示範裝置 → 注入事件走正式接收管線
// 未來換成 LifeSmart webhook 時，這支可移除，接收邏輯（ingestIoTEvent）照用
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { ingestIoTEvent } from "@/lib/iot/ingest";
import { DEVICE_META, type DeviceKind, type EventKind } from "@/lib/iot/types";
import { z } from "zod";

const Body = z.object({
  eventKind: z.enum(["activity", "fall", "sos", "leave_bed", "in_bed", "environment"]),
});

// 事件 → 該由哪種裝置發出
const EVENT_DEVICE: Record<EventKind, DeviceKind> = {
  activity: "presence",
  fall: "presence",
  sos: "sos",
  leave_bed: "bed",
  in_bed: "bed",
  environment: "env",
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // 1. 確保示範裝置存在（首次自動建立 4 台）
  const { data: existing } = await admin
    .from("iot_devices")
    .select("id, kind")
    .eq("user_id", user.id);

  let devices: { id: string; kind: string }[] = existing ?? [];
  if (devices.length === 0) {
    const seed = (["presence", "bed", "sos", "env"] as DeviceKind[]).map((kind) => ({
      user_id: user.id,
      kind,
      name: DEVICE_META[kind].label,
      room: DEVICE_META[kind].defaultRoom,
      source: "mock",
    }));
    const { data: created } = await admin.from("iot_devices").insert(seed).select("id, kind");
    devices = created ?? [];
  }

  // 2. 找對應裝置
  const wantKind = EVENT_DEVICE[body.eventKind];
  const device = devices.find((d) => d.kind === wantKind) ?? devices[0];

  // 3. 組事件資料
  let data: Record<string, unknown> = {};
  if (body.eventKind === "environment") {
    // demo：故意給偏高溫，觸發警報
    data = { temp: 31, humidity: 68 };
  } else if (body.eventKind === "leave_bed") {
    data = { duration_min: 35 };
  }

  // 4. 走正式接收管線（會視情況通知家人）
  const result = await ingestIoTEvent(admin, {
    userId: user.id,
    deviceId: device?.id ?? null,
    eventKind: body.eventKind,
    data,
    source: "mock",
  });

  return NextResponse.json({ ok: true, ...result });
}
