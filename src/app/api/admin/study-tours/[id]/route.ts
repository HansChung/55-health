import { NextRequest, NextResponse, after } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE, buildTourPatch, tourPatchSchema, tourTimeProblem, type StudyTourRow, type TourPatch } from "@/lib/study-tours";
import { loadAdminTourDetail, notifyPromoted, notifyTourCancelled, rpcIdList } from "@/lib/study-tours-server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** 站點（含 QR 代碼）＋報名名單 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });
  const supabase = createSupabaseAdmin();
  try {
    const { data: tour } = await supabase.from("study_tours").select("*").eq("id", id).maybeSingle();
    const detail = tour ? await loadAdminTourDetail(supabase, id) : null;
    if (!tour || !detail) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });
    return NextResponse.json({ tour, ...detail });
  } catch (e) {
    console.error("[api] DB error:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body: TourPatch;
  try {
    body = tourPatchSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });
  const supabase = createSupabaseAdmin();
  const { data: current } = await supabase.from("study_tours").select("*").eq("id", id).maybeSingle();
  const before = current as StudyTourRow | null;
  if (!before) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });

  const problem = tourTimeProblem({
    starts_at: body.starts_at ?? before.starts_at,
    ends_at: body.ends_at ?? before.ends_at,
    registration_deadline: body.registration_deadline === undefined ? before.registration_deadline : body.registration_deadline,
  });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const { data, error } = await supabase
    .from("study_tours")
    .update(buildTourPatch(body))
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  const after_ = data as StudyTourRow;

  // 名額變多 → 候補自動轉正取並通知
  if (after_.status !== "cancelled" && after_.capacity > before.capacity) {
    const { data: promoted, error: refillError } = await supabase.rpc("study_tour_refill", { p_tour_id: id });
    if (refillError) console.error("[study-tours] refill failed:", refillError);
    const ids = rpcIdList(promoted);
    if (ids.length > 0) after(() => notifyPromoted(supabase, ids));
  }
  // 改成「取消」→ 通知所有報名的人
  if (before.status !== "cancelled" && after_.status === "cancelled") {
    after(() => notifyTourCancelled(supabase, id));
  }

  return NextResponse.json({ tour: after_ });
}

/** 刪除：已經有人報名或蓋章就不能刪（請改成「取消活動」，保留長輩的護照紀錄） */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });
  const supabase = createSupabaseAdmin();
  const [{ count: regCount }, { count: stampCount }] = await Promise.all([
    supabase.from("study_tour_registrations").select("id", { count: "exact", head: true }).eq("tour_id", id).neq("status", "cancelled"),
    supabase.from("study_tour_stamps").select("id", { count: "exact", head: true }).eq("tour_id", id),
  ]);
  if ((regCount ?? 0) > 0 || (stampCount ?? 0) > 0) {
    return NextResponse.json({ error: "已經有人報名或蓋章，不能刪除；請改成「取消活動」" }, { status: 409 });
  }

  const { error } = await supabase.from("study_tours").delete().eq("id", id);
  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
