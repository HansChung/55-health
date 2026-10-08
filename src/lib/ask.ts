// ────────────────────────────────────────────────
// 打字問暖暖（文字對話）：前後端共用的型別、限額、暖暖的說話方式、書本範例帶入
// 書本練習原本用 Gemini／ChatGPT，全部改成問暖暖
// ────────────────────────────────────────────────

import { STORY_INTERVIEW_RULES } from "./life-stories";

export type AskRole = "user" | "assistant";

export interface AskMessage {
  role: AskRole;
  text: string;
}

/**
 * chat＝一般問答；guided＝主持模式（一次只問一題，書本 0801 決策、0805 一人董事會）；
 * summary＝把這段對話整理成摘要（存回書本那一章）；story＝我的故事集（暖暖像記者一題一題問）
 */
export type AskMode = "chat" | "guided" | "summary" | "story";

/** 一則訊息最多幾個字（書本最長的範例約 150 字；貼上衛教單重點也夠用） */
export const ASK_MESSAGE_MAX = 1500;
/** 一段對話最多帶幾則訊息給暖暖（主持模式約 12～16 則） */
export const ASK_HISTORY_MAX = 40;
/** 書本裡自己寫的指南，最多帶多少字 */
export const ASK_GUIDE_MAX = 1500;
export const ASK_CHAPTER_TITLE_MAX = 60;

/** 每天可以問幾題（每送出一則算一題；所有人都能用，免費會員也可以） */
export const ASK_DAILY_LIMITS: Record<string, number> = { free: 20, basic: 50, pro: 100 };

export function askDailyLimit(tier: string): number {
  if (tier === "admin") return 99999;
  return ASK_DAILY_LIMITS[tier] ?? ASK_DAILY_LIMITS.free;
}

/** 台灣今天 0 點（UTC ISO）：每天的題數從這裡算 */
export function taipeiDayStartIso(now: Date = new Date()): string {
  const taipei = new Date(now.getTime() + 8 * 3600 * 1000);
  const start = Date.UTC(taipei.getUTCFullYear(), taipei.getUTCMonth(), taipei.getUTCDate()) - 8 * 3600 * 1000;
  return new Date(start).toISOString();
}

/** 慢性病頁存的是英文 id */
const CONDITION_LABELS: Record<string, string> = {
  hypertension: "高血壓",
  diabetes: "糖尿病",
  prediabetes: "糖尿病前期",
  cholesterol: "高血脂",
  gout: "痛風",
  kidney: "腎臟病",
  osteoporosis: "骨質疏鬆",
};

export function conditionLabels(conditions: string[] | null | undefined): string[] {
  return (conditions ?? []).filter((c) => c && c !== "none").map((c) => CONDITION_LABELS[c] ?? c);
}

const TONE_LINES: Record<string, string> = {
  warm: "語氣溫暖親切，像家人一樣。",
  strict: "語氣專業、清楚、有條理。",
  grandchild: "可以用孫子撒嬌的口吻，但內容要正確實在。",
};

/** 暖暖自己能做的事（使用者問「你可以怎麼幫我」時照實回答，不要說成別的 App 的功能） */
const NUANNUAN_FEATURES =
  "打字或用說的問暖暖；拍照記錄三餐、算熱量；拍照問暖暖（花草、古蹟、招牌、看懂菜單與標示）；" +
  "提醒吃藥、喝水、量血壓；安心保鑣防詐練習；圓夢藍圖記下生活目標；研學團報名與集章；" +
  "出遊照片做成影片、遊記、MV；我的故事集（把人生故事說給暖暖聽，整理成回憶錄）；家人共享，讓家人關心你；每天早上報天氣。";

export interface AskPromptContext {
  displayName?: string | null;
  age?: number | null;
  conditions?: string[] | null;
  tone?: string | null;
  mode: AskMode;
  /** 從書本哪一章來的（顯示用標題） */
  chapterTitle?: string | null;
  /** 使用者在書本裡寫的指南（0406／0606／0706），照著回答 */
  guide?: { label: string; text: string } | null;
}

