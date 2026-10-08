// ────────────────────────────────────────────────
// 出遊影片的按讚、留言：前後端共用的型別與整理邏輯
// ────────────────────────────────────────────────

export const VIDEO_REACTIONS = ["❤️", "👍", "😂", "🥹", "👏"] as const;
export type VideoReaction = (typeof VIDEO_REACTIONS)[number];

export const VIDEO_COMMENT_MAX = 100;
/** 語音留言：最長幾秒、至少幾秒（太短多半是不小心按到） */
export const VOICE_COMMENT_MAX_SECONDS = 60;
export const VOICE_COMMENT_MIN_SECONDS = 1;
/** 同一個人對同一支影片最多留幾則（避免洗版） */
export const VIDEO_COMMENTS_PER_AUTHOR = 30;

/** 快速留言：長輩打字比較慢，點一下就送出 */
export const QUICK_REPLIES_FOR_ELDER = ["謝謝你 🥰", "下次一起去！", "有空回來吃飯喔"] as const;
export const QUICK_REPLIES_FOR_FAMILY = ["好美喔！", "玩得開心嗎？", "下次帶我一起去 😆"] as const;
/** 我的故事集用的快速留言 */
export const STORY_QUICK_REPLIES_FOR_ELDER = ["謝謝你看 🥰", "下次講給你聽", "有空回來聊天喔"] as const;
export const STORY_QUICK_REPLIES_FOR_FAMILY = ["好感動 🥹", "第一次聽到這件事！", "下次再多講一點"] as const;

export interface CommentAuthor {
  name: string;
  /** 家人的稱謂（女兒、兒子…）；本人沒有 */
  relationship: string | null;
  is_me: boolean;
  /** 影片主人（長輩） */
  is_owner: boolean;
}

export interface VideoComment {
  id: string;
  author: CommentAuthor;
  /** 文字留言；語音留言是 null */
  body: string | null;
  /** 語音留言 */
  audio_url: string | null;
  audio_seconds: number | null;
  created_at: string;
  can_delete: boolean;
}

export interface VideoReactionSummary {
  emoji: VideoReaction;
  count: number;
  mine: boolean;
  /** 誰按的（顯示用） */
  names: string[];
}

export interface VideoCommentsView {
  reactions: VideoReactionSummary[];
  /** 舊的在前 */
  comments: VideoComment[];
  /** 看過影片的家人（最近看的在前）；只有影片主人拿得到 */
  viewers?: VideoViewer[];
}

export interface VideoViewer {
  name: string;
  relationship: string | null;
  last_viewed_at: string;
}

/** travel_video_views 的一列 */
export interface VideoViewRow {
  video_id: string;
  viewer_id: string;
  last_viewed_at: string;
}

export const EMPTY_COMMENTS: VideoCommentsView = { reactions: [], comments: [] };

export interface CommentRow {
  id: string;
  video_id: string;
  author_id: string;
  emoji: string | null;
  body: string | null;
  /** 語音留言（伺服器先把 audio_path 換成公開網址） */
  audio_url?: string | null;
  audio_seconds?: number | null;
  created_at: string;
}

export function isVideoReaction(v: unknown): v is VideoReaction {
  return typeof v === "string" && (VIDEO_REACTIONS as readonly string[]).includes(v);
}

/** 留言文字：去控制字元、壓成一行、限制長度 */
export function sanitizeComment(text: string | null | undefined): string {
  if (!text) return "";
  return [...text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()]
    .slice(0, VIDEO_COMMENT_MAX)
    .join("");
}

/** 顯示名字：「小美（女兒）」 */
export function authorLabel(a: Pick<CommentAuthor, "name" | "relationship" | "is_me">): string {
  if (a.is_me) return "我";
  return a.relationship ? `${a.name}（${a.relationship}）` : a.name;
}

/**
 * 把一支影片的留言列整理成畫面要的樣子。
 * directory：author_id → 名字／稱謂（影片主人與他的家人）；查不到的人（例如已解除連結）顯示「家人」
 */
