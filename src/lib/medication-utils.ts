import type { ProfileMedication } from "./api-client";

const MEAL_TIME_MAP = [
  { keywords: ["早餐", "早上", "晨", "morning", "breakfast"], time: "08:00" },
  { keywords: ["午餐", "中午", "noon", "lunch"], time: "13:00" },
  { keywords: ["晚餐", "晚上", "傍晚", "evening", "dinner"], time: "19:00" },
  { keywords: ["睡前", "睡覺", "bedtime"], time: "21:30" },
];

export function inferMedicationReminderTimes(text: string): string[] {
  const source = text.toLowerCase();
  const matches = MEAL_TIME_MAP
    .filter((item) => item.keywords.some((keyword) => source.includes(keyword.toLowerCase())))
    .map((item) => item.time);

  if (matches.length > 0) return Array.from(new Set(matches));
  if (source.includes("三次") || source.includes("3次")) return ["08:00", "13:00", "19:00"];
  if (source.includes("兩次") || source.includes("2次")) return ["08:00", "19:00"];
  return ["08:00"];
}

// ─── 今天吃了哪幾次 ───
// 一天吃好幾次的藥，每個時間分開記（taken_times＝{ day: 台北日期, times: ["08:00", …] }）
// 「今天」一律用台北日期：手機和伺服器（UTC）算出來才會一樣

/** 台北日期 YYYY-MM-DD */
export function taipeiDayOf(d: Date): string {
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 今天已經吃過的時間；舊資料只有 last_taken_at（以前按一次就算整天）→ 照舊算全部吃過 */
export function takenTimesToday(med: ProfileMedication, now = new Date()): string[] {
  const today = taipeiDayOf(now);
  if (med.taken_times) return med.taken_times.day === today ? med.taken_times.times : [];
  if (med.last_taken_at && taipeiDayOf(new Date(med.last_taken_at)) === today) return [...(med.reminder_times ?? [])];
  return [];
}

export function isDoseTaken(med: ProfileMedication, time: string, now = new Date()): boolean {
  return takenTimesToday(med, now).includes(time);
}

/** 今天的每一次都吃了（沒設時間的藥：今天按過就算） */
export function isTakenToday(med: ProfileMedication, now = new Date()): boolean {
  const times = med.reminder_times ?? [];
  if (times.length === 0) return Boolean(med.last_taken_at) && taipeiDayOf(new Date(med.last_taken_at!)) === taipeiDayOf(now);
  const taken = takenTimesToday(med, now);
  return times.every((t) => taken.includes(t));
}

/** 標記吃了：time＝那一次；null＝今天的全部 */
export function markDoseTaken(med: ProfileMedication, time: string | null, now = new Date()): ProfileMedication {
  const already = takenTimesToday(med, now);
  const add = time === null ? med.reminder_times ?? [] : [time];
  const next: ProfileMedication = {
    ...med,
    taken_times: { day: taipeiDayOf(now), times: Array.from(new Set([...already, ...add])).sort() },
    last_taken_at: now.toISOString(),
  };
  return { ...next, taken_today: isTakenToday(next, now) };
}

/** 同一顆藥：名字一樣，而且加入的時間一樣（兩邊都沒有 added_at 也算） */
export function sameMedication(a: Pick<ProfileMedication, "name" | "added_at">, b: Pick<ProfileMedication, "name" | "added_at">): boolean {
  return a.name === b.name && (a.added_at ?? null) === (b.added_at ?? null);
}

export function getPendingMedicationReminders(
  medications: ProfileMedication[] = [],
  now = new Date()
) {
  return medications
    .filter((med) => med.reminder_enabled !== false)
    .flatMap((med) => (med.reminder_times ?? []).map((time) => ({ med, time })))
    .filter(({ med, time }) => !isDoseTaken(med, time, now))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
