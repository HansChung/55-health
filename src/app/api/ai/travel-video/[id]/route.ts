import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { TRAVEL_VIDEO_BUCKET, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { isTravelVideoPending } from "@/lib/travel-video";

/**
 * 刪除一支出遊影片：刪掉 Storage 檔案，DB 列只做軟刪除
 * （保留列才能正確計算本月配額，避免刪了重做繞過次數）
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "找不到這支影片" }, { status: 404 });
  }

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("travel_videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id) // 確保只能刪自己的
    .is("deleted_at", null)
    .maybeSingle();
  const row = data as TravelVideoRow | null;
  if (!row) return NextResponse.json({ error: "找不到這支影片" }, { status: 404 });

  if (isTravelVideoPending(row.status)) {
    return NextResponse.json({ error: "影片還在做，做好後再刪除" }, { status: 409 });
  }

  const paths = [row.photo_path, row.video_path].filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    const { error: rmErr } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(paths);
    if (rmErr) console.error("[api] travel video storage remove:", rmErr);
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("travel_videos")
    .update({ deleted_at: now, updated_at: now, photo_path: null, video_path: null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("[api] travel_videos soft delete:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
