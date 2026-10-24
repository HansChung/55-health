import { describe, expect, it } from "vitest";
import { cachedSuggestion, suggestionCacheKey, taipeiClock } from "./suggestion-cache";

const base = {
  day: "2026-10-21",
  profile: { display_name: "阿美", age: 72, chronic_conditions: ["hypertension", "diabetes"], calorie_goal: 1600 },
  meals: [
    { meal_type: "breakfast", items: [{ name: "燕麥粥" }, { name: "水煮蛋" }], total_cal: 320 },
    { meal_type: "lunch", items: [{ name: "雞腿便當" }], total_cal: 720 },
  ],
};

describe("suggestionCacheKey", () => {
  it("同樣的資料得到同一個 key（餐點、慢性病順序不影響）", () => {
    const shuffled = {
      ...base,
      profile: { ...base.profile, chronic_conditions: ["diabetes", "hypertension"] },
      meals: [...base.meals].reverse(),
    };
    expect(suggestionCacheKey(shuffled)).toBe(suggestionCacheKey(base));
  });

  it("多記一餐、換一天、改慢性病或目標都會換 key", () => {
    const k = suggestionCacheKey(base);
    expect(suggestionCacheKey({ ...base, meals: [...base.meals, { meal_type: "snack", items: [{ name: "香蕉" }], total_cal: 90 }] })).not.toBe(k);
    expect(suggestionCacheKey({ ...base, day: "2026-10-22" })).not.toBe(k);
    expect(suggestionCacheKey({ ...base, profile: { ...base.profile, chronic_conditions: ["hypertension"] } })).not.toBe(k);
    expect(suggestionCacheKey({ ...base, profile: { ...base.profile, calorie_goal: 1800 } })).not.toBe(k);
    expect(suggestionCacheKey({ ...base, meals: [] })).not.toBe(k);
  });

  it("沒有個人資料、沒有餐點、items 格式怪也不會壞", () => {
    expect(suggestionCacheKey({ day: "2026-10-21", profile: null, meals: null })).toMatch(/^[0-9a-f]{32}$/);
    expect(suggestionCacheKey({ ...base, meals: [{ meal_type: null, items: "壞掉", total_cal: null }] })).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("cachedSuggestion", () => {
  const suggestion = { headline: "下午吃半根香蕉就好", reason: "午餐 720 卡", recommendations: [] };
  it("key 一樣才拿上次的建議", () => {
    expect(cachedSuggestion({ cache_key: "abc", suggestion }, "abc")).toEqual(suggestion);
    expect(cachedSuggestion({ cache_key: "abc", suggestion }, "xyz")).toBeNull();
  });
  it("舊紀錄沒有 cache_key、建議格式不對都不用", () => {
    expect(cachedSuggestion({ provider: "lk888" }, "abc")).toBeNull();
    expect(cachedSuggestion({ cache_key: "abc", suggestion: { reason: "沒有 headline" } }, "abc")).toBeNull();
    expect(cachedSuggestion(null, "abc")).toBeNull();
  });
});

describe("taipeiClock", () => {
  it("UTC 23:30 是台北隔天早上 7 點", () => {
    expect(taipeiClock(new Date("2026-10-20T23:30:00Z"))).toEqual({ day: "2026-10-21", hour: 7 });
  });
  it("UTC 15:59 是台北 23 點、同一天", () => {
    expect(taipeiClock(new Date("2026-10-21T15:59:00Z"))).toEqual({ day: "2026-10-21", hour: 23 });
  });
});
