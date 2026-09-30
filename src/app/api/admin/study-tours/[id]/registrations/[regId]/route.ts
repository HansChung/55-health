import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/study-tours";
import { notifyPromoted, rpcIdList, studyTourDbError } from "@/lib/study-tours-server";

const PatchSchema = z.union([
  // 幫忙取消報名（例如長輩打電話說不去了）；空出的名額自動遞補
  z.object({ status: z.literal("cancelled") }),
  // 手動報到：沒帶手機、不會掃碼的長輩由領隊按；false＝取消報到（按錯時）
  z.object({ checked_in: z.boolean() }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; regId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });

  const { id, regId } = await params;
  if (!UUID_RE.test(id) || !UUID_RE.test(regId)) return NextResponse.json({ error: "找不到這筆報名" }, { status: 404 });
  const supabase = createSupabaseAdmin();
  const { data: reg } = await supabase
    .from("study_tour_registrations")
    .select("id, status")
    .eq("id", regId)
    .eq("tour_id", id)
    .maybeSingle();
  if (!reg) return NextResponse.json({ error: "找不到這筆報名" }, { status: 404 });

  if ("checked_in" in parsed.data) {
    if ((reg as { status: string }).status === "cancelled") {
      return NextResponse.json({ error: "已取消的報名不能報到" }, { status: 409 });
    }
    const checkedInAt = parsed.data.checked_in ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("study_tour_registrations")
      .update({ checked_in_at: checkedInAt, updated_at: new Date().toISOString() })
      .eq("id", regId);
    if (error) {
      console.error("[study-tours] manual check-in failed:", error);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, checked_in_at: checkedInAt });
  }

  const { data: promoted, error } = await supabase.rpc("study_tour_cancel", { p_registration_id: regId });
  if (error) {
    const mapped = studyTourDbError(error);
    if (mapped.status >= 500) console.error("[study-tours] admin cancel failed:", error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
  const ids = rpcIdList(promoted);
  if (ids.length > 0) after(() => notifyPromoted(supabase, ids));
  return NextResponse.json({ ok: true, promoted: ids.length });
}
