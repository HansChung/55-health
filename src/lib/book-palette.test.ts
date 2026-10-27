import { describe, expect, it } from "vitest";
import { getBookGuideSections } from "./chapter-opening";
import { BOOK_PART_PALETTES, bookChapterNumber, bookPaletteForChapterId } from "./book-palette";

describe("書本配色", () => {
  it("章節 id → 第幾章", () => {
    expect(bookChapterNumber("0301")).toBe(3);
    expect(bookChapterNumber("1210")).toBe(12);
    expect(bookChapterNumber("p4-open")).toBe(11);
    expect(bookChapterNumber("1301")).toBeNull();
    expect(bookChapterNumber("abc")).toBeNull();
  });

  it("一部一色：1–2 章第一部、3–7 第二部、8–10 第三部、11–12 第四部", () => {
    expect(bookPaletteForChapterId("0100")?.part).toBe(1);
    expect(bookPaletteForChapterId("0211")?.part).toBe(1);
    expect(bookPaletteForChapterId("0300")?.part).toBe(2);
    expect(bookPaletteForChapterId("0710")?.part).toBe(2);
    expect(bookPaletteForChapterId("0800")?.part).toBe(3);
    expect(bookPaletteForChapterId("1010")?.part).toBe(3);
    expect(bookPaletteForChapterId("p4-open")?.part).toBe(4);
    expect(bookPaletteForChapterId("1200")?.part).toBe(4);
    expect(bookPaletteForChapterId("x")).toBeNull();
  });

  it("書本目錄：同一部的章節同一個顏色", () => {
    for (const s of getBookGuideSections()) {
      const n = Number(s.id.slice(2));
      const p = BOOK_PART_PALETTES[n <= 2 ? 1 : n <= 7 ? 2 : n <= 10 ? 3 : 4];
      expect(s.accent).toBe(p.deep);
      expect(s.partLabel).toBe(p.partLabel);
      for (const ch of s.chapters) expect(ch.color).toBe(p.deep);
    }
  });
});
