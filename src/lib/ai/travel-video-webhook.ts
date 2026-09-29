/**
 * 出遊影片 — 邁笙平台完成回呼（notify_url）相關的純函式
 * 平台回呼不帶簽章：文件建議用高熵、只有自己知道的路徑當共享密鑰，
 * 收到回呼後一律用 task_id 反查平台狀態，回呼內容本身不採信
 */
import { timingSafeEqual } from "node:crypto";

const MIN_SECRET_LENGTH = 16;

/** 平台抓得到的公網 https 網址（本機 localhost 平台連不到） */
export function isPublicHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  } catch {
    return false;
  }
}

/** 需同時有 LK888_WEBHOOK_SECRET 與公網 https 的 NEXT_PUBLIC_APP_URL，否則不送回呼（改靠輪詢） */
export function travelVideoNotifyUrl(
  env: Record<string, string | undefined> = process.env
): string | null {
  const secret = env.LK888_WEBHOOK_SECRET;
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  if (!secret || secret.length < MIN_SECRET_LENGTH || !appUrl || !isPublicHttpsUrl(appUrl)) {
    return null;
  }
  return `${new URL(appUrl).origin}/api/webhooks/lk888/${encodeURIComponent(secret)}`;
}

export function webhookSecretMatches(given: string, expected: string | undefined): boolean {
  if (!expected || expected.length < MIN_SECRET_LENGTH) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
