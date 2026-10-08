// 刪一則故事留言：自己的，或長輩刪自己故事底下的 → { comments }
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { EMPTY_COMMENTS } from "@/lib/video-comments";
import { deleteStoryComment, loadStoryAccess, loadStoryCommentsViews } from "@/lib/life-stories-server";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; commentId: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id, commentId } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(commentId).success) {
    return NextResponse.json({ error: "找不到這則留言" }, { status: 404 });
  }
  const admin = createSupabaseAdmin();
  const found = await loadStoryAccess(admin, id, user.id);
  if (!found) return NextResponse.json({ error: "找不到這篇故事" }, { status: 404 });
  try {
    if (!(await deleteStoryComment(admin, found, commentId, user.id))) {
      return NextResponse.json({ error: "找不到這則留言" }, { status: 404 });
    }
  } catch (e) {
    console.error("[api] story comment delete:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const views = await loadStoryCommentsViews(admin, [found.story], user.id);
  return NextResponse.json({ comments: views.get(found.story.id) ?? EMPTY_COMMENTS });
}
