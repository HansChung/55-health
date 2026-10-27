// ────────────────────────────────────────────────
// 數位名片（伺服器）：讀寫 business_cards、大頭照（公開 bucket business-cards）、精選作品
// 作品每次顯示都重新確認：還是本人的、影片還在、故事沒刪掉；不在了就不顯示
// 沒跑 add-business-cards.sql：讀取時丟 CardTableMissing，API 回 503
// ────────────────────────────────────────────────
import { randomBytes, randomUUID } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { toClientVideo, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { videoShareMeta, videoSharePath } from "@/lib/travel-video";
import { sniffImageType } from "@/lib/admin-media";
import {
  isCardSlug,
  slugFromBytes,
  type BusinessCard,
  type CardFields,
  type CardWork,
  type CardWorkChoice,
  type CardWorkRef,
  type PublicBusinessCard,
  toPublicCard,
} from "@/lib/business-card";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export const CARD_PHOTO_BUCKET = "business-cards";
const CARD_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
const CHOICES_MAX = 30;

export class CardTableMissing extends Error {}

interface CardRow extends CardFields {
  user_id: string;
  slug: string;
  photo_path: string | null;
  is_public: boolean;
  updated_at: string;
}

const COLUMNS =
  "user_id, slug, display_name, nickname, intro, interests, photo_path, phone, line_id, email, show_phone, show_line, show_email, works, is_public, updated_at";

/** 資料表不存在（42P01）或 PostgREST 找不到表（PGRST205） */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (error.code === "42P01" || error.code === "PGRST205" || /business_cards/.test(error.message ?? "") && /exist|schema cache/.test(error.message ?? "")));
}

export function newCardSlug(): string {
  return slugFromBytes(randomBytes(16));
}

function photoUrl(admin: Admin, path: string | null): string | null {
  return path ? admin.storage.from(CARD_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl : null;
}

function toCard(admin: Admin, row: CardRow): BusinessCard {
  return {
    slug: row.slug,
    display_name: row.display_name,
    nickname: row.nickname,
    intro: row.intro,
    interests: row.interests,
    phone: row.phone,
    line_id: row.line_id,
    email: row.email,
    show_phone: row.show_phone,
    show_line: row.show_line,
    show_email: row.show_email,
    works: Array.isArray(row.works) ? row.works : [],
    photo_url: photoUrl(admin, row.photo_path),
    is_public: row.is_public,
    updated_at: row.updated_at,
  };
}

async function loadRow(admin: Admin, userId: string): Promise<CardRow | null> {
  const { data, error } = await admin.from("business_cards").select(COLUMNS).eq("user_id", userId).maybeSingle();
  if (error) {
    if (isMissingTable(error)) throw new CardTableMissing(error.message);
    throw new Error(`load business card failed: ${error.message}`);
  }
  return (data as CardRow | null) ?? null;
}

export async function loadOwnCard(admin: Admin, userId: string): Promise<BusinessCard | null> {
  const row = await loadRow(admin, userId);
  return row ? toCard(admin, row) : null;
}

/** 存名片欄位：第一次存就建一張（給一個隨機連結代碼）；代碼撞到就換一個再試 */
export async function saveCardFields(admin: Admin, userId: string, fields: CardFields): Promise<BusinessCard> {
  const now = new Date().toISOString();
  const existing = await loadRow(admin, userId);
  if (existing) {
    const { data, error } = await admin.from("business_cards").update({ ...fields, updated_at: now }).eq("user_id", userId).select(COLUMNS).single();
    if (error || !data) throw new Error(`update business card failed: ${error?.message}`);
    return toCard(admin, data as CardRow);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin
      .from("business_cards")
      .insert({ user_id: userId, slug: newCardSlug(), ...fields, updated_at: now })
      .select(COLUMNS)
      .single();
    if (!error && data) return toCard(admin, data as CardRow);
    if (error?.code !== "23505") throw new Error(`insert business card failed: ${error?.message}`);
    // 同時按了兩次儲存：另一個請求已經建好了 → 改成更新
    if (/business_cards_pkey/.test(error.message)) return saveCardFields(admin, userId, fields);
  }
  throw new Error("insert business card failed: slug collisions");
}

/** 開始／停止分享、換新連結（舊連結馬上失效） */
export async function updateCardSharing(
  admin: Admin,
  userId: string,
  action: "share" | "unshare" | "new_link"
): Promise<BusinessCard | null> {
  const patch =
    action === "share" ? { is_public: true } : action === "unshare" ? { is_public: false } : { slug: newCardSlug() };
  const { data, error } = await admin
    .from("business_cards")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`update business card sharing failed: ${error.message}`);
  return data ? toCard(admin, data as CardRow) : null;
}

