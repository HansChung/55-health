// ────────────────────────────────────────────────
// 研學團：伺服器端讀資料、推播（只在 API route 用；service role）
// ────────────────────────────────────────────────

import { randomBytes } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";
import { tourForecast, tourForecasts } from "@/lib/weather-server";
import { toTourWeather, weatherReminderText } from "@/lib/weather";
import {
  arrivalMessage,
  buildStudyTourView,
  reminderMessage,
  sanitizeBroadcast,
  studyTourErrorFromDb,
  summarizeSeats,
  tourStartsOn,
  waitlistPositions,
  type TourReminderKind,
  type AdminStudyTour,
  type AdminStudyTourRegistration,
  type AdminStudyTourStop,
  type StudyTourBroadcast,
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
/** 報到欄位是 add-study-tour-day-ops.sql 加的 */
const ADMIN_REG_COLUMNS = `${REG_COLUMNS}, checked_in_at`;
const BROADCAST_COLUMNS = "id, tour_id, message, created_at";

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
/** 每一團各抓最新 5 則廣播（一起查再 limit 的話，一團廣播很多就會把別團擠掉） */
async function loadLatestBroadcasts(
  admin: Admin,
  tourIds: string[]
): Promise<{ data: (StudyTourBroadcast & { tour_id: string })[]; error: { message: string } | null }> {
  const results = await Promise.all(
    tourIds.map((tourId) =>
      admin
        .from("study_tour_broadcasts")
        .select(BROADCAST_COLUMNS)
        .eq("tour_id", tourId)
        .order("created_at", { ascending: false })
        .limit(5)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { data: [], error: failed.error };
  return { data: results.flatMap((r) => (r.data ?? []) as (StudyTourBroadcast & { tour_id: string })[]), error: null };
}

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
  const myTourIds = [...new Set(myRegs.map((r) => r.tour_id))];
  const [stopsRes, regsRes, stampsRes, broadcastsRes] = await Promise.all([
    admin.from("study_tour_stops").select(PUBLIC_STOP_COLUMNS).in("tour_id", ids),
    admin
      .from("study_tour_registrations")
      .select("id, tour_id, status, party_size, created_at")
      .in("tour_id", ids)
      .neq("status", "cancelled"),
    admin.from("study_tour_stamps").select("tour_id, stop_id, user_id, stamped_at").in("tour_id", ids).eq("user_id", userId),
    loadLatestBroadcasts(admin, myTourIds),
  ]);
  if (stopsRes.error) throw stopsRes.error;
  if (regsRes.error) throw regsRes.error;
  if (stampsRes.error) throw stampsRes.error;
  // 廣播表是後加的（add-study-tour-day-ops.sql）：還沒建就當沒有廣播，不要整頁壞掉
  if (broadcastsRes.error) console.warn("[study-tours] broadcasts unavailable:", broadcastsRes.error.message);
  const broadcasts = broadcastsRes.error ? [] : broadcastsRes.data;

  const stops = (stopsRes.data ?? []) as StudyTourStopRow[];
  const regs = (regsRes.data ?? []) as Pick<StudyTourRegistrationRow, "id" | "tour_id" | "status" | "party_size" | "created_at">[];
  const stamps = (stampsRes.data ?? []) as StudyTourStampRow[];

  // 36 小時內要出發的活動：附上出發那個時段的天氣（同一個縣市 30 分鐘內共用一次查詢）
  const weather = new Map(
    await Promise.all(
      [...tours.values()]
        .filter((t) => t.status === "published" && isWithinForecast(t.starts_at, now))
        .map(async (t) => {
          const f = await tourForecast(t);
          return [t.id, f ? toTourWeather(f.county, f.period) : null] as const;
        })
    )
  );

  return [...tours.values()]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map((tour) => ({
      ...buildStudyTourView({
        tour,
        stops: stops.filter((s) => s.tour_id === tour.id),
        activeRegs: regs.filter((r) => r.tour_id === tour.id),
        myRegs: myRegs.filter((r) => r.tour_id === tour.id),
        myStamps: stamps.filter((s) => s.tour_id === tour.id),
        broadcasts: broadcasts
          .filter((b) => b.tour_id === tour.id)
          .map(({ id, message, created_at }) => ({ id, message, created_at })),
        userId,
        now,
      }),
      weather: weather.get(tour.id) ?? null,
    }));
}

/** 預報只有未來 36 小時（氣象署 F-C0032-001） */
function isWithinForecast(startsAt: string, now: Date): boolean {
  const t = new Date(startsAt).getTime() - now.getTime();
  return t > -3 * 3600_000 && t < 36 * 3600_000;
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
): Promise<{
  stops: AdminStudyTourStop[];
  registrations: AdminStudyTourRegistration[];
  broadcasts: (StudyTourBroadcast & { recipients: number })[];
} | null> {
  const { data: tour } = await admin.from("study_tours").select("id").eq("id", tourId).maybeSingle();
  if (!tour) return null;

  const [stopsRes, regsRes, stampsRes, broadcastsRes] = await Promise.all([
    admin.from("study_tour_stops").select("*").eq("tour_id", tourId).order("position").order("created_at"),
    admin.from("study_tour_registrations").select(ADMIN_REG_COLUMNS).eq("tour_id", tourId).order("created_at"),
    admin.from("study_tour_stamps").select("stop_id, user_id").eq("tour_id", tourId),
    admin
      .from("study_tour_broadcasts")
      .select(`${BROADCAST_COLUMNS}, recipients`)
      .eq("tour_id", tourId)
      .order("created_at", { ascending: false })
      .limit(20),
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
    checked_in_at: r.checked_in_at ?? null,
  }));

  if (broadcastsRes.error) console.warn("[study-tours] broadcasts unavailable:", broadcastsRes.error.message);
  const broadcasts = ((broadcastsRes.error ? [] : broadcastsRes.data) ?? []).map(
    (b: { id: string; message: string; created_at: string; recipients: number }) => ({
      id: b.id,
      message: b.message,
      created_at: b.created_at,
      recipients: b.recipients,
    })
  );

  return { stops, registrations, broadcasts };
}

/** 站點增減後重新判斷誰集滿（失敗只記 log，不影響站點本身的修改） */
export async function syncTourCompletion(admin: Admin, tourId: string): Promise<void> {
  const { error } = await admin.rpc("study_tour_sync_completion", { p_tour_id: tourId });
  if (error) console.error("[study-tours] sync completion failed:", error);
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

// ── 出發當天：集合廣播、行前提醒、家人抵達通知 ──

/** 推播給一群人（同一人只推一次）；回傳推到幾個人、幾台裝置 */
async function pushToUsers(
  userIds: Iterable<string>,
  message: { title: string; body: string },
  url: string,
  tag: string
): Promise<{ users: number; devices: number }> {
  const unique = [...new Set([...userIds].filter(Boolean))];
  const results = await Promise.all(
    unique.map((uid) =>
      sendPushToUser(uid, { ...message, url, tag }).catch((e) => {
        console.warn("[study-tours] push failed:", e);
        return { sent: 0, removed: 0 };
      })
    )
  );
  return { users: unique.length, devices: results.reduce((n, r) => n + r.sent, 0) };
}

/** 行前提醒每批幾筆報名（一次標記、一起推播） */
const REMINDER_BATCH = 50;

function tourDeepLink(tourId: string) {
  return `/?open=study-tours&tour=${tourId}`;
}

/**
 * 集合廣播：存一筆紀錄（長輩的活動頁看得到），再推播給正取的人（家人代報的也推給家人）。
 * 回傳收到的人數與推到幾台裝置（沒開推播的人仍然可以在 App 裡看到）
 */
export async function broadcastToTour(
  admin: Admin,
  tourId: string,
  rawMessage: string,
  sentBy: string
): Promise<{ id: string; recipients: number; devices: number } | { error: string; status: number }> {
  const message = sanitizeBroadcast(rawMessage);
  if (!message) return { error: "請輸入要廣播的內容", status: 400 };
  const { data: tour } = await admin.from("study_tours").select("id, title").eq("id", tourId).maybeSingle();
  if (!tour) return { error: "找不到這個研學團", status: 404 };

  const { data: regsData, error: regsError } = await admin
    .from("study_tour_registrations")
    .select("user_id, registered_by")
    .eq("tour_id", tourId)
    .eq("status", "confirmed");
  if (regsError) throw regsError;
  const regs = (regsData ?? []) as { user_id: string; registered_by: string | null }[];
  const targets = new Set<string>();
  for (const r of regs) {
    targets.add(r.user_id);
    if (r.registered_by) targets.add(r.registered_by);
  }

  const { data: row, error } = await admin
    .from("study_tour_broadcasts")
    .insert({ tour_id: tourId, message, sent_by: sentBy, recipients: regs.length })
    .select("id")
    .single();
  if (error || !row) throw error ?? new Error("broadcast insert failed");

  const { devices } = await pushToUsers(
    targets,
    { title: `📢 ${(tour as { title: string }).title}`, body: message },
    tourDeepLink(tourId),
    `study-tour-broadcast-${(row as { id: string }).id}`
  );
  return { id: (row as { id: string }).id, recipients: regs.length, devices };
}

/**
 * 行前提醒（每天排程跑）：前一天晚上／當天早上，推給明天／今天出發的團員。
 * 每種提醒每筆報名只推一次（reminded_*_at），排程重跑也不會重複
 */
export async function sendTourReminders(
  admin: Admin,
  kind: TourReminderKind,
  now: Date = new Date()
): Promise<{ tours: number; reminded: number; devices: number }> {
  // 抓前後兩天內出發的已發布研學團，再用台灣日期精準比對
  const from = new Date(now.getTime() - 36 * 3600_000).toISOString();
  const to = new Date(now.getTime() + 60 * 3600_000).toISOString();
  // select *：weather_county 是 add-study-tour-weather.sql 加的，還沒跑 SQL 時也不會壞
  const { data: toursData, error } = await admin
    .from("study_tours")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", from)
    .lte("starts_at", to);
  if (error) throw error;
  const tours = ((toursData ?? []) as StudyTourRow[]).filter(
    (t) => tourStartsOn(t, kind, now) && new Date(t.starts_at).getTime() > now.getTime()
  );

  const column = kind === "day_before" ? "reminded_day_before_at" : "reminded_same_day_at";
  // 出發那個時段的天氣（中央氣象署）：所有團一起查、整體最多等 8 秒；沒設金鑰或查不到就不帶
  const forecasts = await tourForecasts(tours);
  let reminded = 0;
  let devices = 0;
  for (const tour of tours) {
    const forecast = forecasts.get(tour.id);
    const weather = forecast ? weatherReminderText(forecast.period) : null;
    const { data: regsData, error: regsError } = await admin
      .from("study_tour_registrations")
      .select(`id, user_id, registered_by, participant_name, status, created_at, ${column}`)
      .eq("tour_id", tour.id)
      .neq("status", "cancelled");
    if (regsError) throw regsError;
    const regs = (regsData ?? []) as unknown as Array<{
      id: string; user_id: string; registered_by: string | null; participant_name: string;
      status: StudyTourRegistrationRow["status"]; created_at: string;
    } & Record<string, string | null>>;
    const positions = waitlistPositions(regs);

    // 先算好每個人要收到什麼；沒有訊息的（例如當天早上還在候補）不標記，之後轉正取仍收得到
    const pending = regs.flatMap((reg) => {
      if (reg[column]) return [];
      const base = { status: reg.status, participant_name: reg.participant_name, waitlist_position: positions.get(reg.id) ?? null };
      const participantMsg = reminderMessage(kind, tour, { ...base, for_self: true }, weather);
      if (!participantMsg) return [];
      const family = reg.registered_by && reg.registered_by !== reg.user_id ? reg.registered_by : null;
      const familyMsg = family ? reminderMessage(kind, tour, { ...base, for_self: false }, weather) : null;
      return [{ reg, participantMsg, family, familyMsg }];
    });

    // 一批一批：整批一次標記（只有標記成功的才推，排程同時跑兩次也不會重複），再並行推播，
    // 大團（上限 500 人）也能在排程時限內跑完
    for (let i = 0; i < pending.length; i += REMINDER_BATCH) {
      const batch = pending.slice(i, i + REMINDER_BATCH);
      const { data: claimedData, error: claimError } = await admin
        .from("study_tour_registrations")
        .update({ [column]: new Date().toISOString() })
        .in("id", batch.map((p) => p.reg.id))
        .is(column, null)
        .select("id");
      if (claimError) throw claimError;
      const claimed = new Set(((claimedData ?? []) as { id: string }[]).map((r) => r.id));

      const url = tourDeepLink(tour.id);
      const sent = await Promise.all(
        batch
          .filter((p) => claimed.has(p.reg.id))
          .map(async ({ reg, participantMsg, family, familyMsg }) => {
            const tag = `study-tour-${kind}-${reg.id}`;
            const [self, fam] = await Promise.all([
              pushToUsers([reg.user_id], participantMsg, url, tag),
              // 家人代報的：也提醒家人（訊息帶上長輩的名字）
              family && familyMsg ? pushToUsers([family], familyMsg, url, `${tag}-family`) : Promise.resolve({ users: 0, devices: 0 }),
            ]);
            return self.devices + fam.devices;
          })
      );
      reminded += sent.length;
      devices += sent.reduce((n, d) => n + d, 0);
    }
  }
  return { tours: tours.length, reminded, devices };
}

/**
 * 家人抵達通知：長輩掃碼蓋到新的章 → 推給「長輩同意分享研學動態」的家人（family_links.permissions.trips）。
 * 預設不通知；失敗不影響蓋章
 */
export async function notifyFamilyArrival(
  admin: Admin,
  input: { elderId: string; tourId: string; tourTitle: string; stopName: string; stampedCount: number; totalStops: number; justCompleted: boolean }
): Promise<number> {
  try {
    const { data: links } = await admin
      .from("family_links")
      .select("family_user_id, permissions")
      .eq("owner_id", input.elderId)
      .eq("status", "accepted");
    const targets = ((links ?? []) as { family_user_id: string | null; permissions: Record<string, boolean> | null }[])
      .filter((l) => l.family_user_id && l.permissions?.trips === true)
      .map((l) => l.family_user_id as string);
    if (targets.length === 0) return 0;

    const { data: profile } = await admin.from("profiles").select("display_name").eq("id", input.elderId).maybeSingle();
    const elderName = (profile as { display_name: string | null } | null)?.display_name?.trim() || "家人";
    const message = arrivalMessage({ ...input, elderName });
    const { users, devices } = await pushToUsers(
      targets,
      message,
      "/?open=caregiver",
      `study-tour-arrival-${input.tourId}-${input.elderId}`
    );
    console.info(`[study-tours] arrival notice → ${users} family member(s), ${devices} device(s)`);
    return users;
  } catch (e) {
    console.warn("[study-tours] notifyFamilyArrival failed:", e);
    return 0;
  }
}
