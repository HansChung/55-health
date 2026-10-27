// ────────────────────────────────────────────────
// 家人邀請碼：長輩在「家人共享」產生 → 家人在「家人狀況」輸入，連上長輩
// 新的碼是 8 位數字（1234-5678，用加密亂數，猜不到）；之前發出、還沒過期的 6 位數（123-456）也收
// ────────────────────────────────────────────────
import { randomInt } from "node:crypto";

export function generateInviteCode(): string {
  const n = randomInt(0, 100_000_000).toString().padStart(8, "0");
  return `${n.slice(0, 4)}-${n.slice(4)}`;
}

/** 使用者打的碼 → 資料庫裡的格式；空白、全形數字、少打或多打橫線都沒關係；位數不對回 null */
export function normalizeInviteCode(input: string): string | null {
  const digits = input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length === 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return null;
}

export type InviteCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** 這張邀請能不能由這個人接受（找不到碼由呼叫端處理） */
export function checkInvite(
  link: { owner_id: string; status: string; family_user_id: string | null; invite_expires_at: string | null },
  me: string,
  now: Date = new Date(),
): InviteCheck {
  if (link.owner_id === me) return { ok: false, status: 400, error: "這是你自己產生的邀請碼，請把它給家人輸入" };
  if (link.status !== "pending" || link.family_user_id) return { ok: false, status: 409, error: "這個邀請碼已經用過了，請長輩重新產生一個" };
  if (link.invite_expires_at && new Date(link.invite_expires_at).getTime() <= now.getTime()) {
    return { ok: false, status: 410, error: "邀請碼過期了（24 小時內有效），請長輩重新產生一個" };
  }
  return { ok: true };
}
