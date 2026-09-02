import { describe, it, expect } from "vitest";
import { taiwanDayKey, taiwanDayStart } from "./health-connect";

describe("taiwanDay helpers", () => {
  it("taiwanDayKey 用 UTC+8 算日期", () => {
    // 2026-08-05 16:30 UTC = 台灣 08-06 00:30 → 應為 08-06
    const d = new Date("2026-08-05T16:30:00.000Z");
    expect(taiwanDayKey(d)).toBe("2026-08-06");
  });

  it("台灣白天仍屬同一天", () => {
    // 2026-08-05 02:00 UTC = 台灣 08-05 10:00
    const d = new Date("2026-08-05T02:00:00.000Z");
    expect(taiwanDayKey(d)).toBe("2026-08-05");
  });

  it("taiwanDayStart 對齊台灣 00:00", () => {
    const d = new Date("2026-08-05T10:00:00.000Z"); // 台灣 18:00
    const start = taiwanDayStart(d);
    expect(start.toISOString()).toBe("2026-08-04T16:00:00.000Z"); // 台灣 08-05 00:00
  });
});
