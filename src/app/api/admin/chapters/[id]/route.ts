// 管理員：讀取／儲存／還原單一章節的覆蓋內容
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getChapterOpening } from "@/lib/chapter-opening";
import {
  chapterOverridesSchema,
  normalizeOverrides,
  extractEditableDefaults,
} from "@/lib/chapter-content";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await ctx.params;
  const base = getChapterOpening(id);
  if (!base) return NextResponse.json({ error: "找不到章節" }, { status: 404 });

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("chapter_content")
    .select("overrides, updated_at")
    .eq("chapter_id", id)
    .maybeSingle();

  return NextResponse.json({
    id,
    title: base.title,
    defaults: extractEditableDefaults(base),
    overrides: data?.overrides ?? {},
    updated_at: data?.updated_at ?? null,
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await ctx.params;
  if (!getChapterOpening(id)) return NextResponse.json({ error: "找不到章節" }, { status: 404 });

  let body;
  try {
    body = chapterOverridesSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤", detail: String(e) }, { status: 400 });
  }
  const overrides = normalizeOverrides(body);

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("chapter_content")
    .upsert(
      { chapter_id: id, overrides, updated_at: new Date().toISOString(), updated_by: admin.id },
      { onConflict: "chapter_id" }
    )
    .select("overrides, updated_at")
    .single();

  if (error) {
    console.error("[admin/chapters] 儲存失敗:", error);
    return NextResponse.json({ error: "儲存失敗，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ overrides: data.overrides, updated_at: data.updated_at });
}

/** 還原預設：刪掉覆蓋列，畫面立刻回到程式碼裡的內容 */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await ctx.params;
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("chapter_content").delete().eq("chapter_id", id);
  if (error) return NextResponse.json({ error: "還原失敗" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
