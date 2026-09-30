// ────────────────────────────────────────────────
// 出遊影片的按讚、留言：權限、讀寫、推播（只在 API route 用；service role）
// 看得到＝影片本人，或已接受的家人且長輩沒關掉「出遊影片」權限
// 注意：這支不能 import travel-video-server（那邊的 notifyOwner 會用到這裡）
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";
import {
  VIDEO_COMMENTS_PER_AUTHOR,
  buildCommentsView,
  commentPushForFamily,
  commentPushForOwner,
  familyCanSeeVideos,
  newVideoPushForFamily,
  type CommentRow,
  type VideoCommentsView,
  type VideoReaction,
} from "@/lib/video-comments";

type Admin = ReturnType<typeof createSupabaseAdmin>;

const ELDER_VIDEOS_LINK = "/?open=travel-video";
export const FAMILY_VIDEOS_LINK = "/?open=caregiver";
const COMMENT_COLUMNS = "id, video_id, author_id, emoji, body, created_at";

export interface VideoAccess {
  video: { id: string; user_id: string; place: string | null; kind: string | null };
  isOwner: boolean;
}

type Directory = Map<string, { name: string; relationship: string | null }>;

/** 看得到這支影片嗎（只算做好、沒刪掉的影片） */
export async function loadVideoAccess(admin: Admin, videoId: string, userId: string): Promise<VideoAccess | null> {
  const { data: video } = await admin
    .from("travel_videos")
    .select("id, user_id, place, kind, status, deleted_at")
    .eq("id", videoId)
    .maybeSingle();
  const v = video as { id: string; user_id: string; place: string | null; kind: string | null; status: string; deleted_at: string | null } | null;
  if (!v || v.deleted_at || v.status !== "succeeded") return null;
  const info = { id: v.id, user_id: v.user_id, place: v.place, kind: v.kind };
  if (v.user_id === userId) return { video: info, isOwner: true };
  const { data: links } = await admin
    .from("family_links")
    .select("permissions")
    .eq("owner_id", v.user_id)
    .eq("family_user_id", userId)
    .eq("status", "accepted");
  const ok = ((links ?? []) as { permissions: Record<string, unknown> | null }[]).some((l) => familyCanSeeVideos(l.permissions));
  return ok ? { video: info, isOwner: false } : null;
}

/** 長輩和他已接受的家人：名字與稱謂 */
export async function authorDirectory(admin: Admin, ownerId: string): Promise<Directory> {
  const [{ data: profile }, { data: links }] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", ownerId).maybeSingle(),
    admin.from("family_links").select("family_user_id, family_name, relationship").eq("owner_id", ownerId).eq("status", "accepted"),
  ]);
  const dir: Directory = new Map();
  for (const l of (links ?? []) as { family_user_id: string | null; family_name: string; relationship: string | null }[]) {
    if (l.family_user_id) dir.set(l.family_user_id, { name: l.family_name, relationship: l.relationship || null });
  }
  dir.set(ownerId, { name: (profile as { display_name: string | null } | null)?.display_name?.trim() || "長輩", relationship: null });
  return dir;
}

/** 多支影片的留言（可以是不同長輩的）；表還沒建就當作沒有留言 */
export async function loadCommentsViews(
  admin: Admin,
  videos: { id: string; user_id: string }[],
  viewerId: string
): Promise<Map<string, VideoCommentsView>> {
  const result = new Map<string, VideoCommentsView>();
  if (videos.length === 0) return result;
  const { data, error } = await admin
    .from("travel_video_comments")
    .select(COMMENT_COLUMNS)
    .in("video_id", videos.map((v) => v.id))
    .is("deleted_at", null);
  if (error) {
    console.warn("[video-comments] load failed:", error.message);
    return result;
  }
  const rows = (data ?? []) as CommentRow[];
  const owners = [...new Set(videos.map((v) => v.user_id))];
  const dirs = new Map(await Promise.all(owners.map(async (o) => [o, await authorDirectory(admin, o)] as const)));
  for (const v of videos) {
    result.set(
      v.id,
      buildCommentsView({
        rows: rows.filter((r) => r.video_id === v.id),
        viewerId,
        ownerId: v.user_id,
        directory: dirs.get(v.user_id) ?? new Map(),
      })
    );
  }
  return result;
}

/** 按讚：沒按過就加上，按過就收回；回傳這次是不是「加上」 */
export async function toggleReaction(admin: Admin, videoId: string, userId: string, emoji: VideoReaction): Promise<boolean> {
  const { data: existing, error } = await admin
    .from("travel_video_comments")
    .select("id")
    .eq("video_id", videoId)
    .eq("author_id", userId)
    .eq("emoji", emoji)
    .is("deleted_at", null)
    .limit(1);
  if (error) throw error;
  const found = (existing ?? []) as { id: string }[];
  if (found.length > 0) {
    const { error: delErr } = await admin
      .from("travel_video_comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", found[0].id);
    if (delErr) throw delErr;
    return false;
  }
  const { error: insErr } = await admin.from("travel_video_comments").insert({ video_id: videoId, author_id: userId, emoji });
  // 23505：同一個人連點兩下，另一個請求已經加上了
  if (insErr && insErr.code !== "23505") throw insErr;
  return !insErr;
}

