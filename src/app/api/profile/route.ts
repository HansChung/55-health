import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const PatchSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  age: z.number().int().min(1).max(120).nullable().optional(),
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  height_cm: z.number().int().min(50).max(250).nullable().optional(),
  weight_kg: z.number().min(20).max(300).nullable().optional(),
  calorie_goal: z.number().int().min(800).max(5000).optional(),
  voice_tone: z.enum(["warm", "strict", "grandchild"]).optional(),
  font_scale: z.enum(["base", "lg"]).optional(),
  high_contrast: z.boolean().optional(),
  chronic_conditions: z.array(z.string()).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dose: z.string().optional(),
    time: z.string().optional(),
  })).optional(),
});

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤", detail: String(e) }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
