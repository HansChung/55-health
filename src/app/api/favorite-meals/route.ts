import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const FavoriteMealSchema = z.object({
  name: z.string().min(1).max(80),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
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
});

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("favorite_meals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: z.infer<typeof FavoriteMealSchema>;
  try {
    body = FavoriteMealSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤", detail: String(e) }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("favorite_meals")
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorite: data });
}
