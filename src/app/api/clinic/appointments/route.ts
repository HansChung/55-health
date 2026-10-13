// ────────────────────────────────────────────────
// 回診提醒
// GET  → { appointments }（今天以後的，依日期排）
// POST { kind, date, time?, hospital?, department?, note?, notifyFamily? } → { appointment }
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { APPOINTMENT_UPCOMING_MAX, normalizeAppointmentInput, taipeiDate } from "@/lib/clinic-appointments";
import { APPOINTMENT_COLUMNS, toClientAppointment, upcomingAppointments } from "@/lib/clinic-appointments-server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  try {
    return NextResponse.json({ appointments: await upcomingAppointments(createSupabaseAdmin(), user.id) });
  } catch (e) {
    console.warn("[api] appointments GET (add-clinic-appointments.sql 跑了嗎？):", e);
    return NextResponse.json({ error: "回診提醒還沒準備好" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const parsed = normalizeAppointmentInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;
  const admin = createSupabaseAdmin();
  const { count, error: countErr } = await admin
    .from("clinic_appointments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("appt_date", taipeiDate());
  if (countErr) {
    console.warn("[api] appointments count:", countErr.message);
    return NextResponse.json({ error: "回診提醒還沒準備好" }, { status: 503 });
  }
  if ((count ?? 0) >= APPOINTMENT_UPCOMING_MAX) {
    return NextResponse.json({ error: `最多記 ${APPOINTMENT_UPCOMING_MAX} 筆，先刪掉用不到的` }, { status: 429 });
  }
  const { data, error } = await admin
    .from("clinic_appointments")
    .insert({
      user_id: user.id,
      kind: v.kind,
      appt_date: v.date,
      appt_time: v.time,
      hospital: v.hospital || null,
      department: v.department || null,
      note: v.note || null,
      notify_family: v.notifyFamily,
    })
    .select(APPOINTMENT_COLUMNS)
    .single();
  if (error || !data) {
    console.error("[api] appointments POST:", error);
    return NextResponse.json({ error: "沒存成功，請再試一次" }, { status: 500 });
  }
  return NextResponse.json({ appointment: toClientAppointment(data as Record<string, unknown>) });
}