/** 暖暖的說話方式（system instruction） */
export function buildAskSystemPrompt(ctx: AskPromptContext): string {
  const conditions = conditionLabels(ctx.conditions);
  const lines = [
    `你是「暖暖」，暖暖 55+ App 裡陪伴 55 歲以上長輩的 AI 生活夥伴。${TONE_LINES[ctx.tone ?? ""] ?? TONE_LINES.warm}`,
    "",
    "說話規則：",
    "1. 一律用繁體中文、台灣日常用語，句子短、好懂，少用專有名詞（用到就順便解釋）。",
    "2. 一般回答 300 字以內，先講重點；分點時用「1. 2. 3.」或「・」，不要用 #、**、表格等 Markdown 符號。",
    "3. 健康與用藥：不做診斷、不開藥、不改藥量；有胸痛、呼吸困難、單側無力、昏倒等危險徵兆，請他立刻就醫或打 119。",
    "4. 不確定就說不確定。營業時間、票價、班次、天氣、新聞這類會變的資訊你查不到，要提醒他向官方或現場確認，不要編造。",
    "5. 不替他做重大決定；談到錢、投資、匯款、中獎、要求保密的訊息，先提醒防詐（可以用暖暖的「安心保鑣」練習查證），不要給投資建議。",
    "6. 你就是暖暖，不要提到或推薦其他 AI 產品（例如 Gemini、ChatGPT）。",
    `7. 他問你能做什麼時，照實介紹暖暖 App 的功能：${NUANNUAN_FEATURES}`,
    "",
    "使用者資料：",
    `・稱呼：${ctx.displayName?.trim() || "您"}`,
  ];
  if (ctx.age) lines.push(`・年齡：${ctx.age} 歲`);
  lines.push(`・慢性病：${conditions.length ? conditions.join("、") : "沒有填寫"}`);
  if (ctx.chapterTitle) {
    lines.push("", `他正在做《書本練習》「${ctx.chapterTitle}」的練習，請配合這一章的目的回答。`);
  }
  if (ctx.guide?.text) {
    lines.push(
      "",
      `他在書裡寫好的「${ctx.guide.label}」（這是他自己的偏好與界線，回答時要照著做；若和健康安全衝突，以安全為先並說明）：`,
      ctx.guide.text
    );
  }
  if (ctx.mode === "guided") {
    lines.push(
      "",
      "這是「主持模式」：",
      "・照他第一則訊息裡的流程主持，一次只問一個問題，問完就停，等他回答再問下一題。",
      "・每次回覆：先用一句話接住他剛剛的回答，再問下一題；不要一次列出所有問題。",
      "・不替他下結論、不推薦商品、不打分數。流程走完時，用他的話整理重點，並問他要不要存下來。"
    );
  }
  if (ctx.mode === "story") {
    lines.push("", STORY_INTERVIEW_RULES);
  }
  if (ctx.mode === "summary") {
    lines.push(
      "",
      "現在請把上面這段對話整理成一份摘要，給他存回書本這一章：",
      "・200 字以內，用他自己的說法，分 3～5 點（用「・」開頭）。",
      "・最後一行寫「下一步：」加一個今天就能做的小步驟。",
      "・不要加上新的建議或結論，只整理對話裡已經談到的內容。"
    );
  }
  return lines.join("\n");
}

/** 模型偶爾還是會用 Markdown：拿掉粗體、標題、程式碼框，保留換行 */
export function cleanAskReply(text: string): string {
  return text
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "・")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 帶給伺服器前整理對話：去空白、截長度、只留最後 N 則，第一則一定是使用者說的 */
export function trimAskHistory(messages: AskMessage[]): AskMessage[] {
  const cleaned = messages
    .map((m) => ({ role: m.role, text: [...(m.text ?? "").trim()].slice(0, ASK_MESSAGE_MAX).join("") }))
    .filter((m) => m.text && (m.role === "user" || m.role === "assistant"));
  const recent = cleaned.slice(-ASK_HISTORY_MAX);
  while (recent.length && recent[0].role !== "user") recent.shift();
  return recent;
}

// ── 書本範例 → 問暖暖 ──

/** 書本頁按「打字問暖暖」→ 帶著範例回到 App（sessionStorage，登入畫面也帶得過去） */
export const ASK_SEED_KEY = "nuannuan_ask_seed";
const ASK_SEED_TTL_MS = 30 * 60 * 1000;

export interface AskSeed {
  prompt: string;
  mode: "chat" | "guided";
  chapterId?: string | null;
  chapterTitle?: string | null;
  guide?: { label: string; text: string } | null;
  at: number;
}

