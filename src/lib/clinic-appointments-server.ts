// ────────────────────────────────────────────────
// 回診提醒（只在 API route 用；service role）
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { FAMILY_APPOINTMENT_DAYS, sortAppointments, taipeiDate, type ClinicAppointment } from "@/lib/clinic-appointments";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export const APPOINTMENT_COLUMNS = "id, kind, appt_date, appt_time, hospital, department, note, notify_family";

export function toClientAppointment(row: Record<string, unknown>): ClinicAppointment {
  return {
    id: String(row.id),
    kind: row.kind === "refill" ? "refill" : "visit",
    appt_date: String(row.appt_date),
    appt_time: typeof row.appt_time === "string" ? row.appt_time : null,
    hospital: (row.hospital as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    notify_family: row.notify_family !== false,
  };
}

/** 自己今天以後的回診（依日期、時間排）；讀不到就丟錯 */
export async function upcomingAppointments(admin: Admin, userId: string, now = new Date()): Promise<ClinicAppointment[]> {
  const { data, error } = await admin
    .from("clinic_appointments")
    .select(APPOINTMENT_COLUMNS)
    .eq("user_id", userId)
    .gte("appt_date", taipeiDate(now))
    .order("appt_date", { ascending: true })
    .limit(50);
  if (error) throw new Error(`load appointments failed: ${error.message}`);
  return sortAppointments(((data ?? []) as Record<string, unknown>[]).map(toClientAppointment));
}

/** 家人狀況：長輩讓家人知道的下一次回診（14 天內）；還沒跑 SQL 就當作沒有 */
export async function nextFamilyAppointment(admin: Admin, elderId: string, now = new Date()): Promise<ClinicAppointment | null> {
  const { data, error } = await admin
    .from("clinic_appointments")
    .select(APPOINTMENT_COLUMNS)
    .eq("user_id", elderId)
    .eq("notify_family", true)
    .gte("appt_date", taipeiDate(now))
    .lte("appt_date", taipeiDate(now, FAMILY_APPOINTMENT_DAYS))
    .order("appt_date", { ascending: true })
    .limit(10);
  if (error) return null;
  return sortAppointments(((data ?? []) as Record<string, unknown>[]).map(toClientAppointment))[0] ?? null;
}
