import { describe, expect, it } from "vitest";
import { airLevel, airQualityTip, airTitleSuffix, hasLungOrHeart, parseAqx } from "./air-quality";
import { buildDailyWeatherPush } from "./daily-weather";

describe("parseAqx", () => {
  it("averages stations per county, keeps the worst, skips stations without numbers", () => {
    const m = parseAqx({
      records: [
        { sitename: "中山", county: "臺北市", aqi: "40", pollutant: "", publishtime: "2026/10/14 06:00:00" },
        { sitename: "萬華", county: "臺北市", aqi: "61", pollutant: "細懸浮微粒", publishtime: "2026/10/14 06:00:00" },
        { sitename: "維修中", county: "臺北市", aqi: "", pollutant: "" },
        { sitename: "小港", county: "高雄市", aqi: "155", pollutant: "臭氧八小時" },
        { sitename: "台東", county: "台東縣", aqi: "20" },
        { sitename: "奇怪", county: "火星", aqi: "10" },
      ],
    });
    expect(m.get("臺北市")).toMatchObject({ aqi: 51, worst: { site: "萬華", aqi: 61 }, stations: 2, pollutant: "細懸浮微粒", publishedAt: "2026/10/14 06:00:00" });
    expect(m.get("高雄市")?.aqi).toBe(155);
    expect(m.get("臺東縣")?.aqi).toBe(20); // 台 → 臺
    expect(m.size).toBe(3);
  });
  it("accepts a bare array and garbage", () => {
    expect(parseAqx([{ county: "新北市", aqi: 30 }]).get("新北市")?.aqi).toBe(30);
    expect(parseAqx("api_key 不存在。").size).toBe(0);
    expect(parseAqx(null).size).toBe(0);
  });
});

describe("advice", () => {
  it("levels follow the MOENV bands", () => {
    expect([50, 51, 100, 101, 150, 151, 200, 201, 301].map(airLevel)).toEqual(
      ["good", "moderate", "moderate", "sensitive", "sensitive", "unhealthy", "unhealthy", "very_unhealthy", "hazardous"]
    );
  });
  it("only speaks up above 100, adds medicine reminder for lung/heart conditions", () => {
    expect(airQualityTip({ aqi: 90 })).toBeNull();
    expect(airQualityTip({ aqi: 120 })).toContain("戴口罩");
    expect(airQualityTip({ aqi: 170 })).toContain("待在室內");
    expect(airQualityTip({ aqi: 120 }, ["氣喘"])).toContain("藥隨身帶");
    expect(hasLungOrHeart(["hypertension"])).toBe(false);
    expect(airTitleSuffix({ aqi: 80 })).toBe("");
    expect(airTitleSuffix({ aqi: 160 })).toBe("，空氣不好😷");
  });
});

describe("daily weather push with air", () => {
  const today = { start: "2026-10-13T22:00:00Z", end: "2026-10-14T10:00:00Z", wx: "晴時多雲", pop: 10, minT: 22, maxT: 27, comfort: null };
  it("bad air replaces the go-outside tip and marks the title", () => {
    const p = buildDailyWeatherPush({ county: "高雄市", today, tonight: null, air: { aqi: 155 } });
    expect(p.title).toContain("早安！高雄市今天晴時多雲，空氣不好😷");
    expect(p.body).toContain("AQI 155");
    expect(p.body).not.toContain("出去走走");
  });
  it("fine air leaves the push as before", () => {
    const withAir = buildDailyWeatherPush({ county: "臺北市", today, tonight: null, air: { aqi: 40 } });
    const without = buildDailyWeatherPush({ county: "臺北市", today, tonight: null });
    expect(withAir).toEqual(without);
  });
});
