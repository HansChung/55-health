import { describe, expect, it } from "vitest";
import {
  CHAPTER_0100,
  chapterEntryHref,
  getChapterOpening,
  isSparkSource,
} from "./chapter-opening";

describe("chapter-opening", () => {
  it("getChapterOpening 0100", () => {
    const ch = getChapterOpening("0100");
    expect(ch?.title).toBe("風起了，調整風帆");
    expect(ch?.entries).toHaveLength(4);
  });

  it("未知章節回 null", () => {
    expect(getChapterOpening("9999")).toBeNull();
  });

  it("chapterEntryHref 深連結", () => {
    const ask = CHAPTER_0100.entries[0];
    expect(chapterEntryHref("0100", ask)).toContain("open=voice");
    expect(chapterEntryHref("0100", ask)).toContain("from=chapter0100");

    const note = CHAPTER_0100.entries[3];
    expect(chapterEntryHref("0100", note)).toBe("/smart/spark?source=chapter0100");
  });

  it("isSparkSource", () => {
    expect(isSparkSource("chapter0100")).toBe(true);
    expect(isSparkSource("invalid")).toBe(false);
  });
});
