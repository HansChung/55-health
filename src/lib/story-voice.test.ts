import { describe, expect, it } from "vitest";
import { STORY_VOICE_CHUNK_MAX, splitForVoice, storyVoiceText, taipeiMonthStartIso } from "./story-voice";

describe("storyVoiceText", () => {
  it("標題、年代、內容一行一行，去掉空行與控制字元", () => {
    expect(storyVoiceText({ title: "第一次搭火車", era: "民國 50 年", body: "那天很冷。\n\n\u0007我穿著新衣服。" })).toBe(
      "第一次搭火車\n民國 50 年\n那天很冷。\n我穿著新衣服。"
    );
    expect(storyVoiceText({ title: "聲音故事", era: null, body: "" })).toBe("聲音故事");
  });
});

describe("splitForVoice", () => {
  it("短文一段就好", () => {
    expect(splitForVoice("標題\n民國 50 年\n今天天氣很好。我們去散步")).toEqual(["標題。民國 50 年。今天天氣很好。我們去散步。"]);
  });

  it("每段都不超過上限、字一個都沒少", () => {
    const body = Array.from({ length: 80 }, (_, i) => `這是第${i + 1}句，我記得那一年的夏天特別熱，大家都在廟口乘涼。`).join("");
    // 有句號結尾的不會多補
    const chunks = splitForVoice(body);
    expect(chunks.length).toBeGreaterThan(5);
    for (const c of chunks) expect([...c].length).toBeLessThanOrEqual(STORY_VOICE_CHUNK_MAX);
    expect(chunks.join("")).toBe(body);
  });

  it("沒有標點的長句也會切開", () => {
    const long = "啊".repeat(STORY_VOICE_CHUNK_MAX * 2 + 10);
    const chunks = splitForVoice(long);
    expect(chunks.length).toBe(3);
    expect(chunks.join("")).toBe(`${long}。`);
  });

  it("在句號斷，不把一句話切成兩半", () => {
    const a = "甲".repeat(200) + "。";
    const b = "乙".repeat(200) + "。";
    expect(splitForVoice(a + b)).toEqual([a, b]);
  });
});

describe("taipeiMonthStartIso", () => {
  it("台北時間的月初（UTC 前一天 16:00）", () => {
    expect(taipeiMonthStartIso(new Date("2026-10-12T15:00:00Z"))).toBe("2026-09-30T16:00:00.000Z");
    // UTC 還是 9/30，但台北已經 10/1
    expect(taipeiMonthStartIso(new Date("2026-09-30T17:00:00Z"))).toBe("2026-09-30T16:00:00.000Z");
  });
});
