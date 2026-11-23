import { describe, it, expect } from "vitest";
import type { CountyAir } from "./air-quality";
import {
  buildTodayWeather,
  clothingAdvice,
  outingVerdict,
  periodDayWord,
  periodLabel,
  tempText,
  upcomingPeriods,
} from "./today-weather";
import type { ForecastPeriod } from "./weather";

/** 台灣時間 → Date */
const tw = (s: string) => new Date(`${s}+08:00`);

function period(start: string, end: string, over: Partial<ForecastPeriod> = {}): ForecastPeriod {
  return { start: tw(start).toISOString(), end: tw(end).toISOString(), wx: "多雲時晴", pop: 10, minT: 22, maxT: 27, comfort: "舒適", ...over };
}

/** 早上 5 點發布的三段：今天白天、今晚、明天白天 */
const DAY = period("2026-11-24T06:00:00", "2026-11-24T18:00:00");
const NIGHT = period("2026-11-24T18:00:00", "2026-11-25T06:00:00", { minT: 19, maxT: 22 });
const NEXT_DAY = period("2026-11-25T06:00:00", "2026-11-25T18:00:00", { wx: "陰短暫雨", pop: 60 });
const PERIODS = [DAY, NIGHT, NEXT_DAY];

const air = (aqi: number, worst = aqi): CountyAir => ({
  county: "臺北市", aqi, worst: { site: "萬華", aqi: worst }, stations: 5, pollutant: "細懸浮微粒", publishedAt: null,
});

describe("時段名稱", () => {
  it("白天、晚上、明天", () => {
    const now = tw("2026-11-24T09:00:00");
    expect(periodLabel(DAY, now)).toBe("今天白天");
    expect(periodLabel(NIGHT, now)).toBe("今天晚上");
    expect(periodLabel(NEXT_DAY, now)).toBe("明天白天");
  });

  it("過了半夜還在同一段：不叫今天晚上", () => {
    const now = tw("2026-11-25T02:00:00");
    expect(periodLabel(NIGHT, now)).toBe("半夜到清晨");
    // 接下來那個白天已經是「今天」
    expect(periodLabel(NEXT_DAY, now)).toBe("今天白天");
    expect(periodDayWord(NEXT_DAY, now)).toBe("今天");
  });

  it("空氣不好：健康提醒不叫人出去走走", () => {
    const mild = [period("2026-11-24T06:00:00", "2026-11-24T18:00:00", { minT: 22, maxT: 26 })];
    const now = tw("2026-11-24T09:00:00");
    expect(buildTodayWeather({ county: "臺北市", periods: mild, air: air(40), now })!.healthTip).toContain("出去走走");
    const bad = buildTodayWeather({ county: "臺北市", periods: mild, air: air(130), now })!;
    expect(bad.healthTip).not.toMatch(/出去走走|去散步/);
    expect(bad.healthTip).toContain("在家");
  });

  it("晚上打開：正在進行的那段是今天晚上", () => {
    expect(periodLabel(NIGHT, tw("2026-11-24T21:00:00"))).toBe("今天晚上");
  });

  it("過完的時段不顯示", () => {
    expect(upcomingPeriods(PERIODS, tw("2026-11-24T19:00:00"))).toEqual([NIGHT, NEXT_DAY]);
    expect(upcomingPeriods(PERIODS, tw("2026-11-26T00:00:00"))).toEqual([]);
  });
});

describe("outingVerdict（適不適合出門）", () => {
  it("天氣好、空氣好 → 適合出門", () => {
    expect(outingVerdict(DAY, air(40))).toEqual({ level: "good", title: "今天適合出門走走", reasons: [] });
  });

  it("可能下雨、空氣不太好 → 要注意，空氣排前面", () => {
    const v = outingVerdict({ ...DAY, pop: 40 }, air(120));
    expect(v.level).toBe("care");
    expect(v.title).toBe("今天出門要注意");
    expect(v.reasons).toHaveLength(2);
    expect(v.reasons[0]).toContain("口罩");
    expect(v.reasons[1]).toContain("傘");
  });

  it("空氣很差、酷熱、寒流、雷雨 → 待在家", () => {
    expect(outingVerdict(DAY, air(170)).level).toBe("stay");
    expect(outingVerdict({ ...DAY, maxT: 37 }, null).level).toBe("stay");
    expect(outingVerdict({ ...DAY, minT: 7, maxT: 12 }, null).level).toBe("stay");
    expect(outingVerdict({ ...DAY, wx: "午後雷陣雨", pop: 80 }, null).level).toBe("stay");
    // 有雷但機率不高：提醒就好
    expect(outingVerdict({ ...DAY, wx: "午後雷陣雨", pop: 40 }, null).level).toBe("care");
  });

  it("沒有降雨機率、沒有溫度也不會壞", () => {
    expect(outingVerdict({ ...DAY, pop: null, minT: null, maxT: null }, null).level).toBe("good");
  });

  it("可以說明天", () => {
    expect(outingVerdict(NEXT_DAY, null, "明天").title).toBe("明天出門要注意");
  });
});

