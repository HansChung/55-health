import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const MealSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  eaten_at: z.string().optional(),
  photo_url: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    amount: z.string().optional(),
    cal: z.number(),
    emoji: z.string().optional(),
    color: z.string().optional(),
  })),
  total_cal: z.number(),
  protein_g: z.number().optional(),
  carb_g: z.number().optional(),
  fat_g: z.number().optional(),
  portion: z.number().optional(),
  notes: z.string().optional(),
  ai_analysis_id: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const days = Number(req.nextUrl.searchParams.get("days") ?? 7);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user.id)
    .gte("eaten_at", since.toISOString())
    .order("eaten_at", { ascending: false });

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ meals: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = MealSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meals")
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ meal: data });
}
