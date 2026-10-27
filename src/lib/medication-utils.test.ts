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
  // 「今天」是台北日期（手機和伺服器才會一樣），測試用明確的 UTC 時間，不受執行環境時區影響
  it("今天吃過回傳 true", () => {
    const now = new Date("2026-01-01T12:00:00Z"); // 台北 20:00
    expect(isTakenToday({ ...base, last_taken_at: "2026-01-01T01:00:00Z" }, now)).toBe(true); // 台北 09:00
  });
  it("昨天吃過今天回傳 false", () => {
    const now = new Date("2026-01-02T00:00:00Z"); // 台北 1/2 08:00
    expect(isTakenToday({ ...base, last_taken_at: "2026-01-01T01:00:00Z" }, now)).toBe(false);
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

describe("一天好幾次的藥：每一次分開記（台北日期）", () => {
  // 台北 2026-10-27 09:00
  const now = new Date("2026-10-27T01:00:00Z");
  const med: ProfileMedication = {
    name: "降血壓藥",
    added_at: "2026-10-01T00:00:00Z",
    reminder_enabled: true,
    reminder_times: ["08:00", "13:00", "19:00"],
  };

  it("吃了早上那顆，中午、晚上的提醒還在", async () => {
    const { markDoseTaken } = await import("./medication-utils");
    const after = markDoseTaken(med, "08:00", now);
    expect(getPendingMedicationReminders([after], now).map((r) => r.time)).toEqual(["13:00", "19:00"]);
    expect(isTakenToday(after, now)).toBe(false);
    expect(after.taken_today).toBe(false);
  });

  it("三次都吃了才算今天吃完；隔天重新開始", async () => {
    const { markDoseTaken } = await import("./medication-utils");
    let m = markDoseTaken(med, "08:00", now);
    m = markDoseTaken(m, "13:00", now);
    m = markDoseTaken(m, "19:00", now);
    expect(isTakenToday(m, now)).toBe(true);
    expect(m.taken_today).toBe(true);
    const tomorrow = new Date("2026-10-28T01:00:00Z");
    expect(isTakenToday(m, tomorrow)).toBe(false);
    expect(getPendingMedicationReminders([m], tomorrow)).toHaveLength(3);
  });

  it("連點兩次同一個時間不會重複", async () => {
    const { markDoseTaken } = await import("./medication-utils");
    const m = markDoseTaken(markDoseTaken(med, "08:00", now), "08:00", now);
    expect(m.taken_times).toEqual({ day: "2026-10-27", times: ["08:00"] });
  });

  it("time＝null 一次標記今天全部（慢性病頁的「標記今天已吃」）", async () => {
    const { markDoseTaken } = await import("./medication-utils");
    expect(isTakenToday(markDoseTaken(med, null, now), now)).toBe(true);
  });

  it("用台北日期：台北凌晨 1 點（UTC 前一天 17:00）吃的算今天", async () => {
    const { markDoseTaken, takenTimesToday } = await import("./medication-utils");
    const early = new Date("2026-10-26T17:00:00Z"); // 台北 10/27 01:00
    const m = markDoseTaken(med, "08:00", early);
    expect(takenTimesToday(m, now)).toEqual(["08:00"]);
  });

  it("舊資料只有 last_taken_at：照以前的意思算整天吃過", async () => {
    const { takenTimesToday } = await import("./medication-utils");
    const legacy = { ...med, last_taken_at: "2026-10-27T00:30:00Z", taken_today: true };
    expect(takenTimesToday(legacy, now)).toEqual(["08:00", "13:00", "19:00"]);
    expect(isTakenToday(legacy, new Date("2026-10-28T01:00:00Z"))).toBe(false);
  });

  it("sameMedication：名字和加入時間都一樣才是同一顆", async () => {
    const { sameMedication } = await import("./medication-utils");
    expect(sameMedication(med, { name: "降血壓藥", added_at: "2026-10-01T00:00:00Z" })).toBe(true);
    expect(sameMedication(med, { name: "降血壓藥", added_at: "2026-10-02T00:00:00Z" })).toBe(false);
    expect(sameMedication({ name: "A" }, { name: "A" })).toBe(true);
  });
});
