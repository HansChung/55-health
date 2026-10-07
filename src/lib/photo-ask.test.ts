import { describe, expect, it } from "vitest";
import {
  PHOTO_ASK_FREE_DAILY,
  PHOTO_ASK_QUESTION_MAX,
  normalizePhotoAskResult,
  photoAskSpeech,
  sanitizeAskText,
} from "./photo-ask";
import { buildPhotoAskPrompt } from "./ai/photo-ask";

describe("拍照問暖暖：整理模型回覆", () => {
  it("正常回覆原樣保留、去重、最多 3 個追問", () => {
    const r = normalizePhotoAskResult({
      title: "鹿港龍山寺藻井",
      category: "building",
      explanation: "這是戲台上方的八卦藻井。",
      fun_fact: "一根釘子都沒用。",
      caution: "",
      confidence: "high",
      follow_ups: ["誰蓋的？", "誰蓋的？", "幾年了？", "怎麼拍好看？", "第四個"],
    });
    expect(r).toMatchObject({ title: "鹿港龍山寺藻井", category: "building", confidence: "high" });
    expect(r.follow_ups).toEqual(["誰蓋的？", "幾年了？", "怎麼拍好看？"]);
  });

  it("欄位缺漏或亂填時給安全預設", () => {
    const r = normalizePhotoAskResult({ explanation: "看起來是一朵花", category: "flower", confidence: "maybe", follow_ups: "nope" });
    expect(r).toMatchObject({ title: "暖暖看到的東西", category: "other", confidence: "medium", follow_ups: [], caution: "" });
  });

  it("太長的內容會截斷、換行會攤平", () => {
    const r = normalizePhotoAskResult({ title: "a".repeat(100), explanation: "第一行\n第二行 " + "字".repeat(500) });
    expect(r.title).toHaveLength(40);
    expect(r.explanation.startsWith("第一行 第二行")).toBe(true);
    expect(r.explanation.length).toBeLessThanOrEqual(400);
  });

  it("照片裡的文字（菜單翻譯、成分表）：一行一項、最多 10 行；沒有就空陣列；念給我聽會一起念", () => {
    const r = normalizePhotoAskResult({
      title: "日式定食菜單",
      explanation: "這是居酒屋的定食菜單。",
      text_lines: ["焼き鳥定食 → 烤雞肉串套餐", "", 3, ...Array.from({ length: 12 }, (_, i) => `第${i}項`)],
    });
    expect(r.text_lines[0]).toBe("焼き鳥定食 → 烤雞肉串套餐");
    expect(r.text_lines).toHaveLength(10);
    expect(photoAskSpeech(r)).toContain("焼き鳥定食 → 烤雞肉串套餐");
    expect(normalizePhotoAskResult({ title: "花", explanation: "白花" }).text_lines).toEqual([]);
  });

  it("書本帶來的長問題（菜單翻譯＋飲食需要約 80 字）不會被截斷", () => {
    const q = "請翻譯照片裡這段菜單的菜名與主要食材，用簡單中文。如果不確定，請說明不確定的部分。 我的飲食需要：少油、不要太辣";
    expect(sanitizeAskText(q, PHOTO_ASK_QUESTION_MAX)).toBe(q);
    expect(PHOTO_ASK_FREE_DAILY).toBe(5);
  });

  it("什麼都沒有 → 當作失敗（不要顯示空白卡片）", () => {
    expect(() => normalizePhotoAskResult({})).toThrow();
    expect(() => normalizePhotoAskResult(null)).toThrow();
  });

  it("念給我聽：標題、解說、小知識、提醒依序念", () => {
    const r = normalizePhotoAskResult({ title: "鳳凰木", explanation: "夏天開紅花。", fun_fact: "又叫火樹。", caution: "豆莢不要吃。" });
    expect(photoAskSpeech(r)).toEqual(["鳳凰木", "夏天開紅花。", "小知識：又叫火樹。", "提醒你：豆莢不要吃。"]);
  });

  it("長輩輸入的問題：攤平空白、截長、非字串當空", () => {
    expect(sanitizeAskText("  這是\n什麼  ", 60)).toBe("這是 什麼");
    expect(sanitizeAskText("字".repeat(100), 60)).toHaveLength(60);
    expect(sanitizeAskText(undefined, 60)).toBe("");
  });
});

describe("拍照問暖暖：提示詞", () => {
  it("帶問題與地點，並要求安全規則", () => {
    const p = buildPhotoAskPrompt({ question: "可以吃嗎？", place: "合歡山步道" });
    expect(p).toContain("長輩的問題：可以吃嗎？");
    expect(p).toContain("拍照地點（長輩自己說的，可能不準）：合歡山步道");
    expect(p).toContain("不要摘、不要吃、不要摸");
    expect(p).toContain("不要猜是誰");
    expect(p).toContain("不要硬猜具體名稱");
  });

  it("看懂文字：翻成「原文 → 中文」、成分表標過敏原、數據不診斷；JSON 有 text_lines", () => {
    const p = buildPhotoAskPrompt({ question: "請翻譯菜單" });
    expect(p).toContain("原文 → 中文");
    expect(p).toContain("過敏原");
    expect(p).toContain("不做醫療診斷");
    expect(p).toContain('"text_lines"');
  });

  it("沒給地點就不提地點", () => {
    expect(buildPhotoAskPrompt({ question: "這是什麼？" })).not.toContain("拍照地點");
  });
});
