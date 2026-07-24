import { createHash } from "crypto";

/**
 * 陪伴機器人共用小工具（伺服器端）
 */

/** 台灣時區（UTC+8）的 YYYY-MM-DD；伺服器在 Vercel 是 UTC，不能用 getDate() */
export function taiwanDayKey(d: Date = new Date()): string {
  const taipei = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return taipei.toISOString().substring(0, 10);
}

/**
 * 同一台裝置同一天共用一個 conversations.session_id，
 * 管理後台的對話記錄才會把機器人一天的對話分在同一組。
 * 用 SHA-256 做成穩定的合法 UUID v4 格式（後端 zod 驗 uuid 才不會擋）。
 */
export function deviceDaySessionId(deviceId: string, now: Date = new Date()): string {
  const h = createHash("sha256").update(`${deviceId}:${taiwanDayKey(now)}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * 估算 WAV 音檔秒數（16-bit PCM）。
 * 讀 fmt chunk 的 byteRate（offset 28，little-endian）最準；
 * 讀不到就假設 16kHz 16-bit 單聲道（32000 bytes/秒）。
 */
export function estimateWavSeconds(buf: Buffer): number {
  let byteRate = 32000;
  if (buf.length > 44 && buf.toString("ascii", 0, 4) === "RIFF") {
    const parsed = buf.readUInt32LE(28);
    if (parsed > 0) byteRate = parsed;
  }
  const dataBytes = Math.max(0, buf.length - 44);
  return Math.max(1, Math.round(dataBytes / byteRate));
}

/** 台灣版「今天還沒吃的藥」（比照 medication-utils，但用台灣日界線；伺服器是 UTC） */
export function pendingMedsTaiwan(
  medications: import("./api-client").ProfileMedication[],
  now: Date = new Date()
): { med: import("./api-client").ProfileMedication; time: string }[] {
  const today = taiwanDayKey(now);
  return medications
    .filter((med) => med.reminder_enabled !== false)
    .filter((med) => (med.reminder_times?.length ?? 0) > 0)
    .filter((med) => !med.last_taken_at || taiwanDayKey(new Date(med.last_taken_at)) !== today)
    .flatMap((med) => (med.reminder_times ?? []).map((time) => ({ med, time })))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** 機器人 TFT 表情標籤 */
export type DeviceMood = "happy" | "care" | "alert" | "thinking";

export function normalizeMood(raw: unknown): DeviceMood {
  const m = String(raw ?? "").toLowerCase();
  if (m === "care" || m === "alert" || m === "thinking") return m;
  return "happy";
}
