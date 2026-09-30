// ────────────────────────────────────────────────
// 研學團：帶長輩出門走走、學新知、集章（前後端共用的型別與純函式）
//
// 報名只登記不收費（費用只顯示文字，由旅行社另外收）；名額滿了排候補，
// 有人取消就依序遞補。每一站貼一張 QR Code，長輩用手機相機掃了就蓋章，集滿拿結業證書。
// 名額／候補／蓋章的規則在 supabase/add-study-tours.sql 的函式裡（鎖住活動，避免超賣）。
// ────────────────────────────────────────────────

import { z } from "zod";
import { isHttpUrl } from "./url-safety";

export type StudyTourStatus = "draft" | "published" | "cancelled";
export type StudyTourRegistrationStatus = "confirmed" | "waitlisted" | "cancelled";
export type StudyTourRegistrationSource = "app" | "onsite";
export type WalkingLevel = 1 | 2 | 3;

export const STUDY_TOUR_TIME_ZONE = "Asia/Taipei";
/** 一次最多幫幾個人報名（本人＋同行家人） */
export const MAX_PARTY_SIZE = 4;
/** 蓋章開放時間：出發前幾小時～結束後幾小時（和 SQL 的 study_tour_stamp 一致） */
export const STAMP_OPENS_HOURS_BEFORE = 3;
export const STAMP_CLOSES_HOURS_AFTER = 12;
/** 深連結：/?open=study-tours（&tour=活動 id） */
export const STUDY_TOURS_DEEP_LINK = "/?open=study-tours";

export const WALKING_LEVELS: { level: WalkingLevel; emoji: string; label: string; desc: string }[] = [
  { level: 1, emoji: "🪑", label: "走路少", desc: "大多坐車，走幾步就到，常常休息" },
  { level: 2, emoji: "🚶", label: "走路適中", desc: "每段走 10～20 分鐘，路面平坦" },
  { level: 3, emoji: "🥾", label: "走路較多", desc: "有坡道或階梯，每段要走 30 分鐘以上" },
];

export function walkingLevelMeta(level: number) {
  return WALKING_LEVELS.find((w) => w.level === level) ?? WALKING_LEVELS[0];
}

export const STAMP_EMOJIS = ["🏮", "🏯", "⛩️", "🌸", "🍵", "🌾", "🐟", "🌳", "🏞️", "🎨", "📜", "🧧", "🚂", "⛰️", "🌊", "🍊"];

// ── 給長輩看的畫面資料 ──

export interface StudyTourStopView {
  id: string;
  position: number;
  name: string;
  description: string;
  stamp_emoji: string;
  /** 有蓋到章的時間（沒蓋＝null） */
  stamped_at: string | null;
  /** 小知識：蓋章後才看得到 */
  fun_fact: string | null;
}

