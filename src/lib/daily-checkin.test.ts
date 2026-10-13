import { describe, expect, it } from "vitest";
import {
  checkinFamilyAlertPush,
  checkinFamilyRelievedPush,
  checkinSetting,
  checkinState,
  deadlineLabel,
  parseCheckinCronParams,
  taipeiClock,
  taipeiDay,
} from "./daily-checkin";

describe("每日平安打卡", () => {
  it("設定：沒有或不對就用預設（關、中午 12 點）", () => {
    expect(checkinSetting(undefined)).toEqual({ on: false, deadline: 12 });
    expect(checkinSetting({ on: true, deadline: 9 })).toEqual({ on: true, deadline: 9 });
    expect(checkinSetting({ on: true, deadline: "15" })).toEqual({ on: true, deadline: 15 });
    expect(checkinSetting({ on: "yes", deadline: 7 })).toEqual({ on: false, deadline: 12 });
  });

  it("台北日期、時間（UTC 16:00 已經是台北隔天 0 點）", () => {
    expect(taipeiDay(new Date("2026-10-12T16:30:00Z"))).toBe("2026-10-13");
    expect(taipeiClock("2026-10-13T00:15:00Z")).toBe("8:15");
    expect(deadlineLabel(9)).toBe("早上 9 點");
    expect(deadlineLabel(12)).toBe("中午 12 點");
    expect(deadlineLabel(15)).toBe("下午 3 點");
    expect(deadlineLabel(18)).toBe("晚上 6 點");
  });

  it("今天的狀態", () => {
    const on = { on: true, deadline: 12 as const };
    expect(checkinState(on, "2026-10-13T00:15:00Z")).toBe("done");
    expect(checkinState(on, null, new Date("2026-10-13T03:59:00Z"))).toBe("waiting"); // 台北 11:59
    expect(checkinState(on, null, new Date("2026-10-13T04:00:00Z"))).toBe("late"); // 台北 12:00
    expect(checkinState({ on: false, deadline: 12 }, null, new Date("2026-10-13T10:00:00Z"))).toBe("waiting");
  });

  it("推播文字", () => {
    expect(checkinFamilyAlertPush({ elderName: "王阿嬤", deadline: 12 }).body).toContain("中午 12 點");
    expect(checkinFamilyRelievedPush({ elderName: "王阿嬤", checkedAt: "2026-10-13T05:20:00Z" }).body).toContain("13:20");
  });

  it("排程參數", () => {
    expect(parseCheckinCronParams("remind", "9")).toEqual({ step: "remind", slot: 9 });
    expect(parseCheckinCronParams("alert", "18")).toEqual({ step: "alert", slot: 18 });
    expect(parseCheckinCronParams("alert", "10")).toBeNull();
    expect(parseCheckinCronParams("boom", "12")).toBeNull();
  });
});
