import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE, stopCreateSchema } from "@/lib/study-tours";
import { generateStampToken, nextStopPosition, syncTourCompletion } from "@/lib/study-tours-server";

/** 新增站點（自動產生 QR 蓋章代碼） */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body;
  try {
    body = stopCreateSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });
  const supabase = createSupabaseAdmin();
  const { data: tour } = await supabase.from("study_tours").select("id").eq("id", id).maybeSingle();
  if (!tour) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });

  const { data, error } = await supabase
    .from("study_tour_stops")
    .insert({
      tour_id: id,
      name: body.name,
      description: body.description,
      fun_fact: body.fun_fact,
      stamp_emoji: body.stamp_emoji,
      position: body.position ?? (await nextStopPosition(supabase, id)),
      stamp_token: generateStampToken(),
    })
    .select()
    .single();
  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  // 多了一站：原本集滿的人要補蓋新站才算結業
  await syncTourCompletion(supabase, id);
  return NextResponse.json({ stop: data });
}
