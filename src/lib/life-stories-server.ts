// ────────────────────────────────────────────────
// 我的故事集（只在 API route 用；service role）：照片簽名網址、誰看得到、按讚留言、推播
// 看得到＝本人，或已接受的家人且這篇有勾「給家人看」
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";
import { authorDirectory } from "@/lib/video-comments-server";
import {
  VIDEO_COMMENTS_PER_AUTHOR,
  buildCommentsView,
  type CommentRow,
  type VideoCommentsView,
  type VideoReaction,
} from "@/lib/video-comments";
import {
  newStoryPushForFamily,
  storyCommentPushForFamily,
  storyCommentPushForOwner,
  type LifeStory,
} from "@/lib/life-stories";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export const STORY_BUCKET = "life-stories";
/** 照片網址 1 小時有效（私人 bucket；畫面每次載入重新簽） */
const SIGNED_URL_SECONDS = 3600;
const ELDER_STORIES_LINK = "/?open=stories";
const FAMILY_STORIES_LINK = "/?open=caregiver";

export interface StoryRow {
  id: string;
  user_id: string;
  title: string;
  era: string | null;
  body: string;
  photos: { path: string; width: number; height: number }[] | null;
  interview: unknown;
  share_with_family: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function storyPhotoPath(userId: string, storyId: string, index: number, sourcePath: string): string {
  const ext = /\.(png|webp)$/i.exec(sourcePath)?.[1]?.toLowerCase() ?? "jpg";
  return `${userId}/${storyId}/photo-${index}.${ext}`;
}

/** 好幾篇故事的照片一次簽網址 */
export async function signStoryPhotos(admin: Admin, rows: StoryRow[]): Promise<Map<string, string>> {
  const paths = rows.flatMap((r) => (r.photos ?? []).map((p) => p.path));
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data, error } = await admin.storage.from(STORY_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) {
    console.warn("[stories] sign photos failed:", error.message);
    return urls;
  }
  for (const d of data ?? []) if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
  return urls;
}

