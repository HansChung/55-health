import { describe, it, expect } from "vitest";
import { calculateCost } from "./pricing";

describe("calculateCost", () => {
  it("未知模型回傳 0（安全 fallback）", () => {
    expect(calculateCost({ model: "unknown-model", inputTokens: 1000 })).toBe(0);
  });

  it("gemini flash token 計費", () => {
    const cost = calculateCost({ model: "gemini-2.5-flash", inputTokens: 1_000_000, outputTokens: 0 });
    expect(cost).toBeCloseTo(0.3, 6);
  });

  it("gpt-realtime 音訊秒數計費", () => {
    // audio_input = 0.06/60 per sec；60 秒輸入 = 0.06
    const cost = calculateCost({ model: "gpt-realtime", audioInputSeconds: 60, audioOutputSeconds: 0 });
    expect(cost).toBeCloseTo(0.06, 6);
  });

  it("沒有用量回傳 0", () => {
    expect(calculateCost({ model: "gpt-realtime" })).toBe(0);
  });

  it("輸入輸出 token 相加", () => {
    const cost = calculateCost({ model: "gemini-2.5-flash", inputTokens: 1_000_000, outputTokens: 1_000_000 });
    // 0.30 + 2.50
    expect(cost).toBeCloseTo(2.8, 6);
  });
});
