// ────────────────────────────────────────────────
// 節日、生日祝福影片（kind='greeting'，前後端共用）
// 長輩選場合、寫要給誰，放 1～10 張照片（每張一句祝福）→ 片頭《祝小美 生日快樂》→ 每張照片一段 → 片尾「愛你的 阿嬤」
// 和年度回憶影片同一套剪輯（照片慢慢移動＋字幕＋曲庫配樂），只用 ffmpeg，不花算力
// ────────────────────────────────────────────────

import { sanitizeYearlyCaption, sanitizeYearlyTitle, type YearlySegment } from "./travel-yearly";
import type { MontageMusicId } from "./travel-video";

export const GREETING_MIN_PHOTOS = 1;
export const GREETING_MAX_PHOTOS = 10;
export const GREETING_TITLE_SECONDS = 4;
export const GREETING_PHOTO_SECONDS = 5;
export const GREETING_CLOSING_SECONDS = 4;
export const GREETING_NAME_MAX = 8;

export type GreetingOccasion = "birthday" | "new_year" | "mother" | "father" | "mid_autumn" | "cheer" | "thanks" | "other";

export interface GreetingOccasionMeta {
  id: GreetingOccasion;
  label: string;
  emoji: string;
  /** 片頭：祝 {to} 生日快樂（沒填對象就用 plain） */
  title: (to: string) => string;
  plain: string;
  /** 每張照片預設的一句（輪流用） */
  lines: string[];
  music: MontageMusicId;
}

export const GREETING_OCCASIONS: GreetingOccasionMeta[] = [
  { id: "birthday", label: "生日", emoji: "🎂", title: (to) => `祝${to} 生日快樂`, plain: "生日快樂", lines: ["生日快樂", "身體健康 天天開心", "又長大一歲了", "願望都會實現"], music: "light" },
  { id: "new_year", label: "新年", emoji: "🧧", title: (to) => `${to} 新年快樂`, plain: "新年快樂", lines: ["新年快樂", "平安健康", "萬事如意", "闔家團圓"], music: "folk" },
  { id: "mother", label: "母親節", emoji: "💐", title: (to) => `${to} 母親節快樂`, plain: "母親節快樂", lines: ["母親節快樂", "辛苦了", "謝謝你的照顧", "永遠愛你"], music: "warm" },
  { id: "father", label: "父親節", emoji: "👔", title: (to) => `${to} 父親節快樂`, plain: "父親節快樂", lines: ["父親節快樂", "辛苦了", "身體要顧好", "謝謝你"], music: "warm" },
  { id: "mid_autumn", label: "中秋節", emoji: "🥮", title: (to) => `${to} 中秋節快樂`, plain: "中秋節快樂", lines: ["中秋節快樂", "月圓人團圓", "有空回來吃月餅", "平安健康"], music: "nostalgic" },
  { id: "cheer", label: "加油打氣", emoji: "💪", title: (to) => `${to} 加油`, plain: "加油", lines: ["加油", "我們都支持你", "一步一步來", "累了就休息一下"], music: "light" },
  { id: "thanks", label: "謝謝你", emoji: "🙏", title: (to) => `謝謝${to}`, plain: "謝謝你", lines: ["謝謝你", "有你真好", "辛苦了", "心裡都記得"], music: "piano" },
  { id: "other", label: "其他", emoji: "🎁", title: (to) => `給${to}`, plain: "祝福你", lines: ["祝福你", "平安健康", "天天開心", "想念你"], music: "warm" },
];

export function greetingOccasion(id: unknown): GreetingOccasionMeta {
  return GREETING_OCCASIONS.find((o) => o.id === id) ?? GREETING_OCCASIONS[GREETING_OCCASIONS.length - 1];
}

/** 名字：拿掉表情符號、引號（字幕字型沒有），截短 */
export function sanitizeGreetingName(text: string | null | undefined): string {
  return [...sanitizeYearlyCaption(text)].slice(0, GREETING_NAME_MAX).join("");
}

/** 片頭：《祝小美 生日快樂》；沒寫給誰就《生日快樂》 */
export function greetingTitle(occasion: GreetingOccasion, to: string | null | undefined): string {
  const meta = greetingOccasion(occasion);
  const name = sanitizeGreetingName(to);
  return sanitizeYearlyTitle(name ? meta.title(name) : meta.plain);
}

/** 片尾：「愛你的 阿嬤」；沒寫是誰就不要片尾 */
export function greetingClosing(from: string | null | undefined): string {
  const name = sanitizeGreetingName(from);
  return name ? sanitizeYearlyCaption(`愛你的 ${name}`) : "";
}

/** 第 i 張照片預設的一句 */
export function defaultGreetingLine(occasion: GreetingOccasion, index: number): string {
  const lines = greetingOccasion(occasion).lines;
  return lines[index % lines.length];
}

/** 片頭＋每張照片一段＋片尾（片尾用最後一張照片） */
export function greetingSegments(title: string, captions: string[], closing: string): YearlySegment[] {
  const segments: YearlySegment[] = [
    { photo: 0, seconds: GREETING_TITLE_SECONDS, line: title, clip_path: null },
    ...captions.map((caption, i) => ({ photo: i, seconds: GREETING_PHOTO_SECONDS, line: caption, clip_path: null })),
  ];
  if (closing) segments.push({ photo: Math.max(0, captions.length - 1), seconds: GREETING_CLOSING_SECONDS, line: closing, clip_path: null });
  return segments;
}

/** 總長度（秒） */
export function greetingSeconds(photos: number, withClosing: boolean): number {
  return GREETING_TITLE_SECONDS + photos * GREETING_PHOTO_SECONDS + (withClosing ? GREETING_CLOSING_SECONDS : 0);
}
