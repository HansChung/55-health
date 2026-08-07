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
  chapterSparkHref,
  chapterSparkSource,
  chapterVoiceTryHref,
  filterBookGuideSections,
  getBookGuideSections,
  getChapterDeepLinkHint,
  getChapterOpening,
  isSparkSource,
  listChapterOpenings,
  practiceWhereLabel,
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
    expect(ch?.phonePaths?.some((p) => p.id === "gemini")).toBe(true);
    expect(ch?.phonePaths?.some((p) => p.id === "chatgpt")).toBe(true);
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

  it("getChapterOpening 0800-0810 chapter 8", () => {
    const hub = getChapterOpening("0800");
    expect(hub?.layout).toBe("decision-start");
    expect(hub?.title).toContain("財富智囊");
    expect(hub?.entries).toHaveLength(4);
    expect(hub?.capabilityNote).toContain("不推薦商品");

    expect(getChapterOpening("0801")?.layout).toBe("decision-seat");
    expect(getChapterOpening("0802")?.layout).toBe("source-ladder");
    expect(getChapterOpening("0803")?.layout).toBe("clause-translate");
    expect(getChapterOpening("0804")?.layout).toBe("life-baselines");
    expect(getChapterOpening("0805")?.layout).toBe("six-hats");
    expect(getChapterOpening("0805")?.samplePrompt).toContain("不投票");
    expect(getChapterOpening("0806")?.layout).toBe("same-scale");
    expect(getChapterOpening("0807")?.layout).toBe("stress-test");
    expect(getChapterOpening("0808")?.layout).toBe("third-path");
    expect(getChapterOpening("0809")?.layout).toBe("pro-confirm");
    const memo = getChapterOpening("0810");
    expect(memo?.layout).toBe("decision-memo");
    expect(memo?.appDeepLink?.href).toBe("/smart/radar");
    expect(memo?.atAGlance).toContain("不構成投資");
  });

  it("getChapterOpening 1000-1010 chapter 10", () => {
    const hub = getChapterOpening("1000");
    expect(hub?.layout).toBe("travel-start");
    expect(hub?.title).toContain("旅遊研學");
    expect(hub?.entries).toHaveLength(4);
    expect(hub?.capabilityNote).toContain("不替您決定去哪裡");

    expect(getChapterOpening("1001")?.layout).toBe("travel-meaning");
    expect(getChapterOpening("1001")?.samplePrompt).toContain("不要替我決定去哪裡");
    expect(getChapterOpening("1002")?.layout).toBe("ground-baseline");
    expect(getChapterOpening("1003")?.layout).toBe("source-map");
    expect(getChapterOpening("1004")?.layout).toBe("feeling-table");
    expect(getChapterOpening("1005")?.layout).toBe("value-cost");
    expect(getChapterOpening("1006")?.layout).toBe("seven-rhythm");
    expect(getChapterOpening("1007")?.layout).toBe("travel-plan-b");
    expect(getChapterOpening("1008")?.layout).toBe("place-reading");
    expect(getChapterOpening("1009")?.layout).toBe("coauthor-pen");
    const portfolio = getChapterOpening("1010");
    expect(portfolio?.layout).toBe("travel-portfolio");
    expect(portfolio?.appDeepLink?.href).toBe("/smart/radar");
    expect(portfolio?.atAGlance).toContain("官方來源");
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

  it("getChapterOpening 0208 photo-search is phone practice", () => {
    const ch = getChapterOpening("0208");
    expect(ch?.practiceWhere).toBe("phone");
    expect(ch?.capabilityNote).toContain("手機系統相簿");
    expect(ch?.continueBody).toContain("手機相簿");
  });

  it("practiceWhereLabel", () => {
    expect(practiceWhereLabel("phone")).toBe("請在手機完成");
    expect(practiceWhereLabel("paper")).toBe("本頁／紙本即可完成");
    expect(practiceWhereLabel("mixed")).toBe("暖暖可陪練一部分");
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
    expect(isSparkSource("chapter0202")).toBe(true);
    expect(isSparkSource("invalid")).toBe(false);
  });

  it("chapterSparkSource / getChapterDeepLinkHint", () => {
    expect(chapterSparkSource("0202")).toBe("chapter0202");
    expect(chapterSparkHref("0202")).toContain("source=chapter0202");
    expect(getChapterDeepLinkHint("chapter0202")?.label).toContain("識花");
    expect(getChapterDeepLinkHint("chapter9999")?.tips[0]).toContain("一拍");
  });

  it("getBookGuideSections covers ch1–ch8 and ch10", () => {
    const sections = getBookGuideSections();
    expect(sections.map((s) => s.id)).toEqual([
      "ch1",
      "ch2",
      "ch3",
      "ch4",
      "ch5",
      "ch6",
      "ch7",
      "ch8",
      "ch10",
    ]);
    expect(listChapterOpenings().length).toBe(
      sections.reduce((n, s) => n + s.chapters.length, 0)
    );
    expect(sections[0].chapters.some((c) => c.id === "0102")).toBe(true);
    expect(sections[1].chapters.some((c) => c.id === "0203")).toBe(true);
    expect(sections[2].title).toBe("第三章｜優雅導航");
    expect(sections[2].chapters.some((c) => c.id === "0300")).toBe(true);
    expect(sections[3].title).toBe("第四章｜飲食文化");
    expect(sections[3].chapters.some((c) => c.id === "0400")).toBe(true);
    expect(sections[4].title).toBe("第五章｜理財防詐");
    expect(sections[4].chapters.some((c) => c.id === "0500")).toBe(true);
    expect(sections[5].title).toBe("第六章｜運動健身");
    expect(sections[5].chapters.some((c) => c.id === "0600")).toBe(true);
    expect(sections[6].title).toBe("第七章｜城市漫遊");
    expect(sections[6].chapters.some((c) => c.id === "0700")).toBe(true);
    expect(sections[7].chapters.some((c) => c.id === "0800")).toBe(true);
    expect(sections[8].title).toBe("第十章｜旅遊研學");
    expect(sections[8].chapters.some((c) => c.id === "1000")).toBe(true);
  });

  it("filterBookGuideSections by QR and keyword", () => {
    const byQr = filterBookGuideSections("0203");
    expect(byQr.some((s) => s.chapters.some((c) => c.id === "0203"))).toBe(true);

    const byKeyword = filterBookGuideSections("點菜");
    expect(byKeyword.some((s) => s.chapters.some((c) => c.id === "0203"))).toBe(true);

    const byAlias = filterBookGuideSections("Gemini");
    expect(byAlias.some((s) => s.chapters.some((c) => c.id === "0102"))).toBe(true);

    const by0400 = filterBookGuideSections("0400");
    expect(by0400.some((s) => s.chapters.some((c) => c.id === "0400"))).toBe(true);

    const byFraud = filterBookGuideSections("防詐");
    expect(byFraud.some((s) => s.id === "ch5")).toBe(true);
    expect(byFraud.some((s) => s.chapters.some((c) => c.id === "0500"))).toBe(true);

    const byCity = filterBookGuideSections("城市");
    expect(byCity.some((s) => s.id === "ch7")).toBe(true);
    expect(byCity.some((s) => s.chapters.some((c) => c.id === "0700"))).toBe(true);

    const byTravel = filterBookGuideSections("旅遊研學");
    expect(byTravel.some((s) => s.id === "ch10")).toBe(true);
    expect(byTravel.some((s) => s.chapters.some((c) => c.id === "1000"))).toBe(true);

    expect(filterBookGuideSections("不存在的關鍵字zzz")).toHaveLength(0);
    expect(filterBookGuideSections("").length).toBe(9);
  });
});
