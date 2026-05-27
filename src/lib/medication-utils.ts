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

export function isTakenToday(med: ProfileMedication, now = new Date()): boolean {
  if (med.taken_today) return true;
  if (!med.last_taken_at) return false;
  return isSameLocalDay(new Date(med.last_taken_at), now);
}

export function getPendingMedicationReminders(
  medications: ProfileMedication[] = [],
  now = new Date()
) {
  return medications
    .filter((med) => med.reminder_enabled !== false)
    .filter((med) => (med.reminder_times?.length ?? 0) > 0)
    .filter((med) => !isTakenToday(med, now))
    .flatMap((med) => (med.reminder_times ?? []).map((time) => ({ med, time })))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
