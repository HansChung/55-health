import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const PostSchema = z.object({
  metric_type: z.enum(["weight", "blood_pressure", "blood_glucose"]),
  measured_at: z.string().optional(),
  weight_kg: z.number().min(20).max(300).optional().nullable(),
  systolic: z.number().int().min(50).max(300).optional().nullable(),
  diastolic: z.number().int().min(30).max(200).optional().nullable(),
  pulse: z.number().int().min(30).max(250).optional().nullable(),
  glucose_mg_dl: z.number().int().min(20).max(800).optional().nullable(),
  glucose_context: z.enum(["fasting", "before_meal", "after_meal", "bedtime"]).optional().nullable(),
  notes: z.string().max(200).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type");
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const since = new Date();
  since.setDate(since.getDate() - days);

  let q = supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user.id)
    .gte("measured_at", since.toISOString())
    .order("measured_at", { ascending: false });

  if (type && ["weight", "blood_pressure", "blood_glucose"].includes(type)) {
    q = q.eq("metric_type", type);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ metrics: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤", detail: String(e) }, { status: 400 });
  }

  // 簡單驗證
  if (body.metric_type === "weight" && !body.weight_kg) {
    return NextResponse.json({ error: "請填體重" }, { status: 400 });
  }
  if (body.metric_type === "blood_pressure" && (!body.systolic || !body.diastolic)) {
    return NextResponse.json({ error: "請填收縮壓與舒張壓" }, { status: 400 });
  }
  if (body.metric_type === "blood_glucose" && !body.glucose_mg_dl) {
    return NextResponse.json({ error: "請填血糖數值" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("health_metrics")
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ metric: data });
}
