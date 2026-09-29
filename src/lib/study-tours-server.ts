// ────────────────────────────────────────────────
// 研學團：伺服器端讀資料、推播（只在 API route 用；service role）
// ────────────────────────────────────────────────

import { randomBytes } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";
import {
  buildStudyTourView,
  studyTourErrorFromDb,
  summarizeSeats,
  type AdminStudyTour,
  type AdminStudyTourRegistration,
  type AdminStudyTourStop,
  type StudyTourElder,
  type StudyTourRegistrationRow,
  type StudyTourRow,
  type StudyTourStampRow,
  type StudyTourStopRow,
  type StudyTourView,
} from "@/lib/study-tours";

type Admin = ReturnType<typeof createSupabaseAdmin>;

/** 給長輩看的站點欄位（不含 stamp_token） */
const PUBLIC_STOP_COLUMNS = "id, tour_id, position, name, description, fun_fact, stamp_emoji";
const REG_COLUMNS =
  "id, tour_id, user_id, registered_by, participant_name, participant_phone, party_size, note, status, source, completed_at, cancelled_at, created_at";

/** QR 上的蓋章代碼：128 bit 亂數，猜不到 */
export function generateStampToken(): string {
  return randomBytes(16).toString("base64url");
}

/** SQL 函式回傳的 uuid 清單（PostgREST 可能給純字串或 { 函式名: 值 }） */
export function rpcIdList(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => (item && typeof item === "object" ? Object.values(item as Record<string, unknown>)[0] : item))
    .filter((v): v is string => typeof v === "string");
}

/** DB／SQL 函式錯誤 → HTTP 狀態與中文訊息 */
export function studyTourDbError(error: { message?: string } | null | undefined): { status: number; message: string } {
  return studyTourErrorFromDb(error?.message) ?? { status: 500, message: "伺服器忙線中，請稍後再試" };
}

/** 我是哪些長輩的「已接受」家人 → 可以幫他們報名 */
export async function loadLinkedElders(admin: Admin, userId: string): Promise<StudyTourElder[]> {
  const { data: links } = await admin
    .from("family_links")
    .select("owner_id")
    .eq("family_user_id", userId)
    .eq("status", "accepted");
  const ids = [...new Set(((links ?? []) as { owner_id: string }[]).map((l) => l.owner_id))].filter((id) => id !== userId);
  if (ids.length === 0) return [];
  const { data: profiles } = await admin.from("profiles").select("id, display_name").in("id", ids);
  const names = new Map(((profiles ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name]));
  return ids.map((id) => ({ id, name: names.get(id)?.trim() || "家人" }));
}

export async function isLinkedElder(admin: Admin, familyUserId: string, elderId: string): Promise<boolean> {
  const { data } = await admin
    .from("family_links")
    .select("id")
    .eq("family_user_id", familyUserId)
    .eq("owner_id", elderId)
    .eq("status", "accepted")
    .limit(1);
  return (data ?? []).length > 0;
}

/**
 * 長輩畫面要的全部資料：
 *   - 還沒結束的已發布研學團（找活動）
 *   - 我報名過／幫家人報名過的研學團（我的護照，含已結束的）
 */
