import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { TRAVEL_VIDEO_BUCKET, rawVideoStoragePath, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { isTravelVideoPending } from "@/lib/travel-video";
import { montageAllPaths } from "@/lib/ai/travel-montage-server";
import { voiceCommentPaths } from "@/lib/video-comments-server";

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

  // 語音留言的檔案也要清（查不到就中止，不然檔案會留在公開 bucket）
  let voicePaths: string[];
  try {
    voicePaths = await voiceCommentPaths(admin, row.id);
  } catch (e) {
    console.error("[api] travel video voice comments lookup:", e);
    return NextResponse.json({ error: "刪除沒成功，請再試一次" }, { status: 500 });
  }
  const paths = [
    row.photo_path,
    row.video_path,
    row.narration_path,
    row.narration_path ? rawVideoStoragePath(row) : null, // 合成中途留下的原始影片（通常已刪）
    ...(row.kind === "montage" ? montageAllPaths(row) : []), // 遊記：每張照片、配音、片段
    ...voicePaths, // 家人的語音留言
  ].filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    const { error: rmErr } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove([...new Set(paths)]);
    if (rmErr) {
      // 檔案還在公開 bucket（網址仍看得到）→ 不標記刪除、保留路徑，讓使用者可以再刪一次
      console.error("[api] travel video storage remove:", rmErr);
      return NextResponse.json({ error: "刪除沒成功，請再試一次" }, { status: 500 });
    }
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("travel_videos")
    .update({
      deleted_at: now,
      updated_at: now,
      photo_path: null,
      video_path: null,
      ...(row.narration_path ? { narration_path: null } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("[api] travel_videos soft delete:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  // 再掃一次：剛才收集檔案之後才存進來的語音留言（存的那邊看到影片已刪也會自己收掉）
  try {
    const late = (await voiceCommentPaths(admin, row.id)).filter((p) => !voicePaths.includes(p));
    if (late.length > 0) await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(late);
  } catch (e) {
    console.warn("[api] travel video late voice cleanup:", e);
  }
  return NextResponse.json({ ok: true });
}
