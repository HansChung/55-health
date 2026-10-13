// ────────────────────────────────────────────────
// 年度回憶影片（kind='yearly'，前後端共用）：把一整年的遊記、出遊影片、故事集照片串成一支，過年給家人看
// 全部在自己的伺服器做（照片慢慢移動＋字幕＋曲庫配樂），不花平台算力
// 片頭《2026 我的一年》→ 每張照片一段（下面一行「3 月・阿里山」）→ 配樂淡出
// ────────────────────────────────────────────────

import type { MontageMusicId } from "./travel-video";

export const YEARLY_MIN_PHOTOS = 3;
/** 照片最多幾張：片頭 4 秒＋每張 5 秒，配樂 90 秒內放得下 */
export const YEARLY_MAX_PHOTOS = 16;
export const YEARLY_TITLE_SECONDS = 4;
export const YEARLY_PHOTO_SECONDS = 5;
export const YEARLY_TITLE_MAX = 16;
export const YEARLY_CAPTION_MAX = 14;

/** 候選照片（伺服器整理好給畫面挑；key 送回伺服器再查一次真正的路徑，不信任前端給的路徑） */
export interface YearlyCandidate {
  key: string;
  url: string;
  width: number | null;
  height: number | null;
  caption: string;
  /** 照片的日期（遊記／故事建立的時間） */
  date: string;
  source: "trip" | "story";
}

export interface YearlySegment {
  /** 用第幾張照片 */
  photo: number;
  seconds: number;
  /** 字幕（片頭是標題） */
  line: string;
  clip_path: string | null;
}

/** travel_videos.yearly 欄位 */
export interface YearlyState {
  year: number;
  title: string;
  music: MontageMusicId;
  size: { width: number; height: number };
  photos: { path: string; width: number; height: number; caption: string }[];
  segments: YearlySegment[];
  attempts: number;
}

export type YearlyStage = "clips" | "final";

export function yearlyStage(state: YearlyState): YearlyStage {
  return state.segments.some((s) => !s.clip_path) ? "clips" : "final";
}

export function yearlyProgress(state: YearlyState): { stage: YearlyStage; done: number; total: number } {
  return {
    stage: yearlyStage(state),
    done: state.segments.filter((s) => s.clip_path).length,
    total: state.segments.length,
  };
}

export function yearlyProgressLabel(p: { stage: YearlyStage; done: number; total: number }): string {
  if (p.stage === "clips") return `正在剪第 ${Math.min(p.done + 1, p.total)}／${p.total} 段`;
  return "快好了，正在配上音樂…";
}

/** 片頭＋每張照片一段 */
export function yearlySegments(title: string, captions: string[]): YearlySegment[] {
  return [
    { photo: 0, seconds: YEARLY_TITLE_SECONDS, line: title, clip_path: null },
    ...captions.map((caption, i) => ({ photo: i, seconds: YEARLY_PHOTO_SECONDS, line: caption, clip_path: null })),
  ];
}

export function defaultYearlyTitle(year: number): string {
  return `${year} 我的一年`;
}

/** 字幕片頭用書名號包起來（字型沒有表情符號，🎬 會變方框） */
export function yearlyTitleLine(title: string): string {
  return `《${title}》`;
}

/** 字幕字型沒有表情符號（會變方框）：拿掉表情符號、引號、控制字元 */
function clean(text: string | null | undefined, max: number): string {
  const t = (text ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\p{Extended_Pictographic}|[\u200d\ufe0e\ufe0f\u20e3]|[\u{1f1e6}-\u{1f1ff}]/gu, "")
    .replace(/["'“”‘’「」『』]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return [...t].slice(0, max).join("");
}

export function sanitizeYearlyTitle(text: string | null | undefined): string {
  return clean(text, YEARLY_TITLE_MAX);
}

export function sanitizeYearlyCaption(text: string | null | undefined): string {
  return clean(text, YEARLY_CAPTION_MAX);
}

/** 台北時間的年份、月份 */
export function taipeiYearMonth(iso: string): { year: number; month: number } {
  const d = new Date(new Date(iso).getTime() + 8 * 3600_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** 台北時間某一年的開始／結束（ISO） */
export function taipeiYearRange(year: number): { start: string; end: string } {
  return {
    start: new Date(Date.UTC(year, 0, 1) - 8 * 3600_000).toISOString(),
    end: new Date(Date.UTC(year + 1, 0, 1) - 8 * 3600_000).toISOString(),
  };
}

/** 預設字幕：「3 月・阿里山」；沒有地點就只有月份 */
export function yearlyCaption(iso: string, place: string | null | undefined): string {
  const { month } = taipeiYearMonth(iso);
  const where = sanitizeYearlyCaption(place);
  return sanitizeYearlyCaption(where ? `${month} 月・${where}` : `${month} 月`);
}

/**
 * 預設幫忙勾哪些：不超過上限就全選；太多就整年平均挑（照日期排好，等距取），
 * 免得全部都是同一趟出遊
 */
export function defaultYearlyPicks(candidates: Pick<YearlyCandidate, "key" | "date">[], max = YEARLY_MAX_PHOTOS): string[] {
  const sorted = [...candidates].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length <= max) return sorted.map((c) => c.key);
  const step = sorted.length / max;
  return Array.from({ length: max }, (_, i) => sorted[Math.floor(i * step + step / 2)].key);
}