export function saveAskSeed(seed: Omit<AskSeed, "at">): void {
  try {
    sessionStorage.setItem(ASK_SEED_KEY, JSON.stringify({ ...seed, at: Date.now() }));
  } catch { /* 無痕模式之類：就不帶範例 */ }
}

/** 讀一次就清掉（重新整理不會一直帶同一句） */
export function takeAskSeed(now = Date.now()): AskSeed | null {
  try {
    const raw = sessionStorage.getItem(ASK_SEED_KEY);
    sessionStorage.removeItem(ASK_SEED_KEY);
    if (!raw) return null;
    const seed = JSON.parse(raw) as AskSeed;
    if (!seed?.prompt || typeof seed.at !== "number" || now - seed.at > ASK_SEED_TTL_MS) return null;
    return seed;
  } catch {
    return null;
  }
}

/** 書本範例要帶哪一份自己寫的指南：0407 用 0406、0607 用 0606、0707 用 0706（存在這支手機的書本草稿裡） */
const GUIDE_SOURCES: Record<string, { source: string; label: string; fields: [string, string][] }> = {
  "0407": {
    source: "0406",
    label: "55+ 日常飲食指南",
    fields: [["bodyTrack", "身體軌（底線／禁忌／需再確認）"], ["soulTrack", "靈魂軌（味道／記憶／想保留的享受）"]],
  },
  "0607": {
    source: "0606",
    label: "動能指南",
    fields: [
      ["goal", "我的運動目標"], ["prefer", "我希望 AI 提醒我"], ["avoid", "我希望 AI 避免"], ["boundary", "我的安全邊界"],
    ],
  },
  "0707": {
    source: "0706",
    label: "55+ 活動參與指南",
    fields: [
      ["activityType", "喜歡的活動類型"], ["duration", "可接受的時間長度"], ["restStyle", "休息方式"],
      ["transitPref", "交通偏好"], ["companion", "同行偏好"],
    ],
  },
};

/** 這一章要用到哪一份指南（出自哪一章、叫什麼）；不需要就 null */
export function guideInfo(chapterId: string): { source: string; label: string } | null {
  const spec = GUIDE_SOURCES[chapterId];
  return spec ? { source: spec.source, label: spec.label } : null;
}

/** 把書本草稿裡的指南整理成要給暖暖看的文字；還沒寫就 null */
export function buildGuideContext(
  chapterId: string,
  readDraft: (sourceChapterId: string) => Record<string, unknown> | null
): { label: string; text: string } | null {
  const spec = GUIDE_SOURCES[chapterId];
  if (!spec) return null;
  const draft = readDraft(spec.source);
  if (!draft) return null;
  const lines = spec.fields
    .map(([key, label]) => {
      const v = typeof draft[key] === "string" ? (draft[key] as string).trim() : "";
      return v ? `${label}：${v}` : "";
    })
    .filter(Boolean);
  if (lines.length === 0) return null;
  return { label: spec.label, text: [...lines.join("\n")].slice(0, ASK_GUIDE_MAX).join("") };
}

// ── 存回書本那一章 ──

export function chapterAskSummaryKey(chapterId: string): string {
  return `nuannuan_chapter${chapterId}_ask_summary`;
}

export interface ChapterAskSummary {
  text: string;
  savedAt: string;
}

export function loadChapterAskSummary(chapterId: string): ChapterAskSummary | null {
  try {
    const raw = localStorage.getItem(chapterAskSummaryKey(chapterId));
    if (!raw) return null;
    const v = JSON.parse(raw) as ChapterAskSummary;
    return v?.text ? v : null;
  } catch {
    return null;
  }
}

export function saveChapterAskSummary(chapterId: string, text: string, now = new Date()): boolean {
  try {
    localStorage.setItem(chapterAskSummaryKey(chapterId), JSON.stringify({ text, savedAt: now.toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function clearChapterAskSummary(chapterId: string): void {
  try {
    localStorage.removeItem(chapterAskSummaryKey(chapterId));
  } catch { /* ignore */ }
}

/** 首頁、空白對話的建議問題 */
export const ASK_STARTERS = [
  "血壓有點高，飲食上要注意什麼？",
  "幫我寫一段給孫子的生日祝福",
  "下週要出遊，幫我列一張要帶的東西",
  "接到說我中獎的簡訊，該怎麼辦？",
] as const;
