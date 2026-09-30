import { describe, it, expect } from "vitest";
import {
  guessCounty,
  parseCwa36h,
  periodAt,
  weatherAdvice,
  weatherEmoji,
  weatherReminderText,
  weatherSummary,
  type ForecastPeriod,
} from "./weather";
import { reminderMessage } from "./study-tours";

/** 氣象署 F-C0032-001 的回應格式（節錄） */
function cwaFixture(county = "彰化縣") {
  const t = (start: string, end: string, name: string) => ({ startTime: start, endTime: end, parameter: { parameterName: name } });
  const periods = [
    ["2026-09-30 18:00:00", "2026-10-01 06:00:00"],
    ["2026-10-01 06:00:00", "2026-10-01 18:00:00"],
    ["2026-10-01 18:00:00", "2026-10-02 06:00:00"],
  ];
  const el = (elementName: string, values: string[]) => ({
    elementName,
    time: periods.map(([s, e], i) => t(s, e, values[i])),
  });
  return {
    success: "true",
    records: {
      datasetDescription: "三十六小時天氣預報",
      location: [
        { locationName: "臺北市", weatherElement: [el("Wx", ["晴", "晴", "晴"])] },
        {
          locationName: county,
          weatherElement: [
            el("Wx", ["多雲", "多雲短暫陣雨", "晴時多雲"]),
            el("PoP", ["10", "60", "0"]),
            el("MinT", ["24", "25", "23"]),
            el("CI", ["舒適", "舒適至悶熱", "舒適"]),
            el("MaxT", ["27", "31", "26"]),
          ],
        },
      ],
    },
  };
}

describe("縣市判斷", () => {
  it("台／臺都認得，縣市名稱或常見地名", () => {
    expect(guessCounty("彰化火車站前站 7-11 門口")).toBe("彰化縣");
    expect(guessCounty("台中國家歌劇院大門口")).toBe("臺中市");
    expect(guessCounty("鹿港老街入口")).toBe("彰化縣");
    expect(guessCounty("新竹縣竹北市公所")).toBe("新竹縣");
    expect(guessCounty("新北投捷運站")).toBe("臺北市");
    expect(guessCounty("不知道在哪", "")).toBeNull();
  });
  it("集合地點看不出來就看活動名稱", () => {
    expect(guessCounty("大門口", "明日研學：彰化扇形車庫")).toBe("彰化縣");
  });
});

describe("解析氣象署預報", () => {
  const periods = parseCwa36h(cwaFixture(), "彰化縣");
  it("取出指定縣市的 3 個時段，時間是台灣時間", () => {
    expect(periods).toHaveLength(3);
    expect(periods[1]).toEqual({
      start: "2026-09-30T22:00:00.000Z",
      end: "2026-10-01T10:00:00.000Z",
      wx: "多雲短暫陣雨",
      pop: 60,
      minT: 25,
      maxT: 31,
      comfort: "舒適至悶熱",
    });
  });
  it("找不到縣市或格式不對 → 空陣列", () => {
    expect(parseCwa36h(cwaFixture(), "花蓮縣")).toEqual([]);
    expect(parseCwa36h({ error: "Unauthorized" }, "彰化縣")).toEqual([]);
    expect(parseCwa36h(null, "彰化縣")).toEqual([]);
  });
  it("活動開始那一刻落在哪個時段", () => {
    expect(periodAt(periods, "2026-10-01T01:00:00Z")?.wx).toBe("多雲短暫陣雨"); // 台灣 09:00
    expect(periodAt(periods, "2026-10-05T01:00:00Z")).toBeNull();
  });
});

describe("給長輩的天氣提醒", () => {
  const p = (over: Partial<ForecastPeriod>): ForecastPeriod => ({
    start: "", end: "", wx: "多雲", pop: 10, minT: 22, maxT: 28, comfort: null, ...over,
  });
  it("下雨最優先，其次很熱、很冷", () => {
    expect(weatherAdvice(p({ pop: 60, maxT: 34 }))).toContain("帶傘");
    expect(weatherAdvice(p({ pop: 30 }))).toContain("可能會下雨");
    expect(weatherAdvice(p({ maxT: 33 }))).toContain("很熱");
    expect(weatherAdvice(p({ minT: 11, maxT: 18 }))).toContain("天氣冷");
    expect(weatherAdvice(p({}))).toBeNull();
  });
  it("圖示與一句話摘要", () => {
    expect(weatherEmoji("多雲短暫陣雨")).toBe("🌧️");
    expect(weatherEmoji("晴時多雲")).toBe("🌤️");
    expect(weatherSummary(p({ wx: "晴時多雲", pop: 0, minT: 23, maxT: 26 }))).toBe("晴時多雲，降雨機率 0%，23～26 度");
    expect(weatherReminderText(p({ wx: "多雲短暫陣雨", pop: 60, minT: 25, maxT: 31 }))).toBe(
      "🌧️ 多雲短暫陣雨，降雨機率 60%，25～31 度，記得帶傘或輕便雨衣，走路小心地滑"
    );
  });
  it("行前提醒帶上天氣（沒有天氣就跟原本一樣）", () => {
    const tour = { title: "八卦山", starts_at: "2026-10-01T01:00:00Z", meeting_point: "大佛前" };
    const reg = { status: "confirmed" as const, for_self: true, participant_name: "王阿嬤" };
    const withSky = reminderMessage("day_before", tour, reg, "🌧️ 多雲短暫陣雨，降雨機率 60%")!;
    expect(withSky.body.endsWith("\n🌧️ 多雲短暫陣雨，降雨機率 60%")).toBe(true);
    expect(reminderMessage("day_before", tour, reg)!.body).not.toContain("\n");
  });
});