export async function loadStudyToursForUser(admin: Admin, userId: string, now: Date = new Date()): Promise<StudyTourView[]> {
  const { data: myRegData, error: myRegError } = await admin
    .from("study_tour_registrations")
    .select(REG_COLUMNS)
    .or(`user_id.eq.${userId},registered_by.eq.${userId}`)
    .neq("status", "cancelled");
  if (myRegError) throw myRegError;
  const myRegs = (myRegData ?? []) as StudyTourRegistrationRow[];

  const { data: upcomingData, error: upcomingError } = await admin
    .from("study_tours")
    .select("*")
    .eq("status", "published")
    .gte("ends_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(50);
  if (upcomingError) throw upcomingError;

  const tours = new Map<string, StudyTourRow>(((upcomingData ?? []) as StudyTourRow[]).map((t) => [t.id, t]));
  const missing = [...new Set(myRegs.map((r) => r.tour_id))].filter((id) => !tours.has(id));
  if (missing.length > 0) {
    const { data: mine, error } = await admin
      .from("study_tours")
      .select("*")
      .in("id", missing)
      .in("status", ["published", "cancelled"]); // 草稿（後台還在改）不給長輩看
    if (error) throw error;
    for (const t of (mine ?? []) as StudyTourRow[]) tours.set(t.id, t);
  }
  if (tours.size === 0) return [];

  const ids = [...tours.keys()];
  const [stopsRes, regsRes, stampsRes] = await Promise.all([
    admin.from("study_tour_stops").select(PUBLIC_STOP_COLUMNS).in("tour_id", ids),
    admin
      .from("study_tour_registrations")
      .select("id, tour_id, status, party_size, created_at")
      .in("tour_id", ids)
      .neq("status", "cancelled"),
    admin.from("study_tour_stamps").select("tour_id, stop_id, user_id, stamped_at").in("tour_id", ids).eq("user_id", userId),
  ]);
  if (stopsRes.error) throw stopsRes.error;
  if (regsRes.error) throw regsRes.error;
  if (stampsRes.error) throw stampsRes.error;

  const stops = (stopsRes.data ?? []) as StudyTourStopRow[];
  const regs = (regsRes.data ?? []) as Pick<StudyTourRegistrationRow, "id" | "tour_id" | "status" | "party_size" | "created_at">[];
  const stamps = (stampsRes.data ?? []) as StudyTourStampRow[];

  return [...tours.values()]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map((tour) =>
      buildStudyTourView({
        tour,
        stops: stops.filter((s) => s.tour_id === tour.id),
        activeRegs: regs.filter((r) => r.tour_id === tour.id),
        myRegs: myRegs.filter((r) => r.tour_id === tour.id),
        myStamps: stamps.filter((s) => s.tour_id === tour.id),
        userId,
        now,
      })
    );
}

/** 推給報名的人；家人幫忙報的也推給家人 */
async function pushToRegistration(reg: StudyTourRegistrationRow, message: { title: string; body: string }, tag: string) {
  const targets = new Set([reg.user_id, reg.registered_by].filter((id): id is string => Boolean(id)));
  await Promise.all(
    [...targets].map((uid) =>
      sendPushToUser(uid, { ...message, url: `/?open=study-tours&tour=${reg.tour_id}`, tag }).catch((e) =>
        console.warn("[study-tours] push failed:", e)
      )
    )
  );
}

async function tourTitles(admin: Admin, tourIds: string[]): Promise<Map<string, string>> {
  if (tourIds.length === 0) return new Map();
  const { data } = await admin.from("study_tours").select("id, title").in("id", tourIds);
  return new Map(((data ?? []) as { id: string; title: string }[]).map((t) => [t.id, t.title]));
}

/** 候補轉正取 → 推播通知（失敗不影響主流程） */
export async function notifyPromoted(admin: Admin, registrationIds: string[]): Promise<void> {
  if (registrationIds.length === 0) return;
  try {
    const { data } = await admin.from("study_tour_registrations").select(REG_COLUMNS).in("id", registrationIds);
    const regs = (data ?? []) as StudyTourRegistrationRow[];
    const titles = await tourTitles(admin, [...new Set(regs.map((r) => r.tour_id))]);
    await Promise.all(
      regs.map((r) =>
        pushToRegistration(
          r,
          {
            title: "🎉 候補轉正取了！",
            body: `「${titles.get(r.tour_id) ?? "研學團"}」有名額了，${r.participant_name} 已經報名成功`,
          },
          `study-tour-promoted-${r.id}`
        )
      )
    );
  } catch (e) {
    console.warn("[study-tours] notifyPromoted failed:", e);
  }
}

/** 後台把活動改成「取消」→ 通知所有報名的人 */
export async function notifyTourCancelled(admin: Admin, tourId: string): Promise<void> {
  try {
    const { data } = await admin
      .from("study_tour_registrations")
      .select(REG_COLUMNS)
      .eq("tour_id", tourId)
      .neq("status", "cancelled");
    const regs = (data ?? []) as StudyTourRegistrationRow[];
    const title = (await tourTitles(admin, [tourId])).get(tourId) ?? "研學團";
    await Promise.all(
      regs.map((r) =>
        pushToRegistration(
          r,
          { title: "研學團取消通知", body: `很抱歉，「${title}」這次取消了，詳情請聯絡主辦單位` },
          `study-tour-cancelled-${tourId}`
        )
      )
    );
  } catch (e) {
    console.warn("[study-tours] notifyTourCancelled failed:", e);
  }
}

// ── 後台 ──

export async function loadAdminTours(admin: Admin): Promise<AdminStudyTour[]> {
  const { data, error } = await admin.from("study_tours").select("*").order("starts_at", { ascending: false });
  if (error) throw error;
  const tours = (data ?? []) as StudyTourRow[];
  if (tours.length === 0) return [];
  const ids = tours.map((t) => t.id);
  const [regsRes, stopsRes] = await Promise.all([
    admin.from("study_tour_registrations").select("tour_id, status, party_size, completed_at").in("tour_id", ids),
    admin.from("study_tour_stops").select("tour_id").in("tour_id", ids),
  ]);
  if (regsRes.error) throw regsRes.error;
  if (stopsRes.error) throw stopsRes.error;
  const regs = (regsRes.data ?? []) as Pick<StudyTourRegistrationRow, "tour_id" | "status" | "party_size" | "completed_at">[];
  const stops = (stopsRes.data ?? []) as { tour_id: string }[];

  return tours.map((t) => {
    const tourRegs = regs.filter((r) => r.tour_id === t.id);
    const seats = summarizeSeats(t.capacity, tourRegs);
    return {
      ...t,
      walking_level: (t.walking_level as 1 | 2 | 3) ?? 1,
      counts: {
        confirmed_people: seats.confirmed_people,
        waitlisted_people: seats.waitlisted_people,
        registrations: tourRegs.filter((r) => r.status !== "cancelled").length,
        stops: stops.filter((s) => s.tour_id === t.id).length,
        completed: tourRegs.filter((r) => r.status !== "cancelled" && r.completed_at).length,
      },
    };
  });
}

export async function loadAdminTourDetail(
  admin: Admin,
  tourId: string
): Promise<{ stops: AdminStudyTourStop[]; registrations: AdminStudyTourRegistration[] } | null> {
  const { data: tour } = await admin.from("study_tours").select("id").eq("id", tourId).maybeSingle();
  if (!tour) return null;

  const [stopsRes, regsRes, stampsRes] = await Promise.all([
    admin.from("study_tour_stops").select("*").eq("tour_id", tourId).order("position").order("created_at"),
    admin.from("study_tour_registrations").select(REG_COLUMNS).eq("tour_id", tourId).order("created_at"),
    admin.from("study_tour_stamps").select("stop_id, user_id").eq("tour_id", tourId),
  ]);
  if (stopsRes.error) throw stopsRes.error;
  if (regsRes.error) throw regsRes.error;
  if (stampsRes.error) throw stampsRes.error;
  const stamps = (stampsRes.data ?? []) as { stop_id: string; user_id: string }[];

  const stops = ((stopsRes.data ?? []) as Required<StudyTourStopRow>[]).map((s) => ({
    id: s.id,
    tour_id: s.tour_id,
    position: s.position,
    name: s.name,
    description: s.description,
    fun_fact: s.fun_fact,
    stamp_emoji: s.stamp_emoji,
    stamp_token: s.stamp_token,
    stamp_count: stamps.filter((st) => st.stop_id === s.id).length,
  }));

  const registrations = ((regsRes.data ?? []) as StudyTourRegistrationRow[]).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    participant_name: r.participant_name,
    participant_phone: r.participant_phone,
    party_size: r.party_size,
    note: r.note,
    status: r.status,
    source: r.source,
    registered_by_family: Boolean(r.registered_by && r.registered_by !== r.user_id),
    stamp_count: stamps.filter((st) => st.user_id === r.user_id).length,
    completed_at: r.completed_at,
    created_at: r.created_at,
    cancelled_at: r.cancelled_at,
  }));

  return { stops, registrations };
}

/** 新站點排在最後 */
export async function nextStopPosition(admin: Admin, tourId: string): Promise<number> {
  const { data } = await admin
    .from("study_tour_stops")
    .select("position")
    .eq("tour_id", tourId)
    .order("position", { ascending: false })
    .limit(1);
  const last = (data ?? [])[0] as { position: number } | undefined;
  return last ? last.position + 1 : 1;
}
