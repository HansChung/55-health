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
const urlOrEmpty = z.union([z.literal(""), z.string().url().max(500)]);

const entrySchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  hint: z.string().max(120).optional().default(""),
  emoji: z.string().max(8).optional().default(""),
  href: z.string().max(200).optional(),
  open: z.enum(["voice", "camera", "photo"]).optional(),
});

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
    heroImageUrl: urlOrEmpty.optional(),
    videoUrl: urlOrEmpty.optional(),
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
  return out as ChapterOverrides;
}
