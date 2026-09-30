import { NextRequest, NextResponse, after } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/study-tours";
import { loadStudyToursForUser, notifyPromoted, rpcIdList, studyTourDbError } from "@/lib/study-tours-server";

/** 取消報名（本人或幫忙報名的家人）；空出來的名額自動遞補候補，並推播通知對方 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "找不到這筆報名" }, { status: 404 });

  const admin = createSupabaseAdmin();
  const { data: reg } = await admin
    .from("study_tour_registrations")
    .select("id, tour_id, user_id, registered_by, status")
    .eq("id", id)
    .maybeSingle();
  const row = reg as { id: string; tour_id: string; user_id: string; registered_by: string | null; status: string } | null;
  if (!row || (row.user_id !== user.id && row.registered_by !== user.id)) {
    return NextResponse.json({ error: "找不到這筆報名" }, { status: 404 });
  }

  if (row.status !== "cancelled") {
    const { data: tour } = await admin.from("study_tours").select("starts_at").eq("id", row.tour_id).maybeSingle();
    if (tour && new Date((tour as { starts_at: string }).starts_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "活動已經開始，不能在 App 取消了，請直接聯絡主辦單位" }, { status: 409 });
    }

    const { data: promoted, error } = await admin.rpc("study_tour_cancel", { p_registration_id: id });
    if (error) {
      const mapped = studyTourDbError(error);
      if (mapped.status >= 500) console.error("[study-tours] cancel failed:", error);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    const promotedIds = rpcIdList(promoted);
    if (promotedIds.length > 0) after(() => notifyPromoted(admin, promotedIds));
  }

  const tours = await loadStudyToursForUser(admin, user.id).catch(() => null);
  return NextResponse.json({ ok: true, tours });
}
