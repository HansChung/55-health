// ────────────────────────────────────────────────
// 拍照問暖暖：出門看到不認識的花草、建築、古物、招牌，拍給暖暖看，暖暖用長輩聽得懂的話解說
// （前後端共用的型別與純函式；辨識算進原本的拍照次數）
// ────────────────────────────────────────────────

/** 問題最多幾個字（書本範例最長約 80 字：菜單翻譯＋飲食需要、商品比較） */
export const PHOTO_ASK_QUESTION_MAX = 200;
export const PHOTO_ASK_PLACE_MAX = 40;
/** 免費會員每天可以拍照問幾次（標準版以上照每月拍照次數） */
export const PHOTO_ASK_FREE_DAILY = 5;

/** 一鍵提問（長輩不用打字） */
export const PHOTO_ASK_PRESETS = ["這是什麼？", "有什麼故事？", "要注意什麼？"] as const;
export const DEFAULT_PHOTO_QUESTION = PHOTO_ASK_PRESETS[0];

export type PhotoAskCategory =
  | "plant"
  | "animal"
  | "building"
  | "artifact"
  | "food"
  | "scenery"
  | "text"
  | "other";

export const PHOTO_ASK_CATEGORY_META: Record<PhotoAskCategory, { emoji: string; label: string }> = {
  plant: { emoji: "🌿", label: "植物" },
  animal: { emoji: "🐦", label: "動物" },
  building: { emoji: "🏯", label: "建築" },
  artifact: { emoji: "🏺", label: "文物" },
  food: { emoji: "🍡", label: "食物" },
  scenery: { emoji: "🏞️", label: "風景" },
  text: { emoji: "📜", label: "文字招牌" },
  other: { emoji: "🔍", label: "其他" },
};

export interface PhotoAskResult {
  /** 這是什麼（短，例如「鹿港龍山寺的八卦藻井」） */
  title: string;
  category: PhotoAskCategory;
  /** 2～4 句口語解說 */
  explanation: string;
  /** 一句有趣的小知識（可空） */
  fun_fact: string;
  /** 安全提醒（有毒、不能吃、階梯濕滑…；沒有就空字串） */
  caution: string;
  confidence: "high" | "medium" | "low";
  /** 可以接著問的問題（最多 3 個） */
  follow_ups: string[];
  /** 照片裡的文字：菜單翻成中文、成分表、衛教單重點…（一行一項；不是文字照片就空陣列） */
  text_lines: string[];
}

/** 長輩輸入的問題／地點：去掉換行與多餘空白、截長 */
export function sanitizeAskText(text: unknown, max: number): string {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanString(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

const CATEGORIES = Object.keys(PHOTO_ASK_CATEGORY_META) as PhotoAskCategory[];

/** 模型回的 JSON 可能少欄位、型別不對或太長 → 整理成畫面能直接用的格式 */
export function normalizePhotoAskResult(raw: unknown): PhotoAskResult {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const category = CATEGORIES.includes(r.category as PhotoAskCategory) ? (r.category as PhotoAskCategory) : "other";
  const confidence = r.confidence === "high" || r.confidence === "low" ? r.confidence : "medium";
  const followUps = Array.isArray(r.follow_ups)
    ? r.follow_ups.map((q) => cleanString(q, 40)).filter(Boolean)
    : [];
  const textLines = Array.isArray(r.text_lines)
    ? r.text_lines.map((l) => cleanString(l, 80)).filter(Boolean).slice(0, 10)
    : [];
  const title = cleanString(r.title, 40);
  const explanation = cleanString(r.explanation, 400);
  if (!title && !explanation) throw new Error("empty photo-ask result");
  return {
    title: title || "暖暖看到的東西",
    category,
    explanation,
    fun_fact: cleanString(r.fun_fact, 150),
    caution: cleanString(r.caution, 150),
    confidence,
    follow_ups: [...new Set(followUps)].slice(0, 3),
    text_lines: textLines,
  };
}

/** 「念給我聽」要念的段落 */
export function photoAskSpeech(result: PhotoAskResult): string[] {
  return [
    result.title,
    result.explanation,
    ...result.text_lines,
    result.fun_fact ? `小知識：${result.fun_fact}` : "",
    result.caution ? `提醒你：${result.caution}` : "",
  ].filter(Boolean);
}

// ── 書本練習 → 拍照問暖暖（問題先帶好；sessionStorage，登入畫面也帶得過去） ──

export const PHOTO_ASK_SEED_KEY = "nuannuan_photo_ask_seed";
const PHOTO_ASK_SEED_TTL_MS = 30 * 60 * 1000;

export interface PhotoAskSeed {
  question: string;
  chapterId: string;
  chapterTitle: string;
  at: number;
}

export function savePhotoAskSeed(seed: Omit<PhotoAskSeed, "at">): void {
  try {
    sessionStorage.setItem(PHOTO_ASK_SEED_KEY, JSON.stringify({ ...seed, at: Date.now() }));
  } catch { /* 無痕模式之類：就不帶問題 */ }
}

/** 讀一次就清掉 */
export function takePhotoAskSeed(now = Date.now()): PhotoAskSeed | null {
  try {
    const raw = sessionStorage.getItem(PHOTO_ASK_SEED_KEY);
    sessionStorage.removeItem(PHOTO_ASK_SEED_KEY);
    if (!raw) return null;
    const seed = JSON.parse(raw) as PhotoAskSeed;
    if (!seed?.question || typeof seed.at !== "number" || now - seed.at > PHOTO_ASK_SEED_TTL_MS) return null;
    return { ...seed, question: sanitizeAskText(seed.question, PHOTO_ASK_QUESTION_MAX) };
  } catch {
    return null;
  }
}
