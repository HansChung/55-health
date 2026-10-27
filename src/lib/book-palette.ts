// 書本配色：照實體書（smart55 第一部至第四部，2026-10-25 版）取的顏色。
// 書是「一部一色」：第一部（1–2 章）藍、第二部（3–7 章）青綠、第三部（8–10 章）紫、第四部（11–12 章）紫紅，
// 金色線條是全書共用的點綴。章節頁、書本目錄都從這裡拿顏色。

export type BookPart = 1 | 2 | 3 | 4;

export interface BookPartPalette {
  part: BookPart;
  /** 「第一部」… */
  partLabel: string;
  /** 章首頁底色（書的主色）：邊框、按鈕底色 */
  main: string;
  /** 部首頁的深色：文字、標題（在淺底上對比夠） */
  deep: string;
  /** 高對比模式用的更深色 */
  ink: string;
  /** 內頁標籤的淺色：選取狀態、引言底色 */
  soft: string;
  /** 內頁方格紙的底色（調淡，做頁面背景） */
  paper: string;
}

/** 全書共用的金色線條 */
export const BOOK_GOLD = "#B39766";
export const BOOK_GOLD_SOFT = "#EFE6D3";

export const BOOK_PART_PALETTES: Record<BookPart, BookPartPalette> = {
  1: { part: 1, partLabel: "第一部", main: "#5F75A3", deep: "#465576", ink: "#33405A", soft: "#DFE3ED", paper: "#F2F3F7" },
  2: { part: 2, partLabel: "第二部", main: "#608D8F", deep: "#476768", ink: "#344E4F", soft: "#DDE8E8", paper: "#F2F5F4" },
  3: { part: 3, partLabel: "第三部", main: "#76719A", deep: "#575270", ink: "#423E57", soft: "#E4E2EC", paper: "#F4F2F6" },
  4: { part: 4, partLabel: "第四部", main: "#89697A", deep: "#654C58", ink: "#4D3943", soft: "#EBE2E6", paper: "#F5F0F1" },
};

/** 書上的章名（章首頁、內頁頁眉都這樣寫） */
export const BOOK_CHAPTER_NAMES: Record<number, string> = {
  1: "智慧啟航",
  2: "感官覺醒",
  3: "優雅導航",
  4: "飲食文化",
  5: "理財防詐",
  6: "運動健身",
  7: "城市漫遊",
  8: "財富智囊",
  9: "全人健康",
  10: "旅遊研學",
  11: "故事傳承",
  12: "世界舞台",
};

const CHINESE_NUMBERS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

/** 「第三章」… */
export function bookChapterLabel(chapter: number): string {
  return `第${CHINESE_NUMBERS[chapter] ?? chapter}章`;
}

/** 章節 id（0301、1210、p4-open）→ 第幾章；不是書本章節就回 null */
export function bookChapterNumber(id: string): number | null {
  if (id === "p4-open") return 11;
  const m = /^(\d{2})\d{2}$/.exec(id);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 12 ? n : null;
}

export function bookPartForChapter(chapter: number): BookPart {
  if (chapter <= 2) return 1;
  if (chapter <= 7) return 2;
  if (chapter <= 10) return 3;
  return 4;
}

/** 章節 id 的配色；不是書本章節就回 null（沿用 App 原本的顏色） */
export function bookPaletteForChapterId(id: string): BookPartPalette | null {
  const chapter = bookChapterNumber(id);
  return chapter ? BOOK_PART_PALETTES[bookPartForChapter(chapter)] : null;
}

/**
 * 套在章節頁最外層的 CSS：把 App 的主色（--primary*）換成這一部的顏色，
 * 另外給 --book* 讓示範卡片、引言用。高對比模式改用更深的顏色。
 */
export function bookThemeCss(selector: string, p: BookPartPalette): string {
  return `
    ${selector} {
      --book: ${p.main}; --book-deep: ${p.deep}; --book-soft: ${p.soft};
      --book-gold: ${BOOK_GOLD}; --book-gold-soft: ${BOOK_GOLD_SOFT};
      --primary: ${p.main}; --primary-deep: ${p.deep}; --primary-soft: ${p.soft};
      --gold: ${BOOK_GOLD}; --gold-soft: ${BOOK_GOLD_SOFT};
      --bg: ${p.paper};
    }
    body:has(${selector}) { background: ${p.paper}; }
    :root[data-contrast="high"] ${selector} {
      --book: ${p.deep}; --book-deep: ${p.ink};
      --primary: ${p.deep}; --primary-deep: ${p.ink};
    }
    ${selector} .btn-primary { box-shadow: 0 6px 0 var(--primary-deep), 0 10px 20px rgba(40, 40, 60, 0.18); }
    ${selector} .btn-primary:active { box-shadow: 0 2px 0 var(--primary-deep), 0 4px 10px rgba(40, 40, 60, 0.14); }
  `;
}
