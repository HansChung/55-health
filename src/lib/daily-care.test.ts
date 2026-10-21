import { describe, expect, it } from "vitest";
import { buildDailyCarePush, byLatestActivity, dailyCareChannel, dailyCareEmailMax, DAILY_CARE_EMAIL_MAX_DEFAULT } from "./daily-care";

describe("dailyCareChannel", () => {
  it("關掉的人什麼都不送", () => {
    expect(dailyCareChannel({ off: true, hasPush: true, getsWeatherPush: false })).toBe("off");
    expect(dailyCareChannel({ off: true, hasPush: false, getsWeatherPush: false })).toBe("off");
  });
  it("有推播就推播；已經有天氣早安推播的不再多推", () => {
    expect(dailyCareChannel({ off: false, hasPush: true, getsWeatherPush: false })).toBe("push");
    expect(dailyCareChannel({ off: false, hasPush: true, getsWeatherPush: true })).toBe("weather");
  });
  it("沒推播才寄 Email", () => {
    expect(dailyCareChannel({ off: false, hasPush: false, getsWeatherPush: false })).toBe("email");
    // 沒訂閱推播就收不到天氣推播，照樣寄
    expect(dailyCareChannel({ off: false, hasPush: false, getsWeatherPush: true })).toBe("email");
  });
});

describe("dailyCareEmailMax", () => {
  it("沒設用預設，設了用設定值，亂填用預設", () => {
    expect(dailyCareEmailMax({})).toBe(DAILY_CARE_EMAIL_MAX_DEFAULT);
    expect(dailyCareEmailMax({ DAILY_CARE_EMAIL_MAX: "20" })).toBe(20);
    expect(dailyCareEmailMax({ DAILY_CARE_EMAIL_MAX: "0" })).toBe(0);
    expect(dailyCareEmailMax({ DAILY_CARE_EMAIL_MAX: "-5" })).toBe(DAILY_CARE_EMAIL_MAX_DEFAULT);
    expect(dailyCareEmailMax({ DAILY_CARE_EMAIL_MAX: "很多" })).toBe(DAILY_CARE_EMAIL_MAX_DEFAULT);
    expect(dailyCareEmailMax({ DAILY_CARE_EMAIL_MAX: " " })).toBe(DAILY_CARE_EMAIL_MAX_DEFAULT);
  });
});

describe("buildDailyCarePush", () => {
  it("最多兩句＋今日小叮嚀", () => {
    const msg = buildDailyCarePush({
      name: "阿美",
      lines: ["昨天您記錄了 3 餐，做得很好，繼續保持！", "最近血壓 128/80，很穩定，真棒！", "別忘了今天的藥要按時吃喔。"],
      tip: "起身時慢一點，避免頭暈。",
    });
    expect(msg.title).toBe("早安，阿美 ☀️");
    expect(msg.body.split("\n")).toEqual([
      "昨天您記錄了 3 餐，做得很好，繼續保持！",
      "最近血壓 128/80，很穩定，真棒！",
      "💡起身時慢一點，避免頭暈。",
    ]);
  });
});

describe("byLatestActivity", () => {
  it("最近有在用的排前面", () => {
    const m = new Map([["a", "2026-10-01T00:00:00Z"], ["b", "2026-10-20T00:00:00Z"], ["c", "2026-10-10T00:00:00Z"]]);
    expect(byLatestActivity(m)).toEqual(["b", "c", "a"]);
  });
});
