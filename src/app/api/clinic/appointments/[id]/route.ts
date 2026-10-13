// 回診提醒：改一筆（整筆重送，跟新增一樣檢查）、刪一筆
// PUT { kind, date, time?, hospital?, department?, note?, notifyFamily? } → { appointment }；DELETE → { ok }
// 改了日期或時間 → 提醒記號清掉，新的日子會再提醒
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { normalizeAppointmentInput } from "@/lib/clinic-appointments";
import { APPOINTMENT_COLUMNS, toClientAppointment } from "@/lib/clinic-appointments-server";

const UUID = /^[0-9a-f-]{36}$/i;

async function auth() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await auth();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const id = (await ctx.params).id;
  if (!UUID.test(id)) return NextResponse.json({ error: "找不到這筆回診" }, { status: 404 });
  const parsed = normalizeAppointmentInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;
  const admin = createSupabaseAdmin();
  const { data: old } = await admin.from("clinic_appointments").select("appt_date, appt_time").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!old) return NextResponse.json({ error: "找不到這筆回診" }, { status: 404 });
  const moved = (old as { appt_date: string }).appt_date !== v.date || (old as { appt_time: string | null }).appt_time !== v.time;
  const { data, error } = await admin
    .from("clinic_appointments")
    .update({
      kind: v.kind,
      appt_date: v.date,
      appt_time: v.time,
      hospital: v.hospital || null,
      department: v.department || null,
      note: v.note || null,
      notify_family: v.notifyFamily,
      updated_at: new Date().toISOString(),
      ...(moved ? { reminded_day_before_at: null, reminded_same_day_at: null } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(APPOINTMENT_COLUMNS)
    .maybeSingle();
  if (error) {
    console.error("[api] appointments PUT:", error);
    return NextResponse.json({ error: "沒存成功，請再試一次" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "找不到這筆回診" }, { status: 404 });
  return NextResponse.json({ appointment: toClientAppointment(data as Record<string, unknown>) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await auth();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const id = (await ctx.params).id;
  if (!UUID.test(id)) return NextResponse.json({ error: "找不到這筆回診" }, { status: 404 });
  const { data, error } = await createSupabaseAdmin().from("clinic_appointments").delete().eq("id", id).eq("user_id", user.id).select("id");
  if (error) return NextResponse.json({ error: "刪除沒成功，請再試一次" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "找不到這筆回診" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
