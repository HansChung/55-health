import { describe, expect, it } from "vitest";
import {
  DEFAULT_COST_SETTINGS,
  lk888MonthUsed,
  monthRange,
  normalizeCostSettings,
  rateFromPricing,
  recentMonths,
  rowPoints,
  summarizeUsage,
  type UsageRow,
} from "./admin-costs";

const row = (over: Partial<UsageRow>): UsageRow => ({
  user_id: "u1", endpoint: "/api/ai/chat", model: "gem-3.5-flash-lite", input_tokens: 0, output_tokens: 0,
  success: true, metadata: {}, created_at: "2026-10-10T04:00:00Z", ...over,
});

describe("settings", () => {
  it("falls back to defaults and drops bad fixed costs", () => {
    expect(normalizeCostSettings(null)).toEqual(DEFAULT_COST_SETTINGS);
    const s = normalizeCostSettings({ pointNtd: 5, usdNtd: -1, feePct: 2, fixed: [{ name: " Vercel ", usd: 20 }, { name: "", usd: 3 }, { name: "x", usd: "a" }] });
    expect(s).toEqual({ pointNtd: 5, usdNtd: 32, feePct: 2, fixed: [{ name: "Vercel", usd: 20 }] });
  });
});

describe("points", () => {
  const rates = { "gem-3.5-flash-lite": { input: 1, output: 8 } };
  it("uses platform_cost when lk888 reported it, otherwise estimates from tokens", () => {
    expect(rowPoints(row({ metadata: { platform_cost: 0.95 } }), rates)).toEqual({ points: 0.95, actual: true });
    expect(rowPoints(row({ input_tokens: 1000, output_tokens: 500 }), rates)).toEqual({ points: 0.005, actual: false });
    expect(rowPoints(row({ model: "gem-3.8-flash", input_tokens: 1_000_000 }), {}).points).toBeCloseTo(0.396);
    expect(rowPoints(row({ success: false, metadata: { platform_cost: 5 } }), rates).points).toBe(0);
    expect(rowPoints(row({ model: "mystery" , input_tokens: 99 }), rates)).toMatchObject({ points: 0, actual: false });
  });
  it("Google-direct rows use cost_usd; voice clone has a fixed price", () => {
    // 1 美元 = 32 台幣 ÷ 4.8 = 6.67 算力
    const g = rowPoints(row({ model: "gemini-2.5-flash", cost_usd: "0.003", metadata: { provider: "google" }, input_tokens: 10 }), {}, 32 / 4.8);
    expect(g.points).toBeCloseTo(0.02);
    expect(g.actual).toBe(false);
    expect(g.external).toBe(true);
    expect(summarizeUsage([row({ model: "gemini-2.5-flash", cost_usd: 0.003, metadata: { provider: "google" } }), row({ metadata: { platform_cost: 1 } })], {}, 32 / 4.8).externalPoints).toBeCloseTo(0.02);
    expect(rowPoints(row({ endpoint: "/api/ai/voice-clone", model: "speech-2.8-clone" }), {})).toEqual({ points: 0.1, actual: false });
  });
  it("median of usable token-priced channels", () => {
    const r = rateFromPricing({ channel_groups: [
      { is_active: true, in_key_whitelist: true, billing_method: "按token", input_token_price: 1, output_token_price: 10, current_time_discount: 1 },
      { is_active: true, in_key_whitelist: true, billing_method: "按token", input_token_price: 3, output_token_price: 30, current_time_discount: 1 },
      { is_active: false, in_key_whitelist: true, billing_method: "按token", input_token_price: 99, output_token_price: 99 },
      { is_active: true, excluded_for_this_key: true, billing_method: "按token", input_token_price: 99, output_token_price: 99 },
    ] });
    expect(r).toEqual({ input: 2, output: 20 });
    expect(rateFromPricing({})).toBeNull();
  });
});

describe("summary", () => {
  it("groups by feature, day and user; skips reserved rows", () => {
    const s = summarizeUsage([
      row({ endpoint: "/api/ai/travel-video", model: "minimax-h3", metadata: { platform_cost: 0.95 } }),
      row({ endpoint: "/api/ai/analyze-food", model: "gem-3.8-flash", input_tokens: 1000, output_tokens: 1000, user_id: "u2" }),
      row({ endpoint: "/api/ai/analyze-food", model: "gem-3.8-flash", success: false, user_id: "u2" }),
      row({ model: "reserved", metadata: { reserved: true } }),
    ], {});
    expect(s.calls).toBe(3);
    expect(s.failed).toBe(1);
    expect(s.byFeature.map((f) => [f.feature, f.calls, f.failed])).toEqual([["出遊影片（單張）", 1, 0], ["拍照記餐", 2, 1]]);
    expect(s.actualPoints).toBeCloseTo(0.95);
    expect(s.estimatedPoints).toBeCloseTo((1000 * 0.396 + 1000 * 1.9642) / 1e6);
    expect(s.daily).toEqual([{ day: "2026-10-10", points: s.points }]);
    expect(s.topUsers[0].user_id).toBe("u1");
  });
});

describe("months and lk888 snapshots", () => {
  it("month range is Taipei time", () => {
    expect(monthRange("2026-10")).toEqual({ start: "2026-09-30T16:00:00.000Z", end: "2026-10-31T16:00:00.000Z" });
    expect(recentMonths(new Date("2026-01-15T00:00:00Z"), 3)).toEqual(["2026-01", "2025-12", "2025-11"]);
  });
  it("monthly used = end − last snapshot before the month", () => {
    const snaps = [{ day: "2026-09-30", used: 10, balance: 50 }, { day: "2026-10-05", used: 14, balance: 46 }, { day: "2026-10-20", used: 20, balance: 40 }];
    expect(lk888MonthUsed(snaps, "2026-10")).toEqual({ used: 10, since: "2026-10-01" });
    // 沒有月初以前的紀錄：從第一筆那一天結束時算起
    expect(lk888MonthUsed(snaps.slice(1), "2026-10")).toEqual({ used: 6, since: "2026-10-06" });
    // 金鑰中途換過（累計歸零後又長回來）也要看得出來
    expect(lk888MonthUsed([{ day: "2026-09-30", used: 100, balance: 0 }, { day: "2026-10-05", used: 0, balance: 0 }, { day: "2026-10-20", used: 150, balance: 0 }], "2026-10")).toBeNull();
    expect(lk888MonthUsed([{ day: "2026-10-05", used: 3, balance: 0 }], "2026-10")).toBeNull();
    expect(lk888MonthUsed([{ day: "2026-10-01", used: 30, balance: 0 }, { day: "2026-10-02", used: 1, balance: 0 }], "2026-10")).toBeNull();
    expect(lk888MonthUsed([], "2026-10")).toBeNull();
  });
});
