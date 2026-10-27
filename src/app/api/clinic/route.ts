// ────────────────────────────────────────────────
// 看診小幫手：GET → { visits }（自己最近 30 次，新的在前）
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { toClientVisit, type ClinicVisitRow } from "@/lib/clinic-server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { data, error } = await createSupabaseAdmin()
    .from("clinic_visits")
    .select("*")
    .eq("user_id", user.id)
    .order("visit_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) console.warn("[api] clinic GET:", error.message); // 還沒跑 SQL：當作沒有紀錄
  return NextResponse.json({ visits: ((data ?? []) as ClinicVisitRow[]).map(toClientVisit) });
}