describe("clothingAdvice（穿什麼）", () => {
  it("照溫度分級，越冷穿越多", () => {
    expect(clothingAdvice({ minT: 26, maxT: 33 })?.text).toContain("短袖");
    expect(clothingAdvice({ minT: 21, maxT: 29 })?.text).toContain("薄外套");
    expect(clothingAdvice({ minT: 18, maxT: 24 })?.text).toContain("長袖");
    expect(clothingAdvice({ minT: 15, maxT: 19 })?.text).toContain("外套");
    expect(clothingAdvice({ minT: 11, maxT: 15 })?.text).toContain("毛衣");
    expect(clothingAdvice({ minT: 6, maxT: 11 })?.text).toContain("圍巾");
  });

  it("沒有溫度就不說", () => {
    expect(clothingAdvice({ minT: null, maxT: null })).toBeNull();
    expect(clothingAdvice({ minT: null, maxT: 30 })?.text).toContain("短袖");
  });
});

describe("tempText", () => {
  it("範圍、同一個數字、缺一邊", () => {
    expect(tempText({ minT: 22, maxT: 27 })).toBe("22～27 度");
    expect(tempText({ minT: 22, maxT: 22 })).toBe("22 度");
    expect(tempText({ minT: null, maxT: 27 })).toBe("27 度");
    expect(tempText({ minT: null, maxT: null })).toBeNull();
  });
});

describe("buildTodayWeather", () => {
  it("白天打開：出門建議說今天，空氣算進去", () => {
    const w = buildTodayWeather({ county: "臺北市", periods: PERIODS, air: air(120), now: tw("2026-11-24T09:00:00") })!;
    expect(w.now.label).toBe("今天白天");
    expect(w.later.map((s) => s.label)).toEqual(["今天晚上", "明天白天"]);
    expect(w.outing.label).toBe("今天白天");
    expect(w.outing.level).toBe("care");
    expect(w.air).toMatchObject({ aqi: 120, level: "sensitive", label: "不太好", worst: null });
    expect(w.air?.tip).toContain("AQI 120");
    // 空氣那一句只在空氣卡片，健康提醒不重複
    expect(w.healthTip).not.toContain("AQI");
    expect(w.speech.join("。")).toContain("AQI 120");
    expect(w.speech[0]).toBe("臺北市今天白天多雲時晴");
    expect(w.speech.join("")).not.toMatch(/😷|🟡/);
  });

  it("晚上打開：出門建議說明天白天，現在的空氣不拿來說明天", () => {
    const w = buildTodayWeather({ county: "臺北市", periods: PERIODS, air: air(170), now: tw("2026-11-24T20:00:00") })!;
    expect(w.now.label).toBe("今天晚上");
    expect(w.outing.label).toBe("明天白天");
    expect(w.outing.title).toBe("明天出門要注意");
    expect(w.outing.reasons.join("")).not.toContain("空氣");
    // 空氣那一張還是照現在的顯示
    expect(w.air?.level).toBe("unhealthy");
    expect(w.clothing).not.toBeNull();
  });

  it("空氣好也有一句話；最差的測站差很多才提", () => {
    const w = buildTodayWeather({ county: "臺北市", periods: PERIODS, air: air(35, 80), now: tw("2026-11-24T09:00:00") })!;
    expect(w.air?.tip).toContain("空氣很好");
    expect(w.air?.label).toBe("很好");
    expect(w.air?.worst).toEqual({ site: "萬華", aqi: 80 });
    expect(w.outing.level).toBe("good");
  });

  it("腎臟病：熱天不叫他多喝水", () => {
    const hot = [period("2026-07-01T06:00:00", "2026-07-01T18:00:00", { minT: 27, maxT: 33 })];
    const w = buildTodayWeather({ county: "高雄市", periods: hot, conditions: ["kidney"], now: tw("2026-07-01T08:00:00") })!;
    expect(w.now.advice).not.toContain("多喝水");
    expect(w.healthTip).toContain("照醫師交代");
    expect(w.air).toBeNull();
    expect(w.later).toEqual([]);
  });

  it("預報都過期了 → null", () => {
    expect(buildTodayWeather({ county: "臺北市", periods: PERIODS, now: tw("2026-11-27T00:00:00") })).toBeNull();
    expect(buildTodayWeather({ county: "臺北市", periods: [] })).toBeNull();
  });
});
