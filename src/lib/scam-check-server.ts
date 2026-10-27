// ────────────────────────────────────────────────
// 這則訊息可疑嗎？（只在 API route 用；service role）：資料列 → 畫面格式、通知家人
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";
import { normalizeScamCheckResult, scamPushForFamily, type ScamCheck, type ScamVerdict } from "@/lib/scam-check";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export interface ScamCheckRow {
  id: string;
  user_id: string;
  verdict: ScamVerdict;
  result: unknown;
  input_kind: "image" | "text" | "both";
  shared_at: string | null;
  created_at: string;
}

export function toClientScamCheck(row: ScamCheckRow): ScamCheck | null {
  try {
    const r = normalizeScamCheckResult({ ...(row.result as object), verdict: row.verdict });
    return { ...r, id: row.id, created_at: row.created_at, shared_at: row.shared_at };
  } catch {
    return null;
  }
}

export async function acceptedFamilyIds(admin: Admin, ownerId: string): Promise<string[]> {
  const { data } = await admin
    .from("family_links")
    .select("family_user_id")
    .eq("owner_id", ownerId)
    .eq("status", "accepted");
  return [
    ...new Set(((data ?? []) as { family_user_id: string | null }[]).map((l) => l.family_user_id).filter((v): v is string => Boolean(v))),
  ];
}

/** 推播給已連結的家人；回傳實際送到幾支手機（沒開通知的家人仍看得到家人狀況裡的紀錄） */
export async function pushScamCheckToFamily(admin: Admin, row: ScamCheckRow, familyIds: string[]): Promise<number> {
  const { data: profile } = await admin.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle();
  const elderName = (profile as { display_name: string | null } | null)?.display_name?.trim() || "長輩";
  const check = toClientScamCheck(row);
  if (!check) return 0;
  const message = scamPushForFamily({ elderName, verdict: check.verdict, title: check.title });
  const results = await Promise.all(
    familyIds.map((uid) =>
      sendPushToUser(uid, { ...message, url: "/?open=caregiver", tag: `scam-check-${row.id}` }).catch((e) => {
        console.warn("[scam-check] push failed:", e);
        return { sent: 0, removed: 0 };
      })
    )
  );
  return results.reduce((n, r) => n + r.sent, 0);
}
