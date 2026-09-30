// 刪一則留言：自己的，或長輩刪自己影片底下的 → { comments }
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { deleteComment, loadCommentsViews, loadVideoAccess } from "@/lib/video-comments-server";
import { EMPTY_COMMENTS } from "@/lib/video-comments";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; commentId: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id, commentId } = await ctx.params;
  const uuid = z.string().uuid();
  if (!uuid.safeParse(id).success || !uuid.safeParse(commentId).success) {
    return NextResponse.json({ error: "找不到這則留言" }, { status: 404 });
  }
  const admin = createSupabaseAdmin();
  const found = await loadVideoAccess(admin, id, user.id);
  if (!found) return NextResponse.json({ error: "找不到這支影片" }, { status: 404 });
  try {
    if (!(await deleteComment(admin, found, commentId, user.id))) {
      return NextResponse.json({ error: "找不到這則留言" }, { status: 404 });
    }
  } catch (e) {
    console.error("[api] video comment delete failed:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const views = await loadCommentsViews(admin, [found.video], user.id);
  return NextResponse.json({ comments: views.get(found.video.id) ?? EMPTY_COMMENTS });
}
