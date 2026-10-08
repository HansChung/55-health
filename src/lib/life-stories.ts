// ────────────────────────────────────────────────
// 我的故事集：前後端共用的型別、上限、整理文字、暖暖寫文章的提示詞、推播文字
// 長輩說故事 → 暖暖一題一題問（/api/ai/chat mode "story"）→ 整理成文章（/api/stories/write）→ 長輩改好存下來
// ────────────────────────────────────────────────

import type { AskMessage } from "./ask";
import type { VideoCommentsView } from "./video-comments";

export const STORY_TITLE_MAX = 40;
export const STORY_ERA_MAX = 30;
export const STORY_BODY_MAX = 3000;
export const STORY_PHOTOS_MAX = 3;
/** 回答幾題之後才能整理成文章 */
export const STORY_MIN_ANSWERS = 3;
/** 整理成文章、存檔時帶的訪談最多幾則（第一則題目＋最後的部分）；API 收 2 倍以內再整理 */
export const STORY_INTERVIEW_MAX = 120;
/** 一則話最長幾個字（和問暖暖的 ASK_MESSAGE_MAX 一樣） */
const STORY_MESSAGE_MAX = 1500;

/** 不知道講什麼時的題目 */
export const STORY_TOPICS = [
  "小時候住的家",
  "我的第一份工作",
  "怎麼認識另一半",
  "孩子出生的那一天",
  "一次難忘的旅行",
  "拿手菜是跟誰學的",
  "最感謝的一個人",
  "年輕時的一個夢想",
] as const;

export interface StoryPhoto {
  url: string;
  width: number;
  height: number;
}

export interface LifeStory {
  id: string;
  title: string;
  era: string | null;
  body: string;
  photos: StoryPhoto[];
  share_with_family: boolean;
  created_at: string;
  updated_at: string;
  /** 家人的按讚、留言 */
  comments?: VideoCommentsView;
}

export interface StoryDraft {
  title: string;
  era: string;
  body: string;
}

function clip(text: string, max: number): string {
  return [...text].slice(0, max).join("");
}

export function sanitizeStoryTitle(v: unknown): string {
  return typeof v === "string" ? clip(v.replace(/\s+/g, " ").replace(/^[《「『"]+|[》」』"]+$/g, "").trim(), STORY_TITLE_MAX) : "";
}

export function sanitizeStoryEra(v: unknown): string {
  return typeof v === "string" ? clip(v.replace(/\s+/g, " ").trim(), STORY_ERA_MAX) : "";
}

/** 文章：保留段落，去掉多餘空白行與 Markdown 符號 */
export function sanitizeStoryBody(v: unknown): string {
  if (typeof v !== "string") return "";
  const text = v
    .replace(/\r\n?/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return clip(text, STORY_BODY_MAX);
}

/** 念給我聽：一段一段念 */
export function storySpeech(story: Pick<LifeStory, "title" | "era" | "body">): string[] {
  return [story.title, story.era ?? "", ...story.body.split(/\n+/)].map((s) => s.trim()).filter(Boolean);
}

/**
 * 整理訪談：去空白、截長度；太長時留第一則（講什麼故事）和最後的部分。
 * 問暖暖平常只帶最後 40 則，但寫文章要看整段故事，所以這裡留比較多
 */
export function trimStoryInterview(messages: AskMessage[]): AskMessage[] {
  const cleaned = messages
    .map((m) => ({ role: m.role, text: [...(m.text ?? "").trim()].slice(0, STORY_MESSAGE_MAX).join("") }))
    .filter((m) => m.text && (m.role === "user" || m.role === "assistant"));
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  if (cleaned.length <= STORY_INTERVIEW_MAX) return cleaned;
  return [cleaned[0], ...cleaned.slice(-(STORY_INTERVIEW_MAX - 1))];
}

/** 長輩回答了幾題（暖暖問、長輩答；第一則是題目，不算） */
export function storyAnswerCount(messages: AskMessage[]): number {
  return Math.max(0, messages.filter((m) => m.role === "user").length - 1);
}

/** 訪談：暖暖當溫柔的記者（system instruction 的一段，接在暖暖的說話規則後面） */
export const STORY_INTERVIEW_RULES = [
  "這是「說故事模式」：他想把一段人生故事記下來，你像溫柔的記者陪他回想。",
  "・一次只問一個問題，問完就停，等他回答；先用一句話接住他說的（不要評論對錯、不要說教）。",
  "・依序了解：大概是哪一年／他幾歲、在哪裡、身邊有誰、發生了什麼、當時的心情、現在回想起來的意義。",
  "・問具體的小細節（聲音、味道、一句話、一個畫面），幫他把記憶找回來；他說不記得就換下一題。",
  "・問了 5～8 題、故事差不多完整時，告訴他可以按「整理成文章」，也可以繼續講。",
  "・不要自己編故事內容，也不要替他下結論。",
].join("\n");

/** 整理成文章：要模型回 JSON { title, era, body } */
export function buildStoryWritePrompt(messages: AskMessage[], opts: { displayName?: string | null } = {}): string {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "長輩" : "暖暖"}：${m.text}`)
    .join("\n");
  return `你是「暖暖」，正在幫${opts.displayName?.trim() || "一位長輩"}把剛剛說的人生故事整理成一篇短文，要放進他的回憶錄。

下面是你們的對話：
${transcript}

寫作規則：
- 用第一人稱「我」，繁體中文、台灣日常用語，像他本人在說話；盡量保留他自己的說法、用詞和小細節。
- 只寫對話裡他說過的事，不要加上沒提到的人物、地點、事件或感受；不確定的就不要寫。
- 300～800 字，分 3～6 段，段落之間空一行；不要用標題、條列或 Markdown 符號。
- title：8～16 字的標題，像書的章名，不要加書名號。
- era：他提到的年代或年紀（例如「民國 62 年」「我 20 歲那年」），沒提到就空字串。

只回 JSON：{"title":"…","era":"…","body":"…"}`;
}

/** 模型回的 JSON 整理成可以直接用的草稿；沒有內容就丟錯 */
export function normalizeStoryDraft(raw: unknown): StoryDraft {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const body = sanitizeStoryBody(r.body);
  if (!body) throw new Error("empty story draft");
  return { title: sanitizeStoryTitle(r.title) || "我的故事", era: sanitizeStoryEra(r.era), body };
}

// ── 推播 ──

export function newStoryPushForFamily(opts: { elderName: string; title: string }): { title: string; body: string } {
  return { title: `📖 ${opts.elderName}寫了一篇新故事`, body: `《${opts.title}》，點這裡看看，給${opts.elderName}按個讚吧` };
}

export function storyCommentPushForOwner(opts: {
  authorName: string;
  relationship: string | null;
  storyTitle: string;
  emoji?: string | null;
  body?: string | null;
}): { title: string; body: string } {
  const who = opts.relationship ? `${opts.authorName}（${opts.relationship}）` : opts.authorName;
  if (opts.emoji) return { title: `${opts.emoji} ${who}`, body: `${who}對你的故事《${opts.storyTitle}》按了 ${opts.emoji}` };
  return { title: `💬 ${who}看了你的故事`, body: opts.body ?? "" };
}

export function storyCommentPushForFamily(opts: { elderName: string; body: string }): { title: string; body: string } {
  return { title: `💬 ${opts.elderName}回覆了`, body: opts.body };
}
