import { describe, expect, it } from "vitest";
import {
  CHAPTER_0100,
  CHAPTER_0102,
  chapterEntryHref,
  chapterPickKey,
  chapterVoiceTryHref,
  getChapterOpening,
  isSparkSource,
} from "./chapter-opening";

describe("chapter-opening", () => {
  it("getChapterOpening 0100", () => {
    const ch = getChapterOpening("0100");
    expect(ch?.title).toBe("風起了，調整風帆");
    expect(ch?.layout).toBe("routes");
    expect(ch?.entries).toHaveLength(4);
  });

  it("getChapterOpening 0102 ai-entry", () => {
    const ch = getChapterOpening("0102");
    expect(ch?.layout).toBe("ai-entry");
    expect(ch?.samplePrompt).toContain("簡單中文");
    expect(ch?.phonePaths?.length).toBeGreaterThan(3);
    expect(ch?.entries).toBeUndefined();
  });

  it("未知章節回 null", () => {
    expect(getChapterOpening("9999")).toBeNull();
  });

  it("chapterEntryHref 深連結", () => {
    const ask = CHAPTER_0100.entries![0];
    expect(chapterEntryHref("0100", ask)).toContain("open=voice");
    expect(chapterEntryHref("0100", ask)).toContain("from=chapter0100");

    const note = CHAPTER_0100.entries![3];
    expect(chapterEntryHref("0100", note)).toBe("/smart/spark?source=chapter0100");
  });

  it("chapterVoiceTryHref 0102", () => {
    expect(chapterVoiceTryHref("0102")).toContain("open=voice");
    expect(chapterVoiceTryHref("0102")).toContain("from=chapter0102");
  });

  it("chapterPickKey 各章獨立", () => {
    expect(chapterPickKey("0100")).not.toBe(chapterPickKey("0102"));
  });

  it("isSparkSource", () => {
    expect(isSparkSource("chapter0100")).toBe(true);
    expect(isSparkSource("invalid")).toBe(false);
  });
});