/**
 * 留言；超過每人每支影片的上限就回 null（刪掉的不算）。
 * 先存再排：這個人在這支影片、還在的留言依時間排，排在上限內才留下，否則把剛存的刪掉。
 * 同時從兩台裝置送出也不會超過上限
 */
export async function addComment(admin: Admin, videoId: string, userId: string, body: string): Promise<string | null> {
  const { data, error } = await admin
    .from("travel_video_comments")
    .insert({ video_id: videoId, author_id: userId, body })
    .select("id")
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  const { data: kept, error: rankErr } = await admin
    .from("travel_video_comments")
    .select("id")
    .eq("video_id", videoId)
    .eq("author_id", userId)
    .not("body", "is", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(VIDEO_COMMENTS_PER_AUTHOR);
  if (rankErr) throw rankErr;
  if (((kept ?? []) as { id: string }[]).some((r) => r.id === id)) return id;
  await admin.from("travel_video_comments").delete().eq("id", id);
  return null;
}

/** 刪留言：自己的，或長輩刪自己影片底下的 */
export async function deleteComment(admin: Admin, access: VideoAccess, commentId: string, userId: string): Promise<boolean> {
  let q = admin
    .from("travel_video_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("video_id", access.video.id)
    .is("deleted_at", null);
  if (!access.isOwner) q = q.eq("author_id", userId);
  const { data, error } = await q.select("id");
  if (error) throw error;
  return ((data ?? []) as unknown[]).length > 0;
}

async function push(userIds: string[], message: { title: string; body: string }, url: string, tag: string) {
  await Promise.all(
    [...new Set(userIds)].map((uid) =>
      sendPushToUser(uid, { ...message, url, tag }).catch((e) => console.warn("[video-comments] push failed:", e))
    )
  );
}

/**
 * 有人按讚／留言之後推播：
 * - 家人 → 通知長輩
 * - 長輩留言（回覆）→ 通知在這支影片按過讚、留過言、而且還看得到影片的家人
 */
export async function notifyVideoComment(
  admin: Admin,
  access: VideoAccess,
  authorId: string,
  what: { emoji?: VideoReaction; body?: string; commentId?: string }
): Promise<void> {
  const ownerId = access.video.user_id;
  const dir = await authorDirectory(admin, ownerId);
  if (!access.isOwner) {
    const a = dir.get(authorId);
    const msg = commentPushForOwner({
      authorName: a?.name ?? "家人",
      relationship: a?.relationship ?? null,
      place: access.video.place,
      emoji: what.emoji ?? null,
      body: what.body ?? null,
    });
    const tag = what.emoji ? `video-reaction-${access.video.id}` : `video-comment-${what.commentId ?? access.video.id}`;
    await push([ownerId], msg, ELDER_VIDEOS_LINK, tag);
    return;
  }
  if (!what.body) return;
  const { data: rows } = await admin
    .from("travel_video_comments")
    .select("author_id")
    .eq("video_id", access.video.id)
    .neq("author_id", ownerId)
    .is("deleted_at", null);
  const authors = [...new Set(((rows ?? []) as { author_id: string }[]).map((r) => r.author_id))];
  if (authors.length === 0) return;
  const { data: links } = await admin
    .from("family_links")
    .select("family_user_id, permissions")
    .eq("owner_id", ownerId)
    .eq("status", "accepted")
    .in("family_user_id", authors);
  const targets = ((links ?? []) as { family_user_id: string; permissions: Record<string, unknown> | null }[])
    .filter((l) => familyCanSeeVideos(l.permissions))
    .map((l) => l.family_user_id);
  const msg = commentPushForFamily({ elderName: dir.get(ownerId)?.name ?? "長輩", body: what.body });
  await push(targets, msg, FAMILY_VIDEOS_LINK, `video-comment-${what.commentId ?? access.video.id}`);
}

/** 影片做好了 → 也告訴看得到影片的家人（失敗不影響本人的通知） */
export async function notifyFamilyNewVideo(row: { id: string; user_id: string; place: string | null; kind?: string | null }): Promise<void> {
  try {
    const admin = createSupabaseAdmin();
    const { data: links } = await admin
      .from("family_links")
      .select("family_user_id, permissions")
      .eq("owner_id", row.user_id)
      .eq("status", "accepted");
    const targets = ((links ?? []) as { family_user_id: string | null; permissions: Record<string, unknown> | null }[])
      .filter((l) => l.family_user_id && familyCanSeeVideos(l.permissions))
      .map((l) => l.family_user_id as string);
    if (targets.length === 0) return;
    const { data: profile } = await admin.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle();
    const elderName = (profile as { display_name: string | null } | null)?.display_name?.trim() || "長輩";
    const msg = newVideoPushForFamily({ elderName, place: row.place, montage: row.kind === "montage" });
    await push(targets, msg, FAMILY_VIDEOS_LINK, `family-new-video-${row.id}`);
  } catch (e) {
    console.warn("[video-comments] family new-video push failed:", e);
  }
}
