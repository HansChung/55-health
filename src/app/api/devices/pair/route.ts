// ────────────────────────────────────────────────
// 陪伴機器人 — 裝置端配對（無 cookie，機器人直接呼叫）
// POST { pairing_code, fw_version? }
//   → 驗證配對碼 → 產生長期 token（只回傳這一次）→ 存 SHA-256 雜湊
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { hashDeviceToken } from "@/lib/device-guard";
import { z } from "zod";

const PairSchema = z.object({
  pairing_code: z.string().regex(/^\d{6}$/, "配對碼是 6 位數字"),
  fw_version: z.string().max(30).optional(),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = PairSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "配對碼格式錯誤" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // 只接受未過期、尚未配對的配對碼
  const { data: device } = await supabase
    .from("devices")
    .select("id, name, pairing_expires_at, paired_at")
    .eq("pairing_code", body.pairing_code)
    .single();

  if (
    !device ||
    device.paired_at ||
    !device.pairing_expires_at ||
    new Date(device.pairing_expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "配對碼無效或已過期，請在 App 重新產生" },
      { status: 401 }
    );
  }

  // 產生 32 bytes 長期 token；DB 只存雜湊，原文只回傳這一次
  const token = randomBytes(32).toString("hex");

  const { error } = await supabase
    .from("devices")
    .update({
      token_hash: hashDeviceToken(token),
      pairing_code: null,
      pairing_expires_at: null,
      paired_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      fw_version: body.fw_version ?? null,
    })
    .eq("id", device.id);

  if (error) {
    console.error("[devices/pair] DB error:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({
    device_token: token,
    device_id: device.id,
    name: device.name,
  });
}