export interface StudyTourRegistrationView {
  id: string;
  /** 參加者帳號（我自己，或我幫忙報名的已連結長輩） */
  participant_user_id: string;
  participant_name: string;
  participant_phone: string;
  party_size: number;
  note: string;
  status: StudyTourRegistrationStatus;
  source: StudyTourRegistrationSource;
  /** true＝報名的是自己；false＝幫家人報名 */
  for_self: boolean;
  /** 候補第幾位（正取＝null） */
  waitlist_position: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface StudyTourView {
  id: string;
  title: string;
  summary: string;
  description: string;
  organizer_name: string;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string;
  meeting_point: string;
  fee_text: string;
  capacity: number;
  walking_level: WalkingLevel;
  accessibility_note: string;
  contact_phone: string;
  registration_deadline: string | null;
  status: StudyTourStatus;
  seats_left: number;
  waitlist_count: number;
  registration_open: boolean;
  stops: StudyTourStopView[];
  /** 我的報名（自己的＋我幫家人報的，不含已取消） */
  registrations: StudyTourRegistrationView[];
}

export interface StudyTourElder {
  id: string;
  name: string;
}

export interface StudyTourStampResult {
  tour_id: string;
  tour_title: string;
  stop: { id: string; name: string; description: string; stamp_emoji: string; fun_fact: string };
  newly_stamped: boolean;
  stamped_count: number;
  total_stops: number;
  completed: boolean;
  just_completed: boolean;
}

// ── 後台 ──

export interface AdminStudyTour {
  id: string;
  title: string;
  summary: string;
  description: string;
  organizer_name: string;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string;
  meeting_point: string;
  fee_text: string;
  capacity: number;
  walking_level: WalkingLevel;
  accessibility_note: string;
  contact_phone: string;
  registration_deadline: string | null;
  status: StudyTourStatus;
  created_at: string;
  updated_at: string;
  counts: { confirmed_people: number; waitlisted_people: number; registrations: number; stops: number; completed: number };
}

export interface AdminStudyTourStop {
  id: string;
  tour_id: string;
  position: number;
  name: string;
  description: string;
  fun_fact: string;
  stamp_emoji: string;
  stamp_token: string;
  stamp_count: number;
}

export interface AdminStudyTourRegistration {
  id: string;
  user_id: string;
  participant_name: string;
  participant_phone: string;
  party_size: number;
  note: string;
  status: StudyTourRegistrationStatus;
  source: StudyTourRegistrationSource;
  registered_by_family: boolean;
  stamp_count: number;
  completed_at: string | null;
  created_at: string;
  cancelled_at: string | null;
}

// ── 時間（台灣時間） ──

const TAIPEI_OFFSET = "+08:00";

/** 後台 <input type="datetime-local"> 的值（台灣時間）→ ISO；格式不對回 null */
export function taipeiInputToIso(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00${TAIPEI_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO → 後台 datetime-local 的值（台灣時間 YYYY-MM-DDTHH:mm） */
export function isoToTaipeiInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = taipeiParts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function taipeiParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDY_TOUR_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    year: get("year"), month: get("month"), day: get("day"),
    hour: get("hour"), minute: get("minute"), weekday: get("weekday"),
  };
}

const WEEKDAY_ZH: Record<string, string> = { Sun: "日", Mon: "一", Tue: "二", Wed: "三", Thu: "四", Fri: "五", Sat: "六" };

/** 「10月12日（日）」 */
export function formatTourDay(iso: string): string {
  const p = taipeiParts(new Date(iso));
  return `${Number(p.month)}月${Number(p.day)}日（${WEEKDAY_ZH[p.weekday] ?? p.weekday}）`;
}

/** 證書用：「2026 年 9 月 30 日」 */
export function formatCertificateDate(iso: string): string {
  const p = taipeiParts(new Date(iso));
  return `${p.year} 年 ${Number(p.month)} 月 ${Number(p.day)} 日`;
}

/** 「08:30」 */
export function formatTourClock(iso: string): string {
  const p = taipeiParts(new Date(iso));
  return `${p.hour}:${p.minute}`;
}

/** 同一天：「10月12日（日）08:30～16:00」；跨天：「10月12日（日）08:30～10月13日（一）16:00」 */
export function formatTourDateRange(startIso: string, endIso: string): string {
  const startDay = formatTourDay(startIso);
  const endDay = formatTourDay(endIso);
  if (startDay === endDay) return `${startDay}${formatTourClock(startIso)}～${formatTourClock(endIso)}`;
  return `${startDay}${formatTourClock(startIso)}～${endDay}${formatTourClock(endIso)}`;
}

// ── 名額與規則（和 SQL 一致，給畫面提示用；真正把關在 SQL） ──

export function registrationDeadline(tour: { registration_deadline: string | null; starts_at: string }): string {
  return tour.registration_deadline ?? tour.starts_at;
}

export function isRegistrationOpen(
  tour: { status: StudyTourStatus; registration_deadline: string | null; starts_at: string },
  now: Date = new Date()
): boolean {
  return tour.status === "published" && now.getTime() <= new Date(registrationDeadline(tour)).getTime();
}

export function stampWindow(tour: { starts_at: string; ends_at: string }) {
  return {
    opensAt: new Date(new Date(tour.starts_at).getTime() - STAMP_OPENS_HOURS_BEFORE * 3600_000),
    closesAt: new Date(new Date(tour.ends_at).getTime() + STAMP_CLOSES_HOURS_AFTER * 3600_000),
  };
}

export function summarizeSeats(
  capacity: number,
  regs: { status: StudyTourRegistrationStatus; party_size: number }[]
): { confirmed_people: number; waitlisted_people: number; waitlist_count: number; seats_left: number } {
  let confirmed = 0;
  let waitlisted = 0;
  let waitlistCount = 0;
  for (const r of regs) {
    if (r.status === "confirmed") confirmed += r.party_size;
    else if (r.status === "waitlisted") {
      waitlisted += r.party_size;
      waitlistCount += 1;
    }
  }
  return {
    confirmed_people: confirmed,
    waitlisted_people: waitlisted,
    waitlist_count: waitlistCount,
    seats_left: Math.max(0, capacity - confirmed),
  };
}

/** 每筆候補排第幾位（依報名先後，和 SQL 遞補順序相同） */
export function waitlistPositions(
  regs: { id: string; status: StudyTourRegistrationStatus; created_at: string }[]
): Map<string, number> {
  const waiting = regs
    .filter((r) => r.status === "waitlisted")
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  return new Map(waiting.map((r, i) => [r.id, i + 1]));
}

// ── QR 集章 ──

/** 蓋章代碼：伺服器產生的 base64url 亂數（22 字＝128 bit） */
export function isStampToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value);
}

