// ────────────────────────────────────────────────
// 首頁 AI 建議的伺服器快取：同一天、今天吃的和個人資料都沒變 → 直接給上次的建議，不再叫 AI
// 上次的建議存在 ai_usage 那一筆的 metadata（cache_key、suggestion），不用另外開表
// 記了／刪了餐點、改了慢性病 → key 變了才重新產生；「換一個建議」帶 fresh=1 跳過快取
// ────────────────────────────────────────────────
import { createHash } from "node:crypto";

export interface SuggestionCacheInput {
  /** 台北的日期 YYYY-MM-DD */
  day: string;
  profile: {
    display_name?: string | null;
    age?: number | null;
    chronic_conditions?: string[] | null;
    calorie_goal?: number | null;
  } | null;
  meals: { meal_type?: string | null; items?: unknown; total_cal?: number | null }[] | null;
}

function itemNames(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((it) => (it && typeof it === "object" && typeof (it as { name?: unknown }).name === "string" ? (it as { name: string }).name : ""));
}

/** 時間（早上／晚上）不算進去：記一餐之後的建議一直到下一餐都還用得上 */
export function suggestionCacheKey(input: SuggestionCacheInput): string {
  const p = input.profile;
  const payload = JSON.stringify({
    d: input.day,
    p: [p?.display_name ?? "", p?.age ?? null, [...(p?.chronic_conditions ?? [])].sort(), p?.calorie_goal ?? null],
    m: (input.meals ?? [])
      .map((m) => [m.meal_type ?? "", itemNames(m.items), m.total_cal ?? 0])
      .map((m) => JSON.stringify(m))
      .sort(),
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

/** 上次那筆 ai_usage 的 metadata 和這次的 key 一樣，而且建議的格式對，才拿來用 */
export function cachedSuggestion(metadata: unknown, key: string): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as { cache_key?: unknown; suggestion?: unknown };
  if (m.cache_key !== key) return null;
  const s = m.suggestion;
  if (!s || typeof s !== "object" || typeof (s as { headline?: unknown }).headline !== "string") return null;
  return s as Record<string, unknown>;
}

/** 台北時間的日期和幾點（Vercel 跑在 UTC，new Date().getHours() 會差 8 小時） */
export function taipeiClock(now: Date = new Date()): { day: string; hour: number } {
  const t = new Date(now.getTime() + 8 * 3600 * 1000);
  return { day: t.toISOString().slice(0, 10), hour: t.getUTCHours() };
}
