// ────────────────────────────────────────────────
// 出遊影片的按讚、留言（影片本人＋看得到影片的家人）
// GET  → { comments: VideoCommentsView }
// POST { emoji } 按讚／收回；{ body } 留言 → { comments }；有新的就推播給對方
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import {
  addComment,
  loadCommentsViews,
  loadVideoAccess,
  notifyVideoComment,
  toggleReaction,
} from "@/lib/video-comments-server";
import { EMPTY_COMMENTS, VIDEO_COMMENTS_PER_AUTHOR, VIDEO_REACTIONS, sanitizeComment } from "@/lib/video-comments";

const PostSchema = z.union([
  z.object({ emoji: z.enum(VIDEO_REACTIONS) }),
  z.object({ body: z.string().max(500) }),
]);

async function access(ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return { error: NextResponse.json({ error: "找不到這支影片" }, { status: 404 }) };
  }
  const admin = createSupabaseAdmin();
  const found = await loadVideoAccess(admin, id, user.id);
  if (!found) return { error: NextResponse.json({ error: "找不到這支影片" }, { status: 404 }) };
  return { user, admin, found };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await access(ctx);
  if ("error" in a) return a.error;
  const views = await loadCommentsViews(a.admin, [a.found.video], a.user.id);
  return NextResponse.json({ comments: views.get(a.found.video.id) ?? EMPTY_COMMENTS });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await access(ctx);
  if ("error" in a) return a.error;
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });

  const { admin, user, found } = a;
  try {
    if ("emoji" in parsed.data) {
      const emoji = parsed.data.emoji;
      const added = await toggleReaction(admin, found.video.id, user.id, emoji);
      if (added) after(() => notifyVideoComment(admin, found, user.id, { emoji }));
    } else {
      const body = sanitizeComment(parsed.data.body);
      if (!body) return NextResponse.json({ error: "先寫一句話喔" }, { status: 400 });
      const commentId = await addComment(admin, found.video.id, user.id, body);
      if (!commentId) {
        return NextResponse.json({ error: `這支影片你已經留了 ${VIDEO_COMMENTS_PER_AUTHOR} 則，先休息一下吧` }, { status: 429 });
      }
      after(() => notifyVideoComment(admin, found, user.id, { body, commentId }));
    }
  } catch (e) {
    console.error("[api] video comment failed:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  const views = await loadCommentsViews(admin, [found.video], user.id);
  return NextResponse.json({ comments: views.get(found.video.id) ?? EMPTY_COMMENTS });
}
