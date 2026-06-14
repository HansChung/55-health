import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const ExerciseSchema = z.object({
  exercise_type: z.string(),
  minutes: z.number().int().positive(),
  kcal_burned: z.number().int().optional(),
  performed_at: z.string().optional(),
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

  const { data, error } = await supabase
    .from("exercises")
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ exercise: data });
}
