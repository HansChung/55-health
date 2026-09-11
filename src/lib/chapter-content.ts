// ────────────────────────────────────────────────
// 章節內容覆蓋層（後台可編輯的部分）
//
// 設計：章節內容仍寫在程式碼裡當「預設值」；管理員在後台改的東西存進
// chapter_content 表，載入時「蓋」在預設值上。DB 沒資料或欄位留空 → 用預設。
// 改錯不會壞、不用重新部署、144 個章節共用一套介面。
//
// 這裡只放「純函式」與 schema（前後端共用、可單元測試）；
// 讀 DB 的部分在 chapter-content-server.ts。
// ────────────────────────────────────────────────
import { z } from "zod";
import type { ChapterOpening } from "./chapter-opening";
import { isHttpUrl } from "./url-safety";

export { isHttpUrl };

/** 後台可覆蓋的純文字欄位白名單（互動練習不在此列，留在程式碼） */
export const EDITABLE_TEXT_FIELDS = [
  "title",
  "subtitle",
  "headerEmoji",
  "quote",
  "atAGlance",
  "tryPrompt",
  "samplePrompt",
  "reflectPrompt",
  "reflectPlaceholder",
  "continueTitle",
  "continueBody",
  "capabilityNote",
  "printCardTitle",
  "printCardDescription",
  "printButtonLabel",
  "guideTitle",
  "guideDuration",
  "guideFooterNote",
  "footerGuideLabel",
] as const;
export type EditableTextField = (typeof EDITABLE_TEXT_FIELDS)[number];

/** 後台表單顯示用的中文標籤 */
export const FIELD_LABELS: Record<EditableTextField, string> = {
  title: "標題",
  subtitle: "副標",
  headerEmoji: "標題表情符號",
  quote: "先帶走這一句（金句）",
  atAGlance: "一眼看懂",
  tryPrompt: "試一試",
  samplePrompt: "可複製的試用語句",
  reflectPrompt: "回望提示",
  reflectPlaceholder: "回望輸入框提示",
  continueTitle: "「暖暖陪您繼續」標題",
  continueBody: "「暖暖陪您繼續」內文",
  capabilityNote: "能力說明短句",
  printCardTitle: "列印卡標題",
  printCardDescription: "列印卡說明",
  printButtonLabel: "列印按鈕文字",
  guideTitle: "章首導讀標題",
  guideDuration: "導讀時長（如：約 2 分鐘）",
  guideFooterNote: "導讀結尾註記",
  footerGuideLabel: "底部導讀按鈕文字",
};

/** 這些欄位用多行輸入框 */
export const MULTILINE_FIELDS: ReadonlySet<EditableTextField> = new Set([
  "quote", "atAGlance", "tryPrompt", "samplePrompt", "reflectPrompt",
  "continueBody", "capabilityNote", "printCardDescription", "guideFooterNote",
]);

const text = z.string().max(2000);

const httpUrl = z.string().max(500).refine(isHttpUrl, "請輸入 http(s):// 開頭的網址");
const httpUrlOrEmpty = z.union([z.literal(""), httpUrl]);

/** 站內路徑（/ 開頭、不可是 //other-host）或 http(s) 網址 */
export function isSafeHref(value: string): boolean {
  const v = value.trim();
  if (v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\")) return true;
  return isHttpUrl(v);
}
const safeHref = z.string().max(300).refine(isSafeHref, "連結需為 / 開頭的站內路徑或 http(s) 網址");

const entrySchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  hint: z.string().max(120).optional().default(""),
  emoji: z.string().max(8).optional().default(""),
  href: safeHref.optional(),
  open: z.enum(["voice", "camera", "photo"]).optional(),
});

// ── 自訂內容區塊（後台「新增內容」）──────────────────
const blockId = z.string().min(1).max(40);
const caption = z.string().max(300).optional();

