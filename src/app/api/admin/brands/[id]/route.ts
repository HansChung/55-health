// 管理員：更新 / 刪除白標品牌
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

const PatchSchema = z.object({
  host: z.string().min(3).max(120).optional(),
  app_name: z.string().min(1).max(30).optional(),
  tagline: z.string().max(60).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  primary_deep: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  primary_soft: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo_emoji: z.string().max(8).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await ctx.params;
  let body;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤", detail: String(e) }, { status: 400 });
  }
  if (body.host) body.host = body.host.toLowerCase();

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("brands")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brand: data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await ctx.params;
  if (id === "default") return NextResponse.json({ error: "預設品牌不可刪除" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
