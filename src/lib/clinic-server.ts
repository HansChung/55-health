// 看診小幫手（只在 API route 用；service role）
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { normalizeLabReport, type ClinicVisit } from "@/lib/clinic";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export interface ClinicVisitRow {
  id: string;
  user_id: string;
  visit_date: string;
  department: string | null;
  prep: ClinicVisit["prep"];
  report: unknown;
  doctor_notes: string | null;
  created_at: string;
}

export function toClientVisit(row: ClinicVisitRow): ClinicVisit {
  let report = null;
  try {
    report = row.report ? normalizeLabReport(row.report) : null;
  } catch {
    report = null;
  }
  return {
    id: row.id,
    visit_date: row.visit_date,
    department: row.department,
    prep: row.prep ?? null,
    report,
    doctor_notes: row.doctor_notes,
    created_at: row.created_at,
  };
}

export async function ownVisit(admin: Admin, userId: string, id: string): Promise<ClinicVisitRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await admin.from("clinic_visits").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  return (data as ClinicVisitRow | null) ?? null;
}

/** 台灣今天的日期（YYYY-MM-DD） */
export function taipeiToday(now = new Date()): string {
  return new Date(now.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}
