import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-guard";
import { isStampToken, type StudyTourStampResult } from "@/lib/study-tours";
import { studyTourDbError } from "@/lib/study-tours-server";

/**
 * 掃站點 QR Code 蓋章。
 * 沒事先報名的人當天掃碼會自動補登記（人都到了）；管理員測試時不受活動時間限制。
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  if (!isStampToken(body.token)) {
    return NextResponse.json({ error: studyTourDbError({ message: "invalid_token" }).message }, { status: 404 });
  }

  const admin = createSupabaseAdmin();
  const [{ data: profile }, isAdmin] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    requireAdmin().then(Boolean).catch(() => false),
  ]);

  const { data, error } = await admin.rpc("study_tour_stamp", {
    p_token: body.token,
    p_user_id: user.id,
    p_participant_name: (profile as { display_name: string | null } | null)?.display_name ?? "",
    p_ignore_window: isAdmin,
  });
  if (error) {
    const mapped = studyTourDbError(error);
    if (mapped.status >= 500) console.error("[study-tours] stamp failed:", error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }

  const r = data as {
    tour_id: string; stop_id: string; newly_stamped: boolean; stamped_count: number;
    total_stops: number; completed: boolean; just_completed: boolean;
  };
  const [{ data: stop }, { data: tour }] = await Promise.all([
    admin.from("study_tour_stops").select("id, name, description, fun_fact, stamp_emoji").eq("id", r.stop_id).maybeSingle(),
    admin.from("study_tours").select("title").eq("id", r.tour_id).maybeSingle(),
  ]);
  const s = stop as { id: string; name: string; description: string; fun_fact: string; stamp_emoji: string } | null;

  const result: StudyTourStampResult = {
    tour_id: r.tour_id,
    tour_title: (tour as { title: string } | null)?.title ?? "研學團",
    stop: {
      id: r.stop_id,
      name: s?.name ?? "",
      description: s?.description ?? "",
      stamp_emoji: s?.stamp_emoji ?? "🏮",
      fun_fact: s?.fun_fact ?? "",
    },
    newly_stamped: r.newly_stamped,
    stamped_count: r.stamped_count,
    total_stops: r.total_stops,
    completed: r.completed,
    just_completed: r.just_completed,
  };
  return NextResponse.json({ result });
}
