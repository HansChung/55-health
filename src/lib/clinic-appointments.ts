// ────────────────────────────────────────────────
// 回診提醒（前後端共用）
// 記下回診（或領慢性處方箋藥）的日子 → 前一天晚上 8 點、當天早上 7 點推播；notify_family 的話家人也收到
// 日期、時間都是台北時間
// ────────────────────────────────────────────────

export type AppointmentKind = "visit" | "refill";

export const APPOINTMENT_KINDS: { id: AppointmentKind; label: string; emoji: string }[] = [
  { id: "visit", label: "回診", emoji: "🩺" },
  { id: "refill", label: "領慢箋藥", emoji: "💊" },
];

export const APPOINTMENT_HOSPITAL_MAX = 40;
export const APPOINTMENT_DEPARTMENT_MAX = 40;
export const APPOINTMENT_NOTE_MAX = 200;
/** 最多記幾筆還沒到的 */
export const APPOINTMENT_UPCOMING_MAX = 20;
/** 最遠可以記多久以後（天） */
export const APPOINTMENT_MAX_DAYS_AHEAD = 400;
/** 家人狀況顯示幾天內的下一次回診 */
export const FAMILY_APPOINTMENT_DAYS = 14;

/** 提醒的時間（台北時間，給畫面說明用；排程見 vercel.json） */
export const REMIND_DAY_BEFORE_HOUR = 20;
export const REMIND_SAME_DAY_HOUR = 7;

export interface ClinicAppointment {
  id: string;
  kind: AppointmentKind;
  appt_date: string;
  appt_time: string | null;
  hospital: string | null;
  department: string | null;
  note: string | null;
  notify_family: boolean;
}

export interface AppointmentInput {
  kind: AppointmentKind;
  date: string;
  time: string | null;
  hospital: string;
  department: string;
  note: string;
  notifyFamily: boolean;
}

/** 台北日期 YYYY-MM-DD；offsetDays 往後幾天 */
export function taipeiDate(now: Date = new Date(), offsetDays = 0): string {
  return new Date(now.getTime() + 8 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);
}

function isRealDate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(`${d}T00:00:00Z`);
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
}

function cleanLine(v: unknown, max: number): string {
  return typeof v === "string" ? [...v.replace(/\s+/g, " ").trim()].slice(0, max).join("") : "";
}

/** 檢查、整理長輩填的內容；不行就回錯誤訊息（給長輩看的話） */
export function normalizeAppointmentInput(raw: unknown, now: Date = new Date()): { ok: true; value: AppointmentInput } | { ok: false; error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kind: AppointmentKind = r.kind === "refill" ? "refill" : "visit";
  const date = typeof r.date === "string" ? r.date.trim() : "";
  if (!isRealDate(date)) return { ok: false, error: "請選日期" };
  if (date < taipeiDate(now)) return { ok: false, error: "這個日子已經過了，請選今天以後的日子" };
  if (date > taipeiDate(now, APPOINTMENT_MAX_DAYS_AHEAD)) return { ok: false, error: "日子太遠了，請選一年內的日子" };
  let time: string | null = null;
  if (typeof r.time === "string" && r.time.trim()) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(r.time.trim());
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return { ok: false, error: "時間格式不對" };
    time = `${m[1].padStart(2, "0")}:${m[2]}`;
  }
  return {
    ok: true,
    value: {
      kind,
      date,
      time,
      hospital: cleanLine(r.hospital, APPOINTMENT_HOSPITAL_MAX),
      department: cleanLine(r.department, APPOINTMENT_DEPARTMENT_MAX),
      note: cleanLine(r.note, APPOINTMENT_NOTE_MAX),
      notifyFamily: r.notifyFamily !== false,
    },
  };
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 10/20（一） */
export function appointmentDayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return `${m}/${d}（${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}）`;
}

/** 09:30 → 上午 9:30；14:00 → 下午 2:00 */
export function appointmentTimeLabel(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const part = h < 12 ? "上午" : h === 12 ? "中午" : h < 18 ? "下午" : "晚上";
  const hh = h <= 12 ? h : h - 12;
  return `${part} ${hh}:${String(m).padStart(2, "0")}`;
}

/** 今天／明天／後天／10/20（一） */
export function relativeDayLabel(date: string, now: Date = new Date()): string {
  if (date === taipeiDate(now)) return "今天";
  if (date === taipeiDate(now, 1)) return "明天";
  if (date === taipeiDate(now, 2)) return "後天";
  return appointmentDayLabel(date);
}

/** 台大醫院 心臟科（都沒填就是「回診」／「領慢箋藥」） */
export function appointmentPlace(a: Pick<ClinicAppointment, "kind" | "hospital" | "department">): string {
  const place = [a.hospital, a.department].filter(Boolean).join(" ");
  return place || (a.kind === "refill" ? "領慢箋藥" : "回診");
}

function what(a: Pick<ClinicAppointment, "kind" | "hospital" | "department">): string {
  const place = [a.hospital, a.department].filter(Boolean).join(" ");
  if (a.kind === "refill") return place ? `到${place}領慢箋藥` : "領慢箋藥";
  return place ? `到${place}回診` : "回診";
}

function bring(a: Pick<ClinicAppointment, "kind">): string {
  return a.kind === "refill" ? "記得帶健保卡和慢性處方箋" : "記得帶健保卡、藥袋，想問的話可以先在看診小幫手整理好";
}

/** 給長輩的推播 */
export function appointmentPush(a: ClinicAppointment, when: "day_before" | "same_day"): { title: string; body: string } {
  const day = when === "day_before" ? "明天" : "今天";
  const t = appointmentTimeLabel(a.appt_time);
  return {
    title: `${a.kind === "refill" ? "💊" : "🩺"} ${day}${t ? ` ${t} ` : ""}要${what(a)}`,
    body: [bring(a), a.note].filter(Boolean).join("。"),
  };
}

/** 給家人的推播 */
export function appointmentFamilyPush(a: ClinicAppointment, when: "day_before" | "same_day", elderName: string): { title: string; body: string } {
  const day = when === "day_before" ? "明天" : "今天";
  const t = appointmentTimeLabel(a.appt_time);
  return {
    title: `${elderName}${day}${t ? ` ${t} ` : ""}要${what(a)}`,
    body: when === "day_before" ? "需要陪同或接送的話，可以先跟長輩約好時間" : "打個電話提醒一下，或問問看完診醫生怎麼說",
  };
}

/** 排程網址的參數 */
export function parseReminderKind(v: string | null): "day_before" | "same_day" | null {
  return v === "day_before" || v === "same_day" ? v : null;
}

/** 依日期、時間排（沒填時間的排在當天最後） */
export function sortAppointments<T extends Pick<ClinicAppointment, "appt_date" | "appt_time">>(list: T[]): T[] {
  return [...list].sort((a, b) => a.appt_date.localeCompare(b.appt_date) || (a.appt_time ?? "99").localeCompare(b.appt_time ?? "99"));
}
