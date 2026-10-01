// ────────────────────────────────────────────────
// 影片分享頁（/v/<影片 id>）的資料：任何拿到連結的人都看得到影片（跟原本分享影片檔連結一樣），
// 只有長輩本人和看得到影片的家人（已登入）才看得到按讚、留言
// ────────────────────────────────────────────────

import { z } from "zod";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { toClientVideo, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { loadCommentsViews, loadVideoAccess } from "@/lib/video-comments-server";
import type { TravelVideo } from "@/lib/travel-video";
import type { VideoCommentsView } from "@/lib/video-comments";

export interface SharedVideo {
  video: TravelVideo;
  /** 看的人是長輩本人／看得到影片的家人；其他人（沒登入、外人）是 null */
  viewer: "owner" | "family" | null;
  comments: VideoCommentsView | null;
}

/** 做好、沒刪掉的影片才給看 */
export async function loadSharedVideo(id: string, opts: { withViewer: boolean }): Promise<SharedVideo | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("travel_videos")
    .select("*")
    .eq("id", id)
    .eq("status", "succeeded")
    .is("deleted_at", null)
    .maybeSingle();
  const row = data as TravelVideoRow | null;
  if (!row?.video_path) return null;
  const video = toClientVideo(admin, row);
  if (!opts.withViewer) return { video, viewer: null, comments: null };

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { video, viewer: null, comments: null };
  const access = await loadVideoAccess(admin, row.id, user.id);
  if (!access) return { video, viewer: null, comments: null };
  const views = await loadCommentsViews(admin, [access.video], user.id);
  return { video, viewer: access.isOwner ? "owner" : "family", comments: views.get(row.id) ?? null };
}
