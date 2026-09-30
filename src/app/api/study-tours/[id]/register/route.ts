import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE, registerSchema, type RegisterInput } from "@/lib/study-tours";
import { isLinkedElder, loadStudyToursForUser, studyTourDbError } from "@/lib/study-tours-server";

/**
 * 報名研學團（不收費）：有名額就正取，沒名額排候補。
 * 家人可以幫「已連結的長輩」報名：報名記在長輩帳號，集章也是長輩用自己的手機掃。
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });

  let body: RegisterInput;
  try {
    body = registerSchema.parse(await req.json());
  } catch (e) {
    const issue = (e as { issues?: { message?: string }[] }).issues?.[0]?.message;
    return NextResponse.json({ error: issue || "報名資料不完整" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const participantId = body.for_user_id ?? user.id;
  if (participantId !== user.id && !(await isLinkedElder(admin, user.id, participantId))) {
    return NextResponse.json({ error: "只能幫已經連結的家人報名" }, { status: 403 });
  }

  const { data, error } = await admin.rpc("study_tour_register", {
    p_tour_id: id,
    p_user_id: participantId,
    p_registered_by: user.id,
    p_participant_name: body.participant_name,
    p_participant_phone: body.participant_phone,
    p_party_size: body.party_size,
    p_note: body.note ?? "",
  });
  if (error) {
    // 同一個人幾乎同時按兩次：第二筆撞到唯一索引
    const mapped = error.code === "23505" ? studyTourDbError({ message: "already_registered" }) : studyTourDbError(error);
    if (mapped.status >= 500) console.error("[study-tours] register failed:", error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }

  const registration = data as { id: string; status: "confirmed" | "waitlisted" };
  const tours = await loadStudyToursForUser(admin, user.id).catch(() => null);
  return NextResponse.json({ registration: { id: registration.id, status: registration.status }, tours });
}
