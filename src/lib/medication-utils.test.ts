import { describe, it, expect } from "vitest";
import {
  inferMedicationReminderTimes,
  isSameLocalDay,
  isTakenToday,
  getPendingMedicationReminders,
} from "./medication-utils";
import type { ProfileMedication } from "./api-client";

describe("inferMedicationReminderTimes", () => {
  it("從「早餐後」推出早上時段", () => {
    expect(inferMedicationReminderTimes("早餐後服用")).toEqual(["08:00"]);
  });

  it("從「早晚」推出兩個時段", () => {
    expect(inferMedicationReminderTimes("早餐後、晚餐後")).toEqual(["08:00", "19:00"]);
  });

  it("睡前", () => {
    expect(inferMedicationReminderTimes("睡前一顆")).toEqual(["21:30"]);
  });

  it("「一天三次」展開成三餐", () => {
    expect(inferMedicationReminderTimes("一天三次")).toEqual(["08:00", "13:00", "19:00"]);
  });

  it("「2次」展開成早晚", () => {
    expect(inferMedicationReminderTimes("一日2次")).toEqual(["08:00", "19:00"]);
  });

  it("無法判斷時預設早上一次", () => {
    expect(inferMedicationReminderTimes("需要時服用")).toEqual(["08:00"]);
  });

  it("重複關鍵字不會重覆時段", () => {
    expect(inferMedicationReminderTimes("早上 早餐 morning")).toEqual(["08:00"]);
  });
});

describe("isSameLocalDay", () => {
  it("同一天回傳 true", () => {
    expect(isSameLocalDay(new Date(2026, 0, 1, 8), new Date(2026, 0, 1, 23))).toBe(true);
  });
  it("不同天回傳 false", () => {
    expect(isSameLocalDay(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false);
  });
});

describe("isTakenToday", () => {
  const base: ProfileMedication = { name: "A", added_at: "x" } as ProfileMedication;
  it("沒吃過回傳 false", () => {
    expect(isTakenToday({ ...base })).toBe(false);
  });
  it("今天吃過回傳 true", () => {
    const now = new Date(2026, 0, 1, 20);
    expect(isTakenToday({ ...base, last_taken_at: new Date(2026, 0, 1, 9).toISOString() }, now)).toBe(true);
  });
  it("昨天吃過今天回傳 false", () => {
    const now = new Date(2026, 0, 2, 8);
    expect(isTakenToday({ ...base, last_taken_at: new Date(2026, 0, 1, 9).toISOString() }, now)).toBe(false);
  });
});

describe("getPendingMedicationReminders", () => {
  const now = new Date(2026, 0, 2, 8);
  const med = (over: Partial<ProfileMedication>): ProfileMedication =>
    ({ name: "藥", added_at: "x", reminder_enabled: true, reminder_times: ["08:00"], ...over } as ProfileMedication);

  it("關閉提醒的藥不出現", () => {
    expect(getPendingMedicationReminders([med({ reminder_enabled: false })], now)).toHaveLength(0);
  });

  it("沒有提醒時間的藥不出現", () => {
    expect(getPendingMedicationReminders([med({ reminder_times: [] })], now)).toHaveLength(0);
  });

  it("今天已吃的藥不出現", () => {
    const taken = med({ last_taken_at: new Date(2026, 0, 2, 7).toISOString() });
    expect(getPendingMedicationReminders([taken], now)).toHaveLength(0);
  });

  it("多時段展開並依時間排序", () => {
    const m = med({ reminder_times: ["19:00", "08:00"] });
    const result = getPendingMedicationReminders([m], now);
    expect(result.map((r) => r.time)).toEqual(["08:00", "19:00"]);
  });
});
