import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const ExerciseSchema = z.object({
  exercise_type: z.string(),
  minutes: z.number().int().positive(),
  kcal_burned: z.number().int().optional(),
  performed_at: z.string().optional(),
  // 來源標記：手動記錄 vs 從 Apple 健康 / Health Connect 同步
  source: z.enum(["manual", "health"]).optional(),
  // 健康平台上該筆運動的唯一 ID，用來去重（避免重複同步同一筆）
  external_id: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const days = Number(req.nextUrl.searchParams.get("days") ?? 7);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", user.id)
    .gte("performed_at", since.toISOString())
    .order("performed_at", { ascending: false });

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ exercises: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = ExerciseSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  // 從健康平台同步、且帶 external_id 時用 upsert：重複的同一筆運動會被忽略（不重複新增）
  if (body.source === "health" && body.external_id) {
    const { data, error } = await supabase
      .from("exercises")
      .upsert({ ...body, user_id: user.id }, { onConflict: "user_id,external_id", ignoreDuplicates: true })
      .select()
      .maybeSingle();

    if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
    // data 為 null 代表這筆已存在（被去重忽略）
    return NextResponse.json({ exercise: data, duplicate: data === null });
  }

  const { data, error } = await supabase
    .from("exercises")
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ exercise: data });
}