/**
 * 對外分享／印 QR 用的網址：優先用 NEXT_PUBLIC_APP_URL（正式站），
 * 沒設才用目前網址——App（Capacitor）裡的 origin 是 http://localhost，別人點了打不開
 */
export function publicAppOrigin(envUrl: string | undefined, fallbackOrigin: string): string {
  if (envUrl && /^https?:\/\//.test(envUrl)) return envUrl.replace(/\/+$/, "");
  return fallbackOrigin.replace(/\/+$/, "");
}

/** 分享給朋友的活動連結 */
export function tourShareUrl(baseUrl: string, tourId: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/?open=study-tours&tour=${encodeURIComponent(tourId)}`;
}

/** 印在 QR Code 上的網址：手機相機掃了就打開暖暖蓋章 */
export function stampUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/?stamp=${encodeURIComponent(token)}`;
}

/** 報名／蓋章 SQL 函式丟出的錯誤代碼 → 給長輩看的話 */
const ERROR_MESSAGES: Record<string, { status: number; message: string }> = {
  tour_not_found: { status: 404, message: "找不到這個研學團" },
  tour_not_open: { status: 409, message: "這個研學團目前沒有開放" },
  registration_closed: { status: 409, message: "報名已經截止了" },
  already_registered: { status: 409, message: "已經報名過了，不用再報一次" },
  registration_not_found: { status: 404, message: "找不到這筆報名" },
  invalid_token: { status: 404, message: "這個 QR Code 認不得，請再掃一次或問領隊" },
  stamp_too_early: { status: 409, message: "活動還沒開始，出發當天再掃就能蓋章" },
  stamp_too_late: { status: 409, message: "這個研學團已經結束，不能再蓋章了" },
};

export function studyTourErrorFromDb(message: string | undefined | null): { status: number; message: string } | null {
  if (!message) return null;
  const code = Object.keys(ERROR_MESSAGES).find((k) => message === k || message.includes(k));
  return code ? ERROR_MESSAGES[code] : null;
}

// ── 表單驗證 ──

const PHONE_RE = /^[0-9+\-()#\s]{8,20}$/;
/** 寬鬆的 uuid 格式（不挑版本碼） */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const registerSchema = z.object({
  participant_name: z.string().trim().min(1, "請填參加者姓名").max(40),
  participant_phone: z.string().trim().regex(PHONE_RE, "請填聯絡電話"),
  party_size: z.number().int().min(1).max(MAX_PARTY_SIZE),
  note: z.string().trim().max(200).optional().default(""),
  /** 幫已連結的長輩報名（家人帳號才用得到） */
  for_user_id: z.string().regex(UUID_RE).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

const optionalHttpUrl = z
  .union([z.literal(""), z.null(), z.string().max(1000).refine(isHttpUrl, "請輸入 http(s):// 開頭的網址")])
  .optional();
const isoString = z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), "時間格式不對");

export const tourPatchSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  summary: z.string().trim().max(120).optional(),
  description: z.string().trim().max(3000).optional(),
  organizer_name: z.string().trim().max(80).optional(),
  cover_image_url: optionalHttpUrl,
  starts_at: isoString.optional(),
  ends_at: isoString.optional(),
  meeting_point: z.string().trim().max(200).optional(),
  fee_text: z.string().trim().max(120).optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  walking_level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  accessibility_note: z.string().trim().max(500).optional(),
  contact_phone: z.string().trim().max(40).optional(),
  registration_deadline: isoString.nullable().optional(),
  status: z.enum(["draft", "published", "cancelled"]).optional(),
});
export type TourPatch = z.infer<typeof tourPatchSchema>;