/** 換大頭照：檢查真的是圖片 → 放到 {user}/{uuid}.jpg → 更新名片 → 刪掉舊的 */
export async function replaceCardPhoto(admin: Admin, userId: string, buffer: Buffer | null): Promise<BusinessCard> {
  const row = await loadRow(admin, userId);
  if (!row) throw new Error("business card missing");
  let path: string | null = null;
  if (buffer) {
    const type = sniffImageType(buffer);
    if (type !== "image/jpeg" && type !== "image/png" && type !== "image/webp") throw new CardPhotoError("看不懂這張照片的格式，請換一張（JPG 最好）");
    if (buffer.length > CARD_PHOTO_MAX_BYTES) throw new CardPhotoError("照片太大了，請換一張");
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    path = `${userId}/${randomUUID()}.${ext}`;
    const { error } = await admin.storage.from(CARD_PHOTO_BUCKET).upload(path, buffer, { contentType: type, upsert: false, cacheControl: "31536000" });
    if (error) throw new Error(`upload card photo failed: ${error.message}`);
  }
  const { data, error } = await admin
    .from("business_cards")
    .update({ photo_path: path, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select(COLUMNS)
    .single();
  if (error || !data) {
    if (path) await admin.storage.from(CARD_PHOTO_BUCKET).remove([path]);
    throw new Error(`update card photo failed: ${error?.message}`);
  }
  if (row.photo_path && row.photo_path !== path) {
    const { error: rmErr } = await admin.storage.from(CARD_PHOTO_BUCKET).remove([row.photo_path]);
    if (rmErr) console.warn("[business-card] old photo not removed:", row.photo_path, rmErr.message);
  }
  return toCard(admin, data as CardRow);
}

export class CardPhotoError extends Error {}

interface StoryRow {
  id: string;
  title: string;
  era: string | null;
  body: string;
  share_with_family: boolean;
}

async function loadVideos(admin: Admin, userId: string, ids?: string[]): Promise<TravelVideoRow[]> {
  let q = admin
    .from("travel_videos")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "succeeded")
    .is("deleted_at", null)
    .not("video_path", "is", null);
  q = ids ? q.in("id", ids) : q.order("created_at", { ascending: false }).limit(CHOICES_MAX);
  const { data, error } = await q;
  if (error) {
    console.warn("[business-card] load videos:", error.message);
    return [];
  }
  return (data ?? []) as TravelVideoRow[];
}

async function loadStories(admin: Admin, userId: string, ids?: string[]): Promise<StoryRow[]> {
  let q = admin.from("life_stories").select("id, title, era, body, share_with_family").eq("user_id", userId).is("deleted_at", null);
  q = ids ? q.in("id", ids) : q.order("created_at", { ascending: false }).limit(CHOICES_MAX);
  const { data, error } = await q;
  if (error) {
    // 還沒跑 add-life-stories.sql：就是沒有故事可以選
    console.warn("[business-card] load stories:", error.message);
    return [];
  }
  return (data ?? []) as StoryRow[];
}

/** 可以放上名片的作品：做好的影片、沒刪掉的故事（各最多 30 件，新的在前面） */
export async function loadWorkChoices(admin: Admin, userId: string): Promise<CardWorkChoice[]> {
  const [videos, stories] = await Promise.all([loadVideos(admin, userId), loadStories(admin, userId)]);
  return [
    ...videos.map((row): CardWorkChoice => {
      const v = toClientVideo(admin, row);
      return { kind: "video", id: row.id, title: videoShareMeta(v).title, photo_url: v.photo_url };
    }),
    ...stories.map((s): CardWorkChoice => ({
      kind: "story", id: s.id, title: s.era ? `${s.title}（${s.era}）` : s.title, photo_url: null, private: !s.share_with_family,
    })),
  ];
}

/** 名片上的精選作品（照長輩排的順序；不在了的跳過） */
export async function loadCardWorks(admin: Admin, userId: string, refs: CardWorkRef[]): Promise<CardWork[]> {
  const videoIds = refs.filter((r) => r.kind === "video").map((r) => r.id);
  const storyIds = refs.filter((r) => r.kind === "story").map((r) => r.id);
  const [videos, stories] = await Promise.all([
    videoIds.length ? loadVideos(admin, userId, videoIds) : Promise.resolve([]),
    storyIds.length ? loadStories(admin, userId, storyIds) : Promise.resolve([]),
  ]);
  const out: CardWork[] = [];
  for (const ref of refs) {
    if (ref.kind === "video") {
      const row = videos.find((v) => v.id === ref.id);
      if (!row) continue;
      const v = toClientVideo(admin, row);
      out.push({ kind: "video", id: row.id, title: videoShareMeta(v).title, photo_url: v.photo_url, href: videoSharePath(row.id) });
    } else {
      const s = stories.find((x) => x.id === ref.id);
      if (!s) continue;
      out.push({ kind: "story", id: s.id, title: s.title, photo_url: null, href: null, era: s.era, body: s.body });
    }
  }
  return out;
}

/** 存之前：只留真的是本人的、還在的作品 */
export async function ownedWorkRefs(admin: Admin, userId: string, refs: CardWorkRef[]): Promise<CardWorkRef[]> {
  const works = await loadCardWorks(admin, userId, refs);
  return works.map(({ kind, id }) => ({ kind, id }));
}

/** 分享頁：有開始分享的名片才給看 */
export async function loadPublicCard(slug: string): Promise<PublicBusinessCard | null> {
  if (!isCardSlug(slug)) return null;
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("business_cards").select(COLUMNS).eq("slug", slug).eq("is_public", true).maybeSingle();
  if (error) {
    console.warn("[business-card] load public card:", error.message);
    return null;
  }
  const row = data as CardRow | null;
  if (!row) return null;
  const card = toCard(admin, row);
  return toPublicCard(card, await loadCardWorks(admin, row.user_id, card.works));
}
