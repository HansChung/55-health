// 管理員：白標品牌列表 + 新增
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("brands").select("*").order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brands: data });
}

const BrandSchema = z.object({
  id: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, "只能用小寫英數與連字號"),
  host: z.string().min(3).max(120),
  app_name: z.string().min(1).max(30),
  tagline: z.string().max(60).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  primary_deep: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  primary_soft: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo_emoji: z.string().max(8).optional(),
  active: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body;
  try {
    body = BrandSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤", detail: String(e) }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("brands")
    .insert({ ...body, host: body.host.toLowerCase() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brand: data });
}
