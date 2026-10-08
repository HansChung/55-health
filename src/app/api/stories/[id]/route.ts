// ────────────────────────────────────────────────
// 我的故事集：改一篇（標題、年代、內容、給不給家人看）、刪一篇（照片一起刪）
// PATCH { title?, era?, body?, shareWithFamily? } → { story }；DELETE → { ok }
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { STORY_BODY_MAX, sanitizeStoryBody, sanitizeStoryEra, sanitizeStoryTitle } from "@/lib/life-stories";
import { STORY_BUCKET, signStoryPhotos, toClientStory, type StoryRow } from "@/lib/life-stories-server";

const PatchSchema = z.object({
  title: z.string().max(100).optional(),
  era: z.string().max(100).optional(),
  body: z.string().max(STORY_BODY_MAX * 2).optional(),
  shareWithFamily: z.boolean().optional(),
});

async function ownStory(id: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  if (!z.string().uuid().safeParse(id).success) return { error: NextResponse.json({ error: "找不到這篇故事" }, { status: 404 }) };
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("life_stories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return { error: NextResponse.json({ error: "找不到這篇故事" }, { status: 404 }) };
  return { admin, row: data as StoryRow };
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const found = await ownStory((await ctx.params).id);
  if ("error" in found) return found.error;
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const b = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (b.title !== undefined) {
    const title = sanitizeStoryTitle(b.title);
    if (!title) return NextResponse.json({ error: "標題要寫喔" }, { status: 400 });
    patch.title = title;
  }
  if (b.body !== undefined) {
    const body = sanitizeStoryBody(b.body);
    if (!body) return NextResponse.json({ error: "內容要寫喔" }, { status: 400 });
    patch.body = body;
  }
  if (b.era !== undefined) patch.era = sanitizeStoryEra(b.era) || null;
  if (b.shareWithFamily !== undefined) patch.share_with_family = b.shareWithFamily;
  const { data, error } = await found.admin.from("life_stories").update(patch).eq("id", found.row.id).select("*").single();
  if (error || !data) {
    console.error("[api] story update:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const row = data as StoryRow;
  return NextResponse.json({ story: toClientStory(row, await signStoryPhotos(found.admin, [row])) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const found = await ownStory((await ctx.params).id);
  if ("error" in found) return found.error;
  // 先軟刪除（失敗就整篇原封不動），再刪照片；照片刪不掉時路徑留在已刪除的那一列，找得到再補刪
  const { error } = await found.admin
    .from("life_stories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", found.row.id);
  if (error) {
    console.error("[api] story delete:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const paths = (found.row.photos ?? []).map((p) => p.path);
  if (paths.length) {
    const { error: rmErr } = await found.admin.storage.from(STORY_BUCKET).remove(paths);
    if (rmErr) console.warn("[api] story photo remove (story already deleted):", found.row.id, rmErr.message);
    else await found.admin.from("life_stories").update({ photos: [] }).eq("id", found.row.id);
  }
  return NextResponse.json({ ok: true });
}