export function buildCommentsView(opts: {
  rows: CommentRow[];
  viewerId: string;
  ownerId: string;
  directory: Map<string, { name: string; relationship: string | null }>;
  /** 這支影片的觀看紀錄（只有影片主人看得到「誰看過了」） */
  views?: VideoViewRow[];
}): VideoCommentsView {
  const { rows, viewerId, ownerId, directory, views } = opts;
  const author = (id: string): CommentAuthor => {
    const d = directory.get(id);
    return {
      name: d?.name ?? "家人",
      relationship: id === ownerId ? null : d?.relationship ?? null,
      is_me: id === viewerId,
      is_owner: id === ownerId,
    };
  };
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const reactions: VideoReactionSummary[] = [];
  for (const emoji of VIDEO_REACTIONS) {
    const mine = sorted.filter((r) => r.emoji === emoji);
    if (mine.length === 0) continue;
    reactions.push({
      emoji,
      count: mine.length,
      mine: mine.some((r) => r.author_id === viewerId),
      names: mine.map((r) => authorLabel(author(r.author_id))),
    });
  }

  const comments = sorted
    .filter((r) => r.body || r.audio_url)
    .map((r) => ({
      id: r.id,
      author: author(r.author_id),
      body: r.body ?? null,
      audio_url: r.audio_url ?? null,
      audio_seconds: r.audio_seconds != null ? Number(r.audio_seconds) : null,
      created_at: r.created_at,
      // 自己的留言可以刪；長輩可以刪自己影片底下任何一則
      can_delete: r.author_id === viewerId || viewerId === ownerId,
    }));

  if (!views || viewerId !== ownerId) return { reactions, comments };
  // 只列還連著的家人（取消連結的人不顯示）
  const viewers = views
    .filter((v) => v.viewer_id !== ownerId && directory.has(v.viewer_id))
    .sort((a, b) => b.last_viewed_at.localeCompare(a.last_viewed_at))
    .map((v) => ({
      name: directory.get(v.viewer_id)!.name,
      relationship: directory.get(v.viewer_id)!.relationship,
      last_viewed_at: v.last_viewed_at,
    }));
  return { reactions, comments, viewers };
}

/** 「王小美（女兒）、阿明看過了」；人多就「…等 5 人看過了」 */
export function viewersLine(viewers: Pick<VideoViewer, "name" | "relationship">[], max = 3): string {
  if (viewers.length === 0) return "";
  const names = viewers.slice(0, max).map((v) => (v.relationship ? `${v.name}（${v.relationship}）` : v.name));
  return viewers.length > max ? `${names.join("、")}等 ${viewers.length} 人看過了` : `${names.join("、")}看過了`;
}

/** 推播文字：家人對長輩的影片按讚／留言 */
export function commentPushForOwner(opts: {
  authorName: string;
  relationship: string | null;
  place: string | null;
  emoji?: VideoReaction | null;
  body?: string | null;
  /** 語音留言的秒數 */
  voiceSeconds?: number | null;
}): { title: string; body: string } {
  const who = opts.relationship ? `${opts.authorName}（${opts.relationship}）` : opts.authorName;
  const video = opts.place ? `「${opts.place}」的影片` : "你的出遊影片";
  if (opts.emoji) return { title: `${opts.emoji} ${who}`, body: `${who}對${video}按了 ${opts.emoji}` };
  if (opts.voiceSeconds != null) {
    return { title: `🎤 ${who}傳了一段語音`, body: `點這裡聽聽看（${Math.max(1, Math.round(opts.voiceSeconds))} 秒）` };
  }
  return { title: `💬 ${who}留言了`, body: opts.body ?? "" };
}

/** 推播文字：長輩回覆（給在這支影片留過言、按過讚的家人） */
export function commentPushForFamily(opts: { elderName: string; body?: string | null; voiceSeconds?: number | null }): {
  title: string;
  body: string;
} {
  if (opts.voiceSeconds != null) {
    return { title: `🎤 ${opts.elderName}回覆了一段語音`, body: `點這裡聽聽看（${Math.max(1, Math.round(opts.voiceSeconds))} 秒）` };
  }
  return { title: `💬 ${opts.elderName}回覆了`, body: opts.body ?? "" };
}

/** 「念給我聽」：把文字留言排成要念的句子（語音留言不念，畫面上直接播） */
export function commentsSpeechText(comments: Pick<VideoComment, "author" | "body">[]): string[] {
  return comments
    .filter((c) => c.body)
    .map((c) => `${c.author.is_me ? "我" : authorLabel(c.author)}說：${c.body}`);
}

export function formatVoiceSeconds(seconds: number | null): string {
  return `${Math.max(1, Math.round(seconds ?? 0))} 秒`;
}

/** 推播文字：長輩做好一支新影片（給看得到影片的家人） */
export function newVideoPushForFamily(opts: { elderName: string; place: string | null; montage: boolean; mv?: boolean }): {
  title: string;
  body: string;
} {
  const what = opts.mv ? "MV" : opts.montage ? "遊記影片" : "出遊影片";
  return {
    title: `🎬 ${opts.elderName}做了一支${what}`,
    body: `${opts.place ? `在「${opts.place}」，` : ""}點這裡看看，給${opts.elderName}按個讚吧`,
  };
}

/** 家人預設看得到影片（長輩在「家人共享」可以關） */
export function familyCanSeeVideos(permissions: Record<string, unknown> | null | undefined): boolean {
  return permissions?.videos !== false;
}
