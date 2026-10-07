import { describe, it, expect } from "vitest";
import {
  askDailyLimit,
  buildAskSystemPrompt,
  buildGuideContext,
  cleanAskReply,
  conditionLabels,
  guideInfo,
  taipeiDayStartIso,
  trimAskHistory,
} from "./ask";
import { toGeminiContents } from "./ai/ask-chat";

describe("打字問暖暖：限額與時間", () => {
  it("所有人都能用：免費 20、標準 50、專業 100、管理員不限", () => {
    expect(askDailyLimit("free")).toBe(20);
    expect(askDailyLimit("basic")).toBe(50);
    expect(askDailyLimit("pro")).toBe(100);
    expect(askDailyLimit("admin")).toBe(99999);
    expect(askDailyLimit("unknown")).toBe(20);
  });
  it("每天從台灣 0 點算", () => {
    expect(taipeiDayStartIso(new Date("2026-10-06T17:30:00Z"))).toBe("2026-10-06T16:00:00.000Z");
    expect(taipeiDayStartIso(new Date("2026-10-06T15:59:00Z"))).toBe("2026-10-05T16:00:00.000Z");
  });
});

describe("打字問暖暖：暖暖的說話方式", () => {
  it("慢性病用中文、帶入稱呼；不推薦其他 AI；照實介紹暖暖的功能", () => {
    expect(conditionLabels(["hypertension", "kidney", "none", "其他"])).toEqual(["高血壓", "腎臟病", "其他"]);
    const p = buildAskSystemPrompt({ displayName: "王阿嬤", conditions: ["hypertension"], mode: "chat" });
    expect(p).toContain("王阿嬤");
    expect(p).toContain("高血壓");
    expect(p).toContain("不要提到或推薦其他 AI 產品");
    expect(p).toContain("拍照問暖暖");
    expect(p).not.toContain("主持模式");
  });
  it("書本章節、自己寫的指南、主持模式、摘要都會說清楚", () => {
    const p = buildAskSystemPrompt({
      mode: "guided",
      chapterTitle: "坐回決策主位",
      guide: { label: "動能指南", text: "我的運動目標：穩定活動" },
    });
    expect(p).toContain("「坐回決策主位」");
    expect(p).toContain("「動能指南」");
    expect(p).toContain("我的運動目標：穩定活動");
    expect(p).toContain("一次只問一個問題");
    expect(buildAskSystemPrompt({ mode: "summary" })).toContain("下一步：");
  });
  it("模型偶爾用 Markdown：拿掉粗體、標題，條列改成「・」", () => {
    expect(cleanAskReply("## 重點\n**多喝水**\n- 少鹽\n* 散步\n\n\n\n好")).toBe("重點\n多喝水\n・少鹽\n・散步\n\n好");
  });
});

describe("打字問暖暖：對話整理", () => {
  it("去空白、截長度、只留最後 40 則、第一則一定是使用者", () => {
    const long = "字".repeat(2000);
    const out = trimAskHistory([
      { role: "assistant", text: "你好" },
      { role: "user", text: `  ${long}  ` },
      { role: "assistant", text: " " },
      { role: "assistant", text: "回答" },
    ]);
    expect(out[0].role).toBe("user");
    expect([...out[0].text]).toHaveLength(1500);
    expect(out).toHaveLength(2);
    const many = Array.from({ length: 50 }, (_, i) => ({ role: (i % 2 ? "assistant" : "user") as "user" | "assistant", text: String(i) }));
    expect(trimAskHistory(many)).toHaveLength(40);
  });
  it("送給模型：暖暖的話是 model；摘要模式在最後補一句「請整理」", () => {
    const c = toGeminiContents([{ role: "user", text: "問" }, { role: "assistant", text: "答" }], "summary");
    expect(c.map((x) => x.role)).toEqual(["user", "model", "user"]);
    expect(c[2].parts[0].text).toContain("整理成摘要");
  });
});

describe("打字問暖暖：書本自己寫的指南", () => {
  it("0407 帶 0406 的日常飲食指南；空的欄位不帶；沒寫就 null", () => {
    expect(guideInfo("0407")).toEqual({ source: "0406", label: "55+ 日常飲食指南" });
    expect(guideInfo("0205")).toBeNull();
    const drafts: Record<string, Record<string, unknown>> = {
      "0406": { bodyTrack: "少鹽、不吃生食", soulTrack: "  ", reflectNote: "x" },
    };
    const g = buildGuideContext("0407", (id) => drafts[id] ?? null);
    expect(g).toEqual({ label: "55+ 日常飲食指南", text: "身體軌（底線／禁忌／需再確認）：少鹽、不吃生食" });
    expect(buildGuideContext("0607", (id) => drafts[id] ?? null)).toBeNull();
    expect(buildGuideContext("0205", () => ({ a: "b" }))).toBeNull();
  });
});