export const tourCreateSchema = tourPatchSchema.extend({
  title: z.string().trim().min(1).max(80),
  starts_at: isoString,
  ends_at: isoString,
});

/** 只更新有送來的欄位；網址 "" → null */
export function buildTourPatch(body: TourPatch, now: string = new Date().toISOString()): Record<string, unknown> {
  const patch: Record<string, unknown> = { updated_at: now };
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    patch[key] = key === "cover_image_url" ? (value ? value : null) : value;
  }
  return patch;
}

/** 結束時間要在開始之後、截止時間不能晚於出發 */
export function tourTimeProblem(t: { starts_at: string; ends_at: string; registration_deadline?: string | null }): string | null {
  const start = new Date(t.starts_at).getTime();
  const end = new Date(t.ends_at).getTime();
  if (end < start) return "結束時間要在出發時間之後";
  if (t.registration_deadline && new Date(t.registration_deadline).getTime() > start) {
    return "報名截止要在出發之前";
  }
  return null;
}

export const stopCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).optional().default(""),
  fun_fact: z.string().trim().max(500).optional().default(""),
  stamp_emoji: z.string().trim().min(1).max(16).optional().default("🏮"),
  position: z.number().int().min(0).max(999).optional(),
});

export const stopPatchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  description: z.string().trim().max(500).optional(),
  fun_fact: z.string().trim().max(500).optional(),
  stamp_emoji: z.string().trim().min(1).max(16).optional(),
  position: z.number().int().min(0).max(999).optional(),
  /** true＝換一組新的 QR 代碼（舊的 QR 失效） */
  regenerate_token: z.boolean().optional(),
});

// ── 給長輩看的狀態文字 ──

export function seatsLabel(tour: Pick<StudyTourView, "seats_left" | "waitlist_count">): string {
  if (tour.seats_left > 0) return `還有 ${tour.seats_left} 個名額`;
  return tour.waitlist_count > 0 ? `額滿，已有 ${tour.waitlist_count} 組在候補` : "額滿，可以排候補";
}

export function registrationStatusLabel(r: Pick<StudyTourRegistrationView, "status" | "waitlist_position">): string {
  if (r.status === "confirmed") return "✅ 報名成功";
  if (r.status === "waitlisted") return r.waitlist_position ? `⏳ 候補第 ${r.waitlist_position} 位` : "⏳ 候補中";
  return "已取消";
}

// ── DB 列 → 長輩畫面資料（純函式，伺服器用；方便測試） ──

export interface StudyTourRow {
  id: string;
  title: string;
  summary: string;
  description: string;
  organizer_name: string;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string;
  meeting_point: string;
  fee_text: string;
  capacity: number;
  walking_level: number;
  accessibility_note: string;
  contact_phone: string;
  registration_deadline: string | null;
  status: StudyTourStatus;
  created_at: string;
  updated_at: string;
}

export interface StudyTourStopRow {
  id: string;
  tour_id: string;
  position: number;
  name: string;
  description: string;
  fun_fact: string;
  stamp_emoji: string;
  stamp_token?: string;
  created_at?: string;
}

