import { describe, expect, it } from "vitest";
import { normalizePhotoAskResult, photoAskSpeech, sanitizeAskText } from "./photo-ask";
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
    expect(r.explanation.length).toBeLessThanOrEqual(300);
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

  it("沒給地點就不提地點", () => {
    expect(buildPhotoAskPrompt({ question: "這是什麼？" })).not.toContain("拍照地點");
  });
});