export const chapterBlockSchema = z.discriminatedUnion("type", [
  z.object({ id: blockId, type: z.literal("text"), title: z.string().max(120).optional(), body: z.string().max(4000) }),
  z.object({ id: blockId, type: z.literal("image"), url: httpUrl, caption }),
  z.object({
    id: blockId, type: z.literal("video"),
    url: z.string().max(500).refine((v) => youtubeEmbedUrl(v) !== null, "目前只支援 YouTube 影片網址"),
    caption,
  }),
  z.object({
    id: blockId, type: z.literal("example"),
    title: z.string().max(120).optional(),
    prompt: z.string().min(1).max(2000),
    note: z.string().max(500).optional(),
  }),
  z.object({ id: blockId, type: z.literal("link"), label: z.string().min(1).max(80), url: safeHref }),
]);
export type ChapterBlock = z.infer<typeof chapterBlockSchema>;
export type ChapterBlockType = ChapterBlock["type"];

/** 後台「新增內容」按鈕用 */
export const BLOCK_TYPE_LABELS: Record<ChapterBlockType, { label: string; icon: string }> = {
  text: { label: "文字段落", icon: "📝" },
  image: { label: "圖片", icon: "🖼️" },
  video: { label: "YouTube 影片", icon: "🎬" },
  example: { label: "練習範例", icon: "💬" },
  link: { label: "連結按鈕", icon: "🔗" },
};

/** 區塊是否有實質內容（空白區塊儲存時會被丟掉） */
export function isBlockFilled(b: ChapterBlock): boolean {
  switch (b.type) {
    case "text": return !!b.body.trim();
    case "image": case "video": return !!b.url.trim();
    case "example": return !!b.prompt.trim();
    case "link": return !!b.label.trim() && !!b.url.trim();
  }
}

/** 後台送來的覆蓋內容；所有欄位選填，留空＝用預設 */
export const chapterOverridesSchema = z
  .object({
    title: text.optional(),
    subtitle: text.optional(),
    headerEmoji: z.string().max(8).optional(),
    quote: text.optional(),
    atAGlance: text.optional(),
    tryPrompt: text.optional(),
    samplePrompt: text.optional(),
    reflectPrompt: text.optional(),
    reflectPlaceholder: text.optional(),
    continueTitle: text.optional(),
    continueBody: text.optional(),
    capabilityNote: text.optional(),
    printCardTitle: text.optional(),
    printCardDescription: text.optional(),
    printButtonLabel: text.optional(),
    guideTitle: text.optional(),
    guideDuration: text.optional(),
    guideFooterNote: text.optional(),
    footerGuideLabel: text.optional(),
    guideParagraphs: z.array(z.string().max(1000)).max(20).optional(),
    entries: z.array(entrySchema).max(12).optional(),
    heroImageUrl: httpUrlOrEmpty.optional(),
    videoUrl: z
      .union([z.literal(""), z.string().max(500).refine((v) => youtubeEmbedUrl(v) !== null, "目前只支援 YouTube 影片網址")])
      .optional(),
    blocks: z.array(chapterBlockSchema).max(30).optional(),
  })
  .strict();

export type ChapterOverrides = z.infer<typeof chapterOverridesSchema>;

/**
 * 儲存前清理：去掉空字串、空陣列、只含空白的段落。
 * 這樣「留空」在 DB 裡就是「沒有覆蓋」，畫面自然回到預設值。
 */
export function normalizeOverrides(input: ChapterOverrides): ChapterOverrides {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;
    if (typeof value === "string") {
      const t = value.trim();
      if (t) out[key] = t;
      continue;
    }
    if (Array.isArray(value)) {
      if (key === "guideParagraphs") {
        const paras = (value as string[]).map((p) => p.trim()).filter(Boolean);
        if (paras.length) out[key] = paras;
      } else if (key === "blocks") {
        const filled = (value as ChapterBlock[]).filter(isBlockFilled);
        if (filled.length) out[key] = filled;
      } else if (value.length) {
        out[key] = value;
      }
    }
  }
  return out as ChapterOverrides;
}

