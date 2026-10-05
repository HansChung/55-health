import { describe, it, expect } from "vitest";
import {
  buildDailyWeatherPush,
  dailyWeatherCounty,
  shouldOfferDailyWeather,
  taipeiDate,
  todayAndTonight,
  weatherHealthTip,
} from "./daily-weather";
import type { ForecastPeriod } from "./weather";

function p(over: Partial<ForecastPeriod> = {}): ForecastPeriod {
  return { start: "2026-10-05T22:00:00.000Z", end: "2026-10-06T10:00:00.000Z", wx: "多雲時晴", pop: 10, minT: 22, maxT: 27, comfort: null, ...over };
}

describe("每天早上天氣：設定", () => {
  it("有開、縣市對才發；按過「不用了」就不再問", () => {
    expect(dailyWeatherCounty({ daily_weather: { on: true, county: "臺北市" } })).toBe("臺北市");
    expect(dailyWeatherCounty({ daily_weather: { on: false, county: "臺北市" } })).toBeNull();
    expect(dailyWeatherCounty({ daily_weather: { on: true, county: "台北" } })).toBeNull();
    expect(dailyWeatherCounty({})).toBeNull();
    expect(shouldOfferDailyWeather({})).toBe(true);
    expect(shouldOfferDailyWeather(null)).toBe(true);
    expect(shouldOfferDailyWeather({ daily_weather: { on: false, county: null } })).toBe(false);
  });

  it("台灣日期：UTC 23 點已經是隔天", () => {
    expect(taipeiDate(new Date("2026-10-05T23:10:00Z"))).toBe("2026-10-06");
    expect(taipeiDate(new Date("2026-10-05T15:59:00Z"))).toBe("2026-10-05");
  });

  it("早上 7 點：白天那段＋今晚那段", () => {
    const day = p({ start: "2026-10-05T22:00:00.000Z", end: "2026-10-06T10:00:00.000Z" });
    const night = p({ start: "2026-10-06T10:00:00.000Z", end: "2026-10-06T22:00:00.000Z", minT: 18 });
    expect(todayAndTonight([day, night], new Date("2026-10-05T23:05:00Z"))).toEqual({ today: day, tonight: night });
    // 資料還沒更新到現在：用下一段
    expect(todayAndTonight([night], new Date("2026-10-05T23:05:00Z"))).toEqual({ today: night, tonight: null });
    expect(todayAndTonight([], new Date())).toBeNull();
  });
});

describe("每天早上天氣：健康提醒", () => {
  it("冷＋高血壓 → 量血壓；只是冷 → 保暖", () => {
    expect(weatherHealthTip(p({ minT: 13, maxT: 17 }), null, ["高血壓"])).toContain("量血壓");
    expect(weatherHealthTip(p({ minT: 10, maxT: 15 }), null, [])).toContain("保暖");
  });
  it("早晚溫差 8 度以上（早上涼才提外套；熱天溫差大講中暑）", () => {
    expect(weatherHealthTip(p({ minT: 20, maxT: 27 }), p({ minT: 18 }), [])).toContain("溫差");
    expect(weatherHealthTip(p({ minT: 26, maxT: 33 }), p({ minT: 24 }), [])).toContain("中暑");
  });
  it("熱＋糖尿病 → 白開水；很熱 → 中暑", () => {
    expect(weatherHealthTip(p({ minT: 26, maxT: 31 }), null, ["第二型糖尿病"])).toContain("白開水");
    expect(weatherHealthTip(p({ minT: 27, maxT: 34 }), null, [])).toContain("中暑");
  });
  it("下雨 → 在家動一動（帶傘、路滑天氣那句講過了）；天氣好 → 走走", () => {
    expect(weatherHealthTip(p({ wx: "短暫陣雨", pop: 70 }), null, [])).toContain("原地踏步");
    expect(weatherHealthTip(p(), null, [])).toContain("走走");
  });
  it("推播文字", () => {
    const msg = buildDailyWeatherPush({ county: "臺北市", today: p({ maxT: 31, minT: 25, pop: 20 }), tonight: null });
    expect(msg.title).toBe("🌤️ 早安！臺北市今天多雲時晴");
    expect(msg.body).toBe("25～31 度，降雨機率 20%。有點熱，記得多喝水。出門帶瓶水，傍晚涼一點再去散步。");
  });
});
