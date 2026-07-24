import { createHash } from "crypto";
import { createSupabaseAdmin } from "./supabase/server";

/**
 * 陪伴機器人（ESP32）裝置認證
 *
 * 機器人沒辦法做 Google 登入，改用「長期裝置 token」：
 * 1. App 端產生 6 位數配對碼（POST /api/devices）
 * 2. 機器人拿配對碼換 token（POST /api/devices/pair）
 * 3. 之後所有裝置 API 都帶 Authorization: Bearer <token>
 *    → 這裡以 SHA-256 雜湊比對 devices.token_hash 解出 user_id
 *
 * 對照 admin-guard.ts 的寫法：驗證失敗一律回 null，由路由回 401。
 */

export interface DeviceAuth {
  deviceId: string;
  userId: string;
  name: string;
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 從 Request 的 Bearer token 驗證裝置，回傳裝置身分或 null */
export async function requireDevice(req: Request): Promise<DeviceAuth | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  // token 為 32 bytes hex（64 字元），太短直接拒絕，省一次 DB 查詢
  if (token.length < 32) return null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("devices")
    .select("id, user_id, name")
    .eq("token_hash", hashDeviceToken(token))
    .single();

  if (error || !data) return null;
  return { deviceId: data.id, userId: data.user_id, name: data.name };
}

/** 更新裝置最後上線時間（fire-and-forget 用） */
export async function touchDevice(deviceId: string, fwVersion?: string) {
  const supabase = createSupabaseAdmin();
  const patch: Record<string, string> = { last_seen_at: new Date().toISOString() };
  if (fwVersion) patch.fw_version = fwVersion;
  await supabase.from("devices").update(patch).eq("id", deviceId);
}
