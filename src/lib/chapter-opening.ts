/** 章節開篇 QR 深連結（例：0100 → /smart/chapter/0100） */
export type ChapterEntryId = "ask" | "snap" | "photo" | "note";

export type SparkSource = "spark_card" | "chapter3" | "chapter0100";

export interface ChapterEntry {
  id: ChapterEntryId;
  label: string;
  hint: string;
  emoji: string;
  /** App 首頁深連結 action（note 走 spark 頁） */
  open?: "voice" | "camera" | "photo";
  href?: string;
}

export interface ChapterOpening {
  id: string;
  qrCode: string;
  title: string;
  subtitle: string;
  quote: string;
  atAGlance: string;
  tryPrompt: string;
  reflectPrompt: string;
  continueTitle: string;
  continueBody: string;
  printCardTitle: string;
  guideTitle: string;
  guideParagraphs: string[];
  entries: ChapterEntry[];
}

export const CHAPTER_0100: ChapterOpening = {
  id: "0100",
  qrCode: "0100",
  title: "風起了，調整風帆",
  subtitle: "章節開篇",
  quote: "AI 時代不必從焦慮開始，可以從自己的節奏開始。",
  atAGlance:
    "這一章不問您會不會用 AI，只問：今天想從哪一個小入口開始——問一句、拍一下、找照片，或記下一句話。選一條路，暖暖陪您慢慢走。",
  tryPrompt:
    "從本章入口中，圈出一個最想先試的：問一句、拍一下、找照片，或記下一句話。",
  reflectPrompt: "哪一個入口，最接近我現在的生活？",
  continueTitle: "暖暖陪您繼續",
  continueBody:
    "掃碼進入暖暖，聽 2 分鐘章首導讀，再選一條最適合您的啟航路線。",
  printCardTitle: "智慧啟航路線卡",
  guideTitle: "章首導讀（約 2 分鐘）",
  guideParagraphs: [
    "親愛的領航者，歡迎來到這一章。",
    "風起了，不必急著把帆拉滿。人生下半場，重要的不是跟上所有人的步調，而是找到屬於自己的節奏。",
    "暖暖不是來考您會多少科技，而是陪您用「問一句、拍一下、找照片、記下一句話」這四種日常方式，慢慢熟悉 AI 時代的生活。",
    "請先選一個最想試的入口。沒有標準答案，只有最適合您現在狀態的那一條路。",
  ],
  entries: [
    {
      id: "ask",
      label: "問一句",
      hint: "跟暖暖語音聊一下，不用打字",
      emoji: "🎙",
      open: "voice",
    },
    {
      id: "snap",
      label: "拍一下",
      hint: "打開相機，拍餐點或生活瞬間",
      emoji: "📸",
      open: "camera",
    },
    {
      id: "photo",
      label: "找照片",
      hint: "從相簿選一張已有的照片",
      emoji: "🖼",
      open: "photo",
    },
    {
      id: "note",
      label: "記下一句話",
      hint: "寫下一件小事，點亮 SMART 光點",
      emoji: "✨",
      href: "/smart/spark?source=chapter0100",
    },
  ],
};

const CHAPTERS: Record<string, ChapterOpening> = {
  "0100": CHAPTER_0100,
};

export function getChapterOpening(id: string): ChapterOpening | null {
  return CHAPTERS[id] ?? null;
}

export function chapterEntryHref(
  chapterId: string,
  entry: ChapterEntry
): string {
  if (entry.href) return entry.href;
  if (!entry.open) return "/";
  const params = new URLSearchParams({ open: entry.open, from: `chapter${chapterId}` });
  return `/?${params.toString()}`;
}

export function isSparkSource(value: string | null | undefined): value is SparkSource {
  return value === "spark_card" || value === "chapter3" || value === "chapter0100";
}

export const PICKED_ENTRY_KEY = "nuannuan_chapter0100_pick";
