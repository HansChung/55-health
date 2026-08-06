import { describe, expect, it } from "vitest";
import {
  CHAPTER_0100,
  CHAPTER_0102,
  CHAPTER_0103,
  buildMenuTranslatePrompt,
  buildOrganizeAskPrompt,
  buildSmartFlowAskPrompt,
  buildVisionAskPrompt,
  chapterCameraTryHref,
  chapterEntryHref,
  chapterPhotoTryHref,
  chapterPickKey,
  chapterDraftKey,
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

  it("getChapterOpening 0103 question-rewrite", () => {
    const ch = getChapterOpening("0103");
    expect(ch?.title).toContain("關鍵字");
    expect(ch?.layout).toBe("question-rewrite");
    expect(ch?.rewriteDemos).toHaveLength(3);
    expect(ch?.backgroundOptions?.length).toBeGreaterThan(2);
  });

  it("getChapterOpening 0104 organize-decide", () => {
    const ch = getChapterOpening("0104");
    expect(ch?.title).toContain("第二個大腦");
    expect(ch?.layout).toBe("organize-decide");
    expect(ch?.quote).toContain("仍然由您掌握");
    expect(ch?.organizeDemos).toHaveLength(2);
    expect(ch?.printCardTitle).toBe("三點一決定整理卡");
  });

  it("getChapterOpening 0105 vision-identify", () => {
    const ch = getChapterOpening("0105");
    expect(ch?.title).toContain("萬物皆可問");
    expect(ch?.layout).toBe("vision-identify");
    expect(ch?.quote).toContain("理解世界的入口");
    expect(ch?.visionDemos).toHaveLength(2);
    expect(ch?.printCardTitle).toBe("影像辨識安全卡");
  });

  it("getChapterOpening 0106 photo-search", () => {
    const ch = getChapterOpening("0106");
    expect(ch?.title).toContain("照片可以搜尋");
    expect(ch?.layout).toBe("photo-search");
    expect(ch?.warmKeywordSuggestions).toContain("台南");
    expect(ch?.printCardTitle).toBe("相簿搜尋關鍵字卡");
  });

  it("getChapterOpening 0107 note-capture", () => {
    const ch = getChapterOpening("0107");
    expect(ch?.layout).toBe("note-capture");
    expect(ch?.defaultNoteTitle).toBe("今天的小發現");
    expect(ch?.noteTagOptions?.length).toBe(3);
  });

  it("getChapterOpening 0108 smart-flow", () => {
    const ch = getChapterOpening("0108");
    expect(ch?.title).toContain("預備起飛");
    expect(ch?.layout).toBe("smart-flow");
    expect(ch?.quote).toContain("一拍、二問、三記下");
    expect(ch?.smartFlowDemos).toHaveLength(1);
  });

  it("getChapterOpening 0200 Chapter 2 routes", () => {
    const ch = getChapterOpening("0200");
    expect(ch?.title).toBe("感官覺醒");
    expect(ch?.layout).toBe("routes");
    expect(ch?.entries?.length).toBe(5);
  });

  it("getChapterOpening 0203 menu-translate", () => {
    const ch = getChapterOpening("0203");
    expect(ch?.layout).toBe("menu-translate");
    expect(ch?.menuDemos).toHaveLength(1);
  });

  it("getChapterOpening 0211 sensory-habit", () => {
    const ch = getChapterOpening("0211");
    expect(ch?.layout).toBe("sensory-habit");
    expect(ch?.habitSceneOptions?.length).toBeGreaterThan(3);
  });

  it("buildMenuTranslatePrompt", () => {
    expect(buildMenuTranslatePrompt("少辣")).toContain("少辣");
  });

  it("buildOrganizeAskPrompt", () => {
    expect(buildOrganizeAskPrompt("")).toContain("不要替我決定");
    expect(buildOrganizeAskPrompt("  出門要帶什麼  ")).toContain("出門要帶什麼");
    expect(buildOrganizeAskPrompt("出門要帶什麼")).not.toContain("  ");
  });

  it("buildVisionAskPrompt", () => {
    expect(buildVisionAskPrompt()).toContain("簡單中文");
    expect(buildVisionAskPrompt("  小白花  ")).toContain("我拍的是：小白花");
  });

  it("buildSmartFlowAskPrompt", () => {
    expect(buildSmartFlowAskPrompt()).toBe("這是什麼？請用簡單中文說明。");
    expect(buildSmartFlowAskPrompt("小白花")).toContain("我拍的是：小白花");
  });

  it("chapterCameraTryHref 0105", () => {
    expect(chapterCameraTryHref("0105")).toContain("open=camera");
    expect(chapterPhotoTryHref("0105")).toContain("open=photo");
    expect(chapterCameraTryHref("0105")).toContain("from=chapter0105");
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
    expect(chapterDraftKey("0103")).toContain("0103");
  });

  it("isSparkSource", () => {
    expect(isSparkSource("chapter0100")).toBe(true);
    expect(isSparkSource("invalid")).toBe(false);
  });
});
