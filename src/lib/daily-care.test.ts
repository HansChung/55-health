import { describe, expect, it } from "vitest";
import { buildDailyCarePush, byLatestActivity, dailyCareChannel, dailyCareEmailMax, DAILY_CARE_EMAIL_MAX_DEFAULT } from "./daily-care";

describe("dailyCareChannel", () => {
  it("關掉的人什麼都不送", () => {
    expect(dailyCareChannel({ off: true, hasPush: true, weatherSentToday: false })).toBe("off");
    expect(dailyCareChannel({ off: true, hasPush: false, weatherSentToday: false })).toBe("off");
  });
  it("有推播就推播；今天天氣推播真的送到了才不再多推", () => {
    expect(dailyCareChannel({ off: false, hasPush: true, weatherSentToday: false })).toBe("push");
    expect(dailyCareChannel({ off: false, hasPush: true, weatherSentToday: true })).toBe("weather");
  });
  it("沒推播才寄 Email", () => {
    expect(dailyCareChannel({ off: false, hasPush: false, weatherSentToday: false })).toBe("email");
    // 記號還在但現在沒有訂閱了（例如剛清掉）→ 照樣寄
    expect(dailyCareChannel({ off: false, hasPush: false, weatherSentToday: true })).toBe("email");
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