export function toClientStory(row: StoryRow, urls: Map<string, string>): LifeStory {
  return {
    id: row.id,
    title: row.title,
    era: row.era,
    body: row.body,
    photos: (row.photos ?? [])
      .map((p) => ({ url: urls.get(p.path) ?? "", width: p.width, height: p.height }))
      .filter((p) => p.url),
    share_with_family: row.share_with_family,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface StoryAccess {
  story: StoryRow;
  isOwner: boolean;
}

/** 這篇故事看得到嗎（本人；或已接受的家人，且這篇有給家人看） */
export async function loadStoryAccess(admin: Admin, storyId: string, userId: string): Promise<StoryAccess | null> {
  const { data } = await admin.from("life_stories").select("*").eq("id", storyId).is("deleted_at", null).maybeSingle();
  const story = data as StoryRow | null;
  if (!story) return null;
  if (story.user_id === userId) return { story, isOwner: true };
  if (!story.share_with_family) return null;
  const { data: links } = await admin
    .from("family_links")
    .select("id")
    .eq("owner_id", story.user_id)
    .eq("family_user_id", userId)
    .eq("status", "accepted")
    .limit(1);
  return (links ?? []).length > 0 ? { story, isOwner: false } : null;
}

// ── 按讚、留言（和出遊影片一樣的規則與畫面） ──

export async function loadStoryCommentsViews(
  admin: Admin,
  stories: { id: string; user_id: string }[],
  viewerId: string
): Promise<Map<string, VideoCommentsView>> {
  const result = new Map<string, VideoCommentsView>();
  if (stories.length === 0) return result;
  const { data, error } = await admin
    .from("life_story_comments")
    .select("id, story_id, author_id, emoji, body, created_at")
    .in("story_id", stories.map((s) => s.id))
    .is("deleted_at", null);
  if (error) {
    console.warn("[stories] load comments failed:", error.message);
    return result;
  }
  const rows = ((data ?? []) as (Omit<CommentRow, "video_id"> & { story_id: string })[]).map((r) => ({
    ...r,
    video_id: r.story_id,
  }));
  const owners = [...new Set(stories.map((s) => s.user_id))];
  const dirs = new Map(await Promise.all(owners.map(async (o) => [o, await authorDirectory(admin, o)] as const)));
  for (const s of stories) {
    result.set(
      s.id,
      buildCommentsView({
        rows: rows.filter((r) => r.story_id === s.id),
        viewerId,
        ownerId: s.user_id,
        directory: dirs.get(s.user_id) ?? new Map(),
      })
    );
  }
  return result;
}

/** 按讚：沒按過就加上，按過就收回；回傳這次是不是「加上」 */
export async function toggleStoryReaction(admin: Admin, storyId: string, userId: string, emoji: VideoReaction): Promise<boolean> {
  const { data: existing, error } = await admin
    .from("life_story_comments")
    .select("id")
    .eq("story_id", storyId)
    .eq("author_id", userId)
    .eq("emoji", emoji)
    .is("deleted_at", null)
    .limit(1);
  if (error) throw error;
  const found = (existing ?? []) as { id: string }[];
  if (found.length > 0) {
    const { error: delErr } = await admin
      .from("life_story_comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", found[0].id);
    if (delErr) throw delErr;
    return false;
  }
  const { error: insErr } = await admin.from("life_story_comments").insert({ story_id: storyId, author_id: userId, emoji });
  if (insErr && insErr.code !== "23505") throw insErr;
  return !insErr;
}

/** 留言；超過每人每篇的上限回 null（先存再排：同時送出也不會超過） */
export async function addStoryComment(admin: Admin, storyId: string, userId: string, body: string): Promise<string | null> {
  const { data, error } = await admin
    .from("life_story_comments")
    .insert({ story_id: storyId, author_id: userId, body })
    .select("id")
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  const { data: kept, error: keptErr } = await admin
    .from("life_story_comments")
    .select("id")
    .eq("story_id", storyId)
    .eq("author_id", userId)
    .is("emoji", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(VIDEO_COMMENTS_PER_AUTHOR);
  if (keptErr) throw keptErr;
  if (((kept ?? []) as { id: string }[]).some((r) => r.id === id)) return id;
  await admin.from("life_story_comments").delete().eq("id", id);
  return null;
}

/** 刪留言：自己的，或長輩刪自己故事底下的 */
export async function deleteStoryComment(admin: Admin, access: StoryAccess, commentId: string, userId: string): Promise<boolean> {
  let q = admin
    .from("life_story_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("story_id", access.story.id)
    .is("deleted_at", null);
  if (!access.isOwner) q = q.eq("author_id", userId);
  const { data, error } = await q.select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function push(userIds: string[], message: { title: string; body: string }, url: string, tag: string) {
  await Promise.all(
    [...new Set(userIds)].map((uid) =>
      sendPushToUser(uid, { ...message, url, tag }).catch((e) => console.warn("[stories] push failed:", e))
    )
  );
}

async function acceptedFamily(admin: Admin, ownerId: string): Promise<string[]> {
  const { data } = await admin
    .from("family_links")
    .select("family_user_id")
    .eq("owner_id", ownerId)
    .eq("status", "accepted");
  return ((data ?? []) as { family_user_id: string | null }[]).map((l) => l.family_user_id).filter((v): v is string => Boolean(v));
}

/** 家人按讚／留言 → 通知長輩；長輩回覆 → 通知在這篇留過言、按過讚的家人 */
export async function notifyStoryComment(
  admin: Admin,
  access: StoryAccess,
  authorId: string,
  what: { emoji?: VideoReaction; body?: string; commentId?: string }
): Promise<void> {
  const ownerId = access.story.user_id;
  const dir = await authorDirectory(admin, ownerId);
  if (!access.isOwner) {
    const a = dir.get(authorId);
    const msg = storyCommentPushForOwner({
      authorName: a?.name ?? "家人",
      relationship: a?.relationship ?? null,
      storyTitle: access.story.title,
      emoji: what.emoji ?? null,
      body: what.body ?? null,
    });
    const tag = what.emoji ? `story-reaction-${access.story.id}` : `story-comment-${what.commentId ?? access.story.id}`;
    await push([ownerId], msg, ELDER_STORIES_LINK, tag);
    return;
  }
  if (!what.body || !access.story.share_with_family) return;
  const { data: rows } = await admin
    .from("life_story_comments")
    .select("author_id")
    .eq("story_id", access.story.id)
    .neq("author_id", ownerId)
    .is("deleted_at", null);
  const family = new Set(await acceptedFamily(admin, ownerId));
  const targets = [...new Set(((rows ?? []) as { author_id: string }[]).map((r) => r.author_id))].filter((id) => family.has(id));
  if (targets.length === 0) return;
  const msg = storyCommentPushForFamily({ elderName: dir.get(ownerId)?.name ?? "長輩", body: what.body });
  await push(targets, msg, FAMILY_STORIES_LINK, `story-comment-${what.commentId ?? access.story.id}`);
}

/** 新故事給家人看 → 通知家人（失敗不影響存檔） */
export async function notifyFamilyNewStory(admin: Admin, row: StoryRow): Promise<void> {
  try {
    if (!row.share_with_family) return;
    const targets = await acceptedFamily(admin, row.user_id);
    if (targets.length === 0) return;
    const { data: profile } = await admin.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle();
    const elderName = (profile as { display_name: string | null } | null)?.display_name?.trim() || "長輩";
    await push(targets, newStoryPushForFamily({ elderName, title: row.title }), FAMILY_STORIES_LINK, `family-new-story-${row.id}`);
  } catch (e) {
    console.warn("[stories] family new-story push failed:", e);
  }
}