export interface StudyTourRegistrationRow {
  id: string;
  tour_id: string;
  user_id: string;
  registered_by: string | null;
  participant_name: string;
  participant_phone: string;
  party_size: number;
  note: string;
  status: StudyTourRegistrationStatus;
  source: StudyTourRegistrationSource;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface StudyTourStampRow {
  tour_id: string;
  stop_id: string;
  user_id: string;
  stamped_at: string;
}

export function buildStudyTourView(input: {
  tour: StudyTourRow;
  stops: StudyTourStopRow[];
  /** 這團所有「未取消」的報名（算名額與候補順位） */
  activeRegs: Pick<StudyTourRegistrationRow, "id" | "status" | "party_size" | "created_at">[];
  /** 我的報名（本人或我幫家人報的；未取消） */
  myRegs: StudyTourRegistrationRow[];
  /** 我自己在這團的集章 */
  myStamps: StudyTourStampRow[];
  userId: string;
  now?: Date;
}): StudyTourView {
  const { tour, userId } = input;
  const seats = summarizeSeats(tour.capacity, input.activeRegs);
  const positions = waitlistPositions(input.activeRegs);
  const stampByStop = new Map(input.myStamps.map((s) => [s.stop_id, s.stamped_at]));
  const stops = [...input.stops]
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    .map((s): StudyTourStopView => {
      const stampedAt = stampByStop.get(s.id) ?? null;
      return {
        id: s.id,
        position: s.position,
        name: s.name,
        description: s.description,
        stamp_emoji: s.stamp_emoji,
        stamped_at: stampedAt,
        fun_fact: stampedAt ? s.fun_fact || null : null,
      };
    });
  const registrations = input.myRegs
    .filter((r) => r.status !== "cancelled")
    .sort((a, b) => Number(b.user_id === userId) - Number(a.user_id === userId) || a.created_at.localeCompare(b.created_at))
    .map((r): StudyTourRegistrationView => ({
      id: r.id,
      participant_user_id: r.user_id,
      participant_name: r.participant_name,
      participant_phone: r.participant_phone,
      party_size: r.party_size,
      note: r.note,
      status: r.status,
      source: r.source,
      for_self: r.user_id === userId,
      waitlist_position: positions.get(r.id) ?? null,
      completed_at: r.completed_at,
      created_at: r.created_at,
    }));

  return {
    id: tour.id,
    title: tour.title,
    summary: tour.summary,
    description: tour.description,
    organizer_name: tour.organizer_name,
    cover_image_url: tour.cover_image_url,
    starts_at: tour.starts_at,
    ends_at: tour.ends_at,
    meeting_point: tour.meeting_point,
    fee_text: tour.fee_text,
    capacity: tour.capacity,
    walking_level: walkingLevelMeta(tour.walking_level).level,
    accessibility_note: tour.accessibility_note,
    contact_phone: tour.contact_phone,
    registration_deadline: tour.registration_deadline,
    status: tour.status,
    seats_left: seats.seats_left,
    waitlist_count: seats.waitlist_count,
    registration_open: isRegistrationOpen(tour, input.now),
    stops,
    registrations,
  };
}

/** 我在這團的報名（自己參加的那一筆） */
export function ownRegistration(tour: Pick<StudyTourView, "registrations">): StudyTourRegistrationView | null {
  return tour.registrations.find((r) => r.for_self) ?? null;
}

export function stampProgress(tour: Pick<StudyTourView, "stops">): { stamped: number; total: number } {
  return { stamped: tour.stops.filter((s) => s.stamped_at).length, total: tour.stops.length };
}

/** 集滿所有站（以目前的站點為準；後台加了新站就要補蓋） */
export function isPassportComplete(tour: Pick<StudyTourView, "stops">): boolean {
  const { stamped, total } = stampProgress(tour);
  return total > 0 && stamped >= total;
}

/** CSV 欄位：有逗號／引號／換行就加引號；開頭是 = + - @ 的前面加 ' 避免 Excel 當公式執行 */
export function csvCell(value: string | null | undefined): string {
  let v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
