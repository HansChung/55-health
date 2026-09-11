// 管理員：讀取／儲存／還原（或刪除）單一章節
//   內建章節：存「覆蓋」，DELETE＝還原預設
//   後台新增的章節：存整章內容＋發布狀態，DELETE＝刪除整章
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getChapterOpening } from "@/lib/chapter-opening";
import {
  chapterOverridesSchema,
  normalizeOverrides,
  extractEditableDefaults,
  customChapterBase,
} from "@/lib/chapter-content";

type Ctx = { params: Promise<{ id: string }> };

async function loadRow(id: string) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("chapter_content")
    .select("overrides, updated_at, is_custom, published")
    .eq("chapter_id", id)
    .maybeSingle();
  return data as { overrides: Record<string, unknown>; updated_at: string; is_custom: boolean; published: boolean } | null;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await ctx.params;
  const builtin = getChapterOpening(id);
  const row = await loadRow(id);
  const custom = !builtin && !!row?.is_custom;
  if (!builtin && !custom) return NextResponse.json({ error: "找不到章節" }, { status: 404 });

  const base = builtin ?? customChapterBase(id);
  return NextResponse.json({
    id,
    title: (row?.overrides?.title as string) || base.title,
    custom,
    published: custom ? row!.published !== false : true,
    defaults: extractEditableDefaults(base),
    overrides: row?.overrides ?? {},
    updated_at: row?.updated_at ?? null,
  });
}

const putSchema = z.object({
  overrides: chapterOverridesSchema,
  published: z.boolean().optional(),
});

export async function PUT(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path?.join(".") ?? "";
    return NextResponse.json({ error: `格式錯誤${where ? `（${where}）` : ""}：${issue?.message ?? ""}` }, { status: 400 });
  }
  const overrides = normalizeOverrides(parsed.data.overrides);
  const now = new Date().toISOString();
  const supabase = createSupabaseAdmin();

  if (getChapterOpening(id)) {
    const { data, error } = await supabase
      .from("chapter_content")
      .upsert(
        { chapter_id: id, overrides, updated_at: now, updated_by: admin.id },
        { onConflict: "chapter_id" }
      )
      .select("overrides, updated_at")
      .single();
    if (error) {
      console.error("[admin/chapters] 儲存失敗:", error);
      return NextResponse.json({ error: "儲存失敗，請稍後再試" }, { status: 500 });
    }
    return NextResponse.json({ overrides: data.overrides, updated_at: data.updated_at, published: true });
  }

  // 後台新增的章節：只能更新已存在的自訂章節，且標題不可空白
  const row = await loadRow(id);
  if (!row?.is_custom) return NextResponse.json({ error: "找不到章節" }, { status: 404 });
  if (!overrides.title) return NextResponse.json({ error: "新章節需要標題" }, { status: 400 });

  const patch: Record<string, unknown> = { overrides, updated_at: now, updated_by: admin.id };
  if (typeof parsed.data.published === "boolean") patch.published = parsed.data.published;

  const { data, error } = await supabase
    .from("chapter_content")
    .update(patch)
    .eq("chapter_id", id)
    .eq("is_custom", true)
    .select("overrides, updated_at, published")
    .single();
  if (error) {
    console.error("[admin/chapters] 儲存失敗:", error);
    return NextResponse.json({ error: "儲存失敗，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ overrides: data.overrides, updated_at: data.updated_at, published: data.published });
}

/** 內建章節：還原預設（刪覆蓋列）；新增的章節：刪除整章 */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await ctx.params;
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("chapter_content").delete().eq("chapter_id", id);
  if (error) return NextResponse.json({ error: "操作失敗" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
