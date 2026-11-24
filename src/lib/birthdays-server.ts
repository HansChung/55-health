// ────────────────────────────────────────────────
// 家人生日提醒（只在 API route 用；service role）
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { nextBirthday, sortBirthdays, type Birthday, type BirthdayInput } from "@/lib/birthdays";
import { taipeiDate } from "@/lib/clinic-appointments";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export const BIRTHDAY_COLUMNS = "id, name, relation, calendar, month, day, birth_year, remind";

export function toClientBirthday(row: Record<string, unknown>, today: string = taipeiDate()): Birthday {
  const base = {
    calendar: row.calendar === "lunar" ? ("lunar" as const) : ("solar" as const),
    month: Number(row.month),
    day: Number(row.day),
    birth_year: typeof row.birth_year === "number" ? row.birth_year : null,
  };
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    relation: (row.relation as string | null) || null,
    ...base,
    remind: row.remind !== false,
    next: nextBirthday(base, today),
  };
}

/** 寫進資料庫的欄位 */
export function birthdayRow(v: BirthdayInput) {
  return {
    name: v.name,
    relation: v.relation || null,
    calendar: v.calendar,
    month: v.month,
    day: v.day,
    birth_year: v.birthYear,
    remind: v.remind,
  };
}

/** 自己記的所有生日（快到的排前面）；讀不到就丟錯（沒跑 SQL） */
export async function listBirthdays(admin: Admin, userId: string, now = new Date()): Promise<Birthday[]> {
  const { data, error } = await admin.from("family_birthdays").select(BIRTHDAY_COLUMNS).eq("user_id", userId).limit(200);
  if (error) throw new Error(`load birthdays failed: ${error.message}`);
  const today = taipeiDate(now);
  return sortBirthdays(((data ?? []) as Record<string, unknown>[]).map((r) => toClientBirthday(r, today)));
}
