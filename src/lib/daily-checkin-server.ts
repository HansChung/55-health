// ────────────────────────────────────────────────
// 每日平安打卡（只在 API route 用；service role）
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";
import { checkinFamilyRelievedPush, taipeiDay } from "@/lib/daily-checkin";

type Admin = ReturnType<typeof createSupabaseAdmin>;

const FAMILY_LINK = "/?open=caregiver";

/** 今天報過平安了嗎（台北日期）；還沒跑 SQL 就當作沒有 */
export async function todayCheckin(admin: Admin, userId: string, now = new Date()): Promise<string | null> {
  const { data, error } = await admin
    .from("daily_checkins")
    .select("checked_at")
    .eq("user_id", userId)
    .eq("day", taipeiDay(now))
    .maybeSingle();
  if (error) {
    console.warn("[checkin] load failed (add-daily-checkin.sql 跑了嗎？):", error.message);
    return null;
  }
  return (data as { checked_at: string } | null)?.checked_at ?? null;
}

/** 好幾位長輩今天報平安的時間 */
export async function todayCheckins(admin: Admin, userIds: string[], now = new Date()): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;
  const { data, error } = await admin.from("daily_checkins").select("user_id, checked_at").eq("day", taipeiDay(now)).in("user_id", userIds);
  if (error) return map;
  for (const r of (data ?? []) as { user_id: string; checked_at: string }[]) map.set(r.user_id, r.checked_at);
  return map;
}

/** 已接受的家人 */
export async function acceptedFamilyIds(admin: Admin, elderId: string): Promise<string[]> {
  const { data } = await admin.from("family_links").select("family_user_id").eq("owner_id", elderId).eq("status", "accepted");
  return ((data ?? []) as { family_user_id: string | null }[]).map((l) => l.family_user_id).filter((v): v is string => Boolean(v));
}

export async function elderName(admin: Admin, userId: string): Promise<string> {
  const { data } = await admin.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  return (data as { display_name: string | null } | null)?.display_name?.trim() || "長輩";
}

/** 報平安：今天第一次按才寫（重複按不會改時間） */
export async function recordCheckin(admin: Admin, userId: string, now = new Date()): Promise<{ checkedAt: string; first: boolean }> {
  const { data: inserted, error } = await admin
    .from("daily_checkins")
    .upsert({ user_id: userId, day: taipeiDay(now), checked_at: now.toISOString() }, { onConflict: "user_id,day", ignoreDuplicates: true })
    .select("checked_at");
  if (error) throw new Error(`record checkin failed: ${error.message}`);
  const first = ((inserted ?? []) as unknown[]).length > 0;
  const checkedAt = first ? now.toISOString() : (await todayCheckin(admin, userId, now)) ?? now.toISOString();
  return { checkedAt, first };
}

/** 今天已經通知過家人「還沒報平安」→ 再告訴家人「報平安了」（失敗只記 log） */
export async function notifyFamilyRelieved(admin: Admin, userId: string, checkedAt: string, now = new Date()): Promise<number> {
  const day = taipeiDay(now);
  const { data: prof } = await admin.from("profiles").select("checkin_alerted_on").eq("id", userId).maybeSingle();
  if ((prof as { checkin_alerted_on: string | null } | null)?.checkin_alerted_on !== day) return 0;
  const [family, name] = await Promise.all([acceptedFamilyIds(admin, userId), elderName(admin, userId)]);
  const msg = checkinFamilyRelievedPush({ elderName: name, checkedAt });
  let sent = 0;
  await Promise.all(
    family.map((fid) =>
      sendPushToUser(fid, { ...msg, url: FAMILY_LINK, tag: `checkin-${userId}-${day}` })
        .then((r) => { sent += r.sent; })
        .catch((e) => console.warn("[checkin] relieved push:", e))
    )
  );
  return sent;
}
