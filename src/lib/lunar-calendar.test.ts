import { describe, it, expect } from "vitest";
import { LUNAR_FIRST_YEAR, LUNAR_LAST_YEAR, lunarOf, lunarToSolar } from "./lunar-calendar";

function addDays(date: string, n: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
}

describe("lunar calendar table", () => {
  it("official Lunar New Year dates (incl. the two ICU gets wrong: 2027, 2030)", () => {
    const newYears = ["2024-02-10", "2025-01-29", "2026-02-17", "2027-02-06", "2028-01-26", "2029-02-13", "2030-02-03", "2031-01-23", "2032-02-11", "2033-01-31", "2034-02-19", "2035-02-08"];
    for (const d of newYears) {
      expect(lunarOf(d), d).toMatchObject({ year: Number(d.slice(0, 4)), month: 1, day: 1, leap: false });
      expect(lunarToSolar(Number(d.slice(0, 4)), 1, 1)).toBe(d);
      // 前一天是除夕（十二月的最後一天）
      const eve = lunarOf(addDays(d, -1));
      if (eve) expect(eve.month === 12 && eve.day === eve.monthDays, d).toBe(true);
    }
  });
  it("festivals", () => {
    expect(lunarOf("2026-09-25")).toMatchObject({ month: 8, day: 15 }); // 中秋
    expect(lunarOf("2027-09-15")).toMatchObject({ month: 8, day: 15 });
    expect(lunarOf("2026-06-19")).toMatchObject({ month: 5, day: 5 }); // 端午
    expect(lunarOf("2027-06-09")).toMatchObject({ month: 5, day: 5 });
    expect(lunarOf("2026-11-24")).toMatchObject({ year: 2026, month: 10, day: 16, leap: false });
  });
  it("leap months", () => {
    expect(lunarOf("2025-07-25")).toMatchObject({ month: 6, day: 1, leap: true }); // 閏六月
    expect(lunarOf("2025-06-25")).toMatchObject({ month: 6, day: 1, leap: false });
    expect(lunarOf("2033-12-22")).toMatchObject({ month: 11, day: 1, leap: true }); // 閏十一月
    // 閏月那一年，農曆日期 → 國曆 只給正常的那個月
    expect(lunarToSolar(2025, 6, 1)).toBe("2025-06-25");
    expect(lunarToSolar(2025, 7, 1)).toBe("2025-08-23");
  });
  it("each year in the table is exactly as long as the gap to the next New Year", () => {
    for (let y = LUNAR_FIRST_YEAR; y < LUNAR_LAST_YEAR; y++) {
      const first = lunarToSolar(y, 1, 1)!;
      const next = lunarToSolar(y + 1, 1, 1)!;
      const lastDay = lunarOf(addDays(next, -1))!;
      expect(lastDay.year, String(y)).toBe(y);
      expect(lastDay.month === 12 && lastDay.day === lastDay.monthDays, String(y)).toBe(true);
      const days = Math.round((Date.parse(next) - Date.parse(first)) / 86400_000);
      expect(days === 353 || days === 354 || days === 355 || days === 383 || days === 384 || days === 385, `${y}: ${days}`).toBe(true);
    }
  });
  it("round trip for every non-leap day, and days run 1..29/30 without gaps", () => {
    let date = "2024-02-10";
    let prev = lunarOf(date)!;
    for (let i = 1; i < 365 * 20; i++) {
      date = addDays(date, 1);
      const l = lunarOf(date)!;
      expect(l, date).not.toBeNull();
      if (l.day === 1) expect(prev.day, date).toBe(prev.monthDays);
      else expect(l.day, date).toBe(prev.day + 1);
      if (!l.leap) expect(lunarToSolar(l.year, l.month, l.day), date).toBe(date);
      prev = l;
    }
  });
  it("day 30 in a 29-day month falls on the last day; out of range is null", () => {
    expect(lunarOf("2027-02-05")).toMatchObject({ month: 12, day: 29, monthDays: 29 });
    expect(lunarToSolar(2026, 12, 30)).toBe("2027-02-05");
    expect(lunarOf("2023-12-31")).toBeNull();
    expect(lunarOf("2101-03-01")).toBeNull();
    expect(lunarOf("oops")).toBeNull();
    expect(lunarToSolar(2101, 1, 1)).toBeNull();
    expect(lunarToSolar(2026, 13, 1)).toBeNull();
  });
});