/**
 * 把覆蓋內容蓋到程式碼預設值上。
 * 只有「有值」的覆蓋才生效；不會用空值把預設清掉。
 */
export function applyChapterOverrides(
  base: ChapterOpening,
  overrides: ChapterOverrides | null | undefined
): ChapterOpening {
  if (!overrides) return base;
  const clean = normalizeOverrides(overrides);
  const merged: ChapterOpening = { ...base };

  for (const field of EDITABLE_TEXT_FIELDS) {
    const v = clean[field];
    if (typeof v === "string" && v) (merged as unknown as Record<string, unknown>)[field] = v;
  }
  if (clean.guideParagraphs?.length) merged.guideParagraphs = clean.guideParagraphs;
  if (clean.entries?.length) merged.entries = clean.entries;
  if (clean.heroImageUrl) merged.heroImageUrl = clean.heroImageUrl;
  if (clean.videoUrl) merged.videoUrl = clean.videoUrl;
  if (clean.blocks?.length) merged.blocks = clean.blocks;

  return merged;
}

/**
 * 把各種 YouTube 網址轉成可內嵌的 embed 網址；不是 YouTube 就回 null。
 * 只接受 YouTube 網域，避免後台貼任意網址造成 iframe 注入。
 */
export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = u.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      if (m) id = m[1];
    }
  }
  if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

/** 從章節預設值抽出「可編輯欄位」給後台當 placeholder 顯示 */
export function extractEditableDefaults(ch: ChapterOpening): ChapterOverrides {
  const out: Record<string, unknown> = {};
  for (const f of EDITABLE_TEXT_FIELDS) {
    const v = (ch as unknown as Record<string, unknown>)[f];
    if (typeof v === "string") out[f] = v;
  }
  out.guideParagraphs = ch.guideParagraphs ?? [];
  out.entries = ch.entries ?? [];
  out.heroImageUrl = ch.heroImageUrl ?? "";
  out.videoUrl = ch.videoUrl ?? "";
  out.blocks = ch.blocks ?? [];
  return out as ChapterOverrides;
}

// ── 後台新增的章節（資料全部在 DB）──────────────────

/** 自訂章節 QR 碼：四碼，前兩碼 01–12 對應書本第幾章（例如 0215 → 第二章） */
export const CUSTOM_CHAPTER_ID_RE = /^(0[1-9]|1[0-2])\d{2}$/;

/**
 * 新章節的起始範本：通用「路線卡」版型 + 四個暖暖入口。
 * 後台存的內容會蓋在這份範本上，所以沒填的欄位也有合理的文字。
 */
export function customChapterBase(id: string): ChapterOpening {
  return {
    id,
    qrCode: id,
    title: "新章節",
    subtitle: "書本練習",
    layout: "routes",
    headerEmoji: "📘",
    tryPrompt: "從下方入口選一個最想先試的，花三分鐘試一次就好。",
    reflectPrompt: "今天試完，有哪一句話想留下來？",
    reflectPlaceholder: "例如：原來可以這樣問…",
    continueTitle: "暖暖陪您繼續",
    continueBody: "掃碼進入暖暖，可以用語音、拍照或記下一句話，繼續練習。",
    practiceWhere: "nuannuan",
    printCardTitle: "練習卡",
    printButtonLabel: "列印練習卡",
    guideTitle: "章首導讀",
    guideParagraphs: [],
    entries: [
      { id: "ask", label: "問一句", hint: "跟暖暖語音聊一下，不用打字", emoji: "🎙", open: "voice" },
      { id: "snap", label: "拍一下", hint: "打開相機，拍下生活瞬間", emoji: "📸", open: "camera" },
      { id: "photo", label: "找照片", hint: "從相簿選一張已有的照片", emoji: "🖼", open: "photo" },
      { id: "note", label: "記下一句話", hint: "寫下一件小事，點亮 SMART 光點", emoji: "✨", href: `/smart/spark?source=chapter${id}` },
    ],
  };
}
