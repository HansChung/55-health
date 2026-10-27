// 看診小幫手：改一筆（醫生交代的話、看診日期、科別）、刪一筆
// PATCH { doctorNotes?, visitDate?, department? } → { visit }；DELETE → { ok }
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { CLINIC_DEPARTMENT_MAX, CLINIC_NOTES_MAX, sanitizeClinicText } from "@/lib/clinic";
import { ownVisit, toClientVisit, type ClinicVisitRow } from "@/lib/clinic-server";

const Schema = z.object({
  doctorNotes: z.string().max(CLINIC_NOTES_MAX * 2).optional(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  department: z.string().max(CLINIC_DEPARTMENT_MAX * 2).optional(),
});

async function auth() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await auth();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  const row = await ownVisit(admin, user.id, (await ctx.params).id);
  if (!row) return NextResponse.json({ error: "找不到這次看診" }, { status: 404 });
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const b = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (b.doctorNotes !== undefined) patch.doctor_notes = sanitizeClinicText(b.doctorNotes, CLINIC_NOTES_MAX) || null;
  if (b.visitDate !== undefined) patch.visit_date = b.visitDate;
  if (b.department !== undefined) patch.department = sanitizeClinicText(b.department, CLINIC_DEPARTMENT_MAX).replace(/\n/g, " ") || null;
  const { data, error } = await admin.from("clinic_visits").update(patch).eq("id", row.id).select("*").single();
  if (error || !data) {
    console.error("[api] clinic patch:", error);
    return NextResponse.json({ error: "沒存成功，請再試一次" }, { status: 500 });
  }
  return NextResponse.json({ visit: toClientVisit(data as ClinicVisitRow) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await auth();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  const row = await ownVisit(admin, user.id, (await ctx.params).id);
  if (!row) return NextResponse.json({ error: "找不到這次看診" }, { status: 404 });
  const { error } = await admin.from("clinic_visits").delete().eq("id", row.id);
  if (error) return NextResponse.json({ error: "刪除沒成功，請再試一次" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
