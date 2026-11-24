import { describe, it, expect } from "vitest";
import {
  birthdayDateLabel,
  birthdayHeadline,
  birthdayKeysFor,
  birthdayPush,
  birthdayWho,
  daysLeftLabel,
  homeBirthdays,
  lunarDayName,
  nextBirthday,
  normalizeBirthdayInput,
  rocToAd,
  sortBirthdays,
} from "./birthdays";
import { lunarOf } from "./lunar-calendar";

const solar = (month: number, day: number, birth_year: number | null = null) => ({ calendar: "solar" as const, month, day, birth_year });
const lunar = (month: number, day: number, birth_year: number | null = null) => ({ calendar: "lunar" as const, month, day, birth_year });

function addDays(date: string, n: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
}

describe("lunar labels", () => {
  it("names lunar days the way elders read them", () => {
    expect([1, 10, 11, 15, 20, 21, 29, 30].map(lunarDayName)).toEqual(["初一", "初十", "十一", "十五", "二十", "廿一", "廿九", "三十"]);
    expect(birthdayDateLabel({ calendar: "lunar", month: 1, day: 5 })).toBe("農曆正月初五");
    expect(birthdayDateLabel({ calendar: "lunar", month: 12, day: 30 })).toBe("農曆十二月三十");
    expect(birthdayDateLabel({ calendar: "solar", month: 12, day: 3 })).toBe("國曆 12 月 3 日");
  });
});

describe("nextBirthday", () => {
  it("solar: today, later this year, next year", () => {
    expect(nextBirthday(solar(11, 24), "2026-11-24")).toEqual({ date: "2026-11-24", days: 0, age: null });
    expect(nextBirthday(solar(11, 27, 1980), "2026-11-24")).toEqual({ date: "2026-11-27", days: 3, age: 46 });
    expect(nextBirthday(solar(11, 23, 1956), "2026-11-24")).toEqual({ date: "2027-11-23", days: 364, age: 71 });
    expect(nextBirthday(solar(1, 1), "2026-12-31")).toEqual({ date: "2027-01-01", days: 1, age: null });
  });
  it("solar: Feb 29 is kept on Feb 28 in common years", () => {
    expect(nextBirthday(solar(2, 29), "2027-01-01")?.date).toBe("2027-02-28");
    expect(nextBirthday(solar(2, 29), "2028-01-01")?.date).toBe("2028-02-29");
    expect(nextBirthday(solar(2, 29), "2027-03-01")?.date).toBe("2028-02-29");
  });
  it("lunar: finds the next solar date", () => {
    expect(nextBirthday(lunar(10, 16), "2026-11-24")).toEqual({ date: "2026-11-24", days: 0, age: null });
    expect(nextBirthday(lunar(1, 1), "2026-11-24")?.date).toBe("2027-02-06");
    expect(nextBirthday(lunar(8, 15), "2026-01-01")?.date).toBe("2026-09-25");
    // 剛過：要等明年
    expect(nextBirthday(lunar(10, 15), "2026-11-24")?.date).toBe("2027-11-12");
  });
  it("lunar: a leap month is skipped, and day 30 falls back to 29 in short months", () => {
    // 2025 閏六月：六月初一只算正常的六月（6/25），不是閏六月（7/25）
    expect(nextBirthday(lunar(6, 1), "2025-06-01")?.date).toBe("2025-06-25");
    expect(nextBirthday(lunar(6, 1), "2025-06-26")?.date).toBe("2026-07-14");
    // 2026 年的十二月只有 29 天（2027-02-05 是廿九、隔天就是正月初一）
    expect(nextBirthday(lunar(12, 30), "2026-11-24")?.date).toBe("2027-02-05");
    expect(nextBirthday(lunar(12, 29), "2026-11-24")?.date).toBe("2027-02-05");
  });
  it("age is only shown when it makes sense", () => {
    expect(nextBirthday(solar(12, 1, 2026), "2026-11-24")?.age).toBeNull(); // 還沒滿一歲
    expect(nextBirthday(solar(12, 1, 1946), "2026-11-24")?.age).toBe(80);
  });
});

describe("birthdayKeysFor (cron) agrees with nextBirthday", () => {
  it("every day of two years: whoever the keys select has a birthday that day, and nobody else", () => {
    let date = "2025-02-01";
    for (let i = 0; i < 730; i++, date = addDays(date, 1)) {
      const keys = birthdayKeysFor(date);
      for (const day of keys.solar.days) expect(nextBirthday(solar(keys.solar.month, day), date)?.days, `solar ${date}`).toBe(0);
      if (keys.lunar) for (const day of keys.lunar.days) expect(nextBirthday(lunar(keys.lunar.month, day), date)?.days, `lunar ${date}`).toBe(0);
      else expect(lunarOf(date)?.leap, date).toBe(true);
    }
  });
  it("every lunar birthday gets exactly one day in the coming year", () => {
    for (let month = 1; month <= 12; month++) {
      for (let day = 1; day <= 30; day++) {
        const next = nextBirthday(lunar(month, day), "2026-01-01");
        expect(next, `${month}/${day}`).not.toBeNull();
        expect(birthdayKeysFor(next!.date).lunar, `${month}/${day}`).toMatchObject({ month });
        expect(birthdayKeysFor(next!.date).lunar!.days).toContain(day);
      }
    }
  });
  it("Feb 28 of a common year also picks up Feb 29 birthdays", () => {
    expect(birthdayKeysFor("2027-02-28").solar).toEqual({ month: 2, days: [28, 29] });
    expect(birthdayKeysFor("2028-02-28").solar).toEqual({ month: 2, days: [28] });
    expect(birthdayKeysFor("2028-02-29").solar).toEqual({ month: 2, days: [29] });
  });
});

