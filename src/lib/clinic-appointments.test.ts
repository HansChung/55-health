import { describe, expect, it } from "vitest";
import {
  appointmentDayLabel,
  appointmentFamilyPush,
  appointmentPush,
  appointmentTimeLabel,
  normalizeAppointmentInput,
  parseReminderKind,
  relativeDayLabel,
  sortAppointments,
  taipeiDate,
  type ClinicAppointment,
} from "./clinic-appointments";

// 2026-10-13 23:30 台北（UTC 15:30）
const NOW = new Date("2026-10-13T15:30:00Z");

const appt = (over: Partial<ClinicAppointment> = {}): ClinicAppointment => ({
  id: "a", kind: "visit", appt_date: "2026-10-20", appt_time: "09:30", hospital: "台大醫院", department: "心臟科",
  note: null, notify_family: true, ...over,
});

describe("taipeiDate", () => {
  it("uses Taipei time", () => {
    expect(taipeiDate(new Date("2026-10-13T16:30:00Z"))).toBe("2026-10-14");
    expect(taipeiDate(NOW, 1)).toBe("2026-10-14");
  });
});

describe("normalizeAppointmentInput", () => {
  it("accepts a valid appointment and cleans fields", () => {
    const r = normalizeAppointmentInput({ kind: "visit", date: "2026-10-20", time: "9:05", hospital: "  台大   醫院 ", department: "心臟科", note: "", notifyFamily: false }, NOW);
    expect(r).toEqual({ ok: true, value: { kind: "visit", date: "2026-10-20", time: "09:05", hospital: "台大 醫院", department: "心臟科", note: "", notifyFamily: false } });
  });
  it("defaults kind to visit and notifyFamily to true, time optional", () => {
    const r = normalizeAppointmentInput({ kind: "x", date: "2026-10-13" }, NOW);
    expect(r.ok && r.value).toMatchObject({ kind: "visit", time: null, notifyFamily: true });
  });
  it("rejects past, far-future, invalid dates and bad times", () => {
    expect(normalizeAppointmentInput({ date: "2026-10-12" }, NOW).ok).toBe(false);
    expect(normalizeAppointmentInput({ date: "2028-01-01" }, NOW).ok).toBe(false);
    expect(normalizeAppointmentInput({ date: "2026-02-30" }, NOW).ok).toBe(false);
    expect(normalizeAppointmentInput({ date: "2026-10-20", time: "25:00" }, NOW).ok).toBe(false);
    expect(normalizeAppointmentInput({ date: "2026-10-20", time: "noon" }, NOW).ok).toBe(false);
  });
});

describe("labels", () => {
  it("formats day and time", () => {
    expect(appointmentDayLabel("2026-10-20")).toBe("10/20（二）");
    expect(appointmentTimeLabel("09:30")).toBe("上午 9:30");
    expect(appointmentTimeLabel("12:15")).toBe("中午 12:15");
    expect(appointmentTimeLabel("14:00")).toBe("下午 2:00");
    expect(appointmentTimeLabel("19:00")).toBe("晚上 7:00");
    expect(appointmentTimeLabel(null)).toBe("");
  });
  it("relative day", () => {
    expect(relativeDayLabel("2026-10-13", NOW)).toBe("今天");
    expect(relativeDayLabel("2026-10-14", NOW)).toBe("明天");
    expect(relativeDayLabel("2026-10-15", NOW)).toBe("後天");
    expect(relativeDayLabel("2026-10-20", NOW)).toBe("10/20（二）");
  });
});

describe("push texts", () => {
  it("elder push mentions day, time, place and what to bring", () => {
    const p = appointmentPush(appt({ note: "要空腹抽血" }), "day_before");
    expect(p.title).toBe("🩺 明天 上午 9:30 要到台大醫院 心臟科回診");
    expect(p.body).toContain("健保卡");
    expect(p.body).toContain("要空腹抽血");
  });
  it("refill without place or time", () => {
    const p = appointmentPush(appt({ kind: "refill", hospital: null, department: null, appt_time: null }), "same_day");
    expect(p.title).toBe("💊 今天要領慢箋藥");
    expect(p.body).toContain("慢性處方箋");
  });
  it("family push names the elder", () => {
    expect(appointmentFamilyPush(appt(), "day_before", "王阿嬤").title).toBe("王阿嬤明天 上午 9:30 要到台大醫院 心臟科回診");
  });
});

describe("misc", () => {
  it("parses reminder kind", () => {
    expect(parseReminderKind("day_before")).toBe("day_before");
    expect(parseReminderKind("x")).toBeNull();
  });
  it("sorts by date then time, untimed last", () => {
    const list = sortAppointments([
      appt({ id: "c", appt_date: "2026-10-21", appt_time: "08:00" }),
      appt({ id: "b", appt_date: "2026-10-20", appt_time: null }),
      appt({ id: "a", appt_date: "2026-10-20", appt_time: "14:00" }),
    ]);
    expect(list.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
});