describe("normalizeBirthdayInput", () => {
  const now = new Date("2026-11-24T02:00:00Z");
  it("accepts a normal entry", () => {
    expect(normalizeBirthdayInput({ name: " 小美 ", relation: "女兒", calendar: "solar", month: 12, day: 3, birthYear: rocToAd(70) }, now)).toEqual({
      ok: true,
      value: { name: "小美", relation: "女兒", calendar: "solar", month: 12, day: 3, birthYear: 1981, remind: true },
    });
    expect(normalizeBirthdayInput({ name: "阿公", calendar: "lunar", month: "2", day: "30", birthYear: "", remind: false }, now)).toEqual({
      ok: true,
      value: { name: "阿公", relation: "", calendar: "lunar", month: 2, day: 30, birthYear: null, remind: false },
    });
  });
  it("explains what is wrong", () => {
    const err = (raw: unknown) => {
      const r = normalizeBirthdayInput(raw, now);
      return r.ok ? null : r.error;
    };
    expect(err(null)).toContain("誰的生日");
    expect(err({ name: "小美" })).toBe("請選幾月");
    expect(err({ name: "小美", month: 13, day: 1 })).toBe("請選幾月");
    expect(err({ name: "小美", month: 2 })).toBe("請選幾號");
    expect(err({ name: "小美", month: 2, day: 30 })).toBe("2 月沒有 30 號");
    expect(err({ name: "小美", calendar: "lunar", month: 2, day: 31 })).toContain("三十天");
    expect(err({ name: "小美", month: 2, day: 29 })).toBeNull();
    expect(err({ name: "小美", month: 4, day: 31 })).toBe("4 月沒有 31 號");
    expect(err({ name: "小美", month: 4, day: 1.5 })).toBe("請選幾號");
    expect(err({ name: "小美", month: 4, day: 1, birthYear: 2027 })).toContain("出生年");
    expect(err({ name: "小美", month: 4, day: 1, birthYear: 1899 })).toContain("出生年");
  });
  it("caps long text", () => {
    const r = normalizeBirthdayInput({ name: "一".repeat(40), relation: "二".repeat(40), month: 1, day: 1 }, now);
    expect(r.ok && [...r.value.name].length).toBe(20);
    expect(r.ok && [...r.value.relation].length).toBe(10);
  });
});

describe("labels and push text", () => {
  const b = { name: "小美", relation: "女兒", calendar: "solar" as const, month: 11, day: 27 };
  it("who / days left / headline", () => {
    expect(birthdayWho(b)).toBe("小美（女兒）");
    expect(birthdayWho({ name: "阿公", relation: null })).toBe("阿公");
    expect(birthdayWho({ name: "太太", relation: "太太" })).toBe("太太");
    expect([0, 1, 2, 3, 40].map(daysLeftLabel)).toEqual(["今天", "明天", "後天", "還有 3 天", "還有 40 天"]);
    expect(birthdayHeadline(b, 0)).toBe("今天是小美（女兒）的生日");
    expect(birthdayHeadline(b, 1)).toBe("明天是小美（女兒）的生日");
    expect(birthdayHeadline(b, 3)).toBe("再 3 天是小美（女兒）的生日");
  });
  it("push: ahead says which day, same day says what to do", () => {
    const ahead = birthdayPush(b, { date: "2026-11-27", days: 3, age: 46 });
    expect(ahead.title).toBe("🎂 再 3 天是小美（女兒）的生日");
    expect(ahead.body).toBe("11/27（五）。46 歲生日。可以先準備紅包、禮物，或做一支祝福影片");
    const day = birthdayPush(b, { date: "2026-11-27", days: 0, age: null });
    expect(day.title).toBe("🎂 今天是小美（女兒）的生日");
    expect(day.body).toBe("打個電話說聲生日快樂，或做一支祝福影片送過去");
    const lunarAhead = birthdayPush({ name: "阿公", relation: null, calendar: "lunar", month: 10, day: 19 }, { date: "2026-11-27", days: 3, age: null });
    expect(lunarAhead.body).toContain("11/27（五），農曆十月十九。");
  });
  it("sorting and the home list", () => {
    const list = [
      { name: "丙", remind: true, next: { date: "2027-01-01", days: 38, age: null } },
      { name: "乙", remind: true, next: { date: "2026-11-27", days: 3, age: null } },
      { name: "甲", remind: false, next: { date: "2026-11-24", days: 0, age: null } },
      { name: "丁", remind: true, next: null },
    ];
    expect(sortBirthdays(list).map((x) => x.name)).toEqual(["甲", "乙", "丙", "丁"]);
    expect(homeBirthdays(list).map((x) => x.name)).toEqual(["乙"]);
  });
});
