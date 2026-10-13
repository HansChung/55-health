import { describe, expect, it } from "vitest";
import type { HealthMetric } from "@/lib/api-client";
import {
  bpLevel,
  bpLines,
  chartPoints,
  dailyAverage,
  glucoseLevel,
  glucoseLines,
  partOfDay,
  splitPeriods,
  summarizeBp,
  summarizeGlucose,
  summarizeWeight,
  weightLines,
} from "./health-trends";

const NOW = new Date("2026-10-13T04:00:00Z"); // 台北 12:00
const DAY = 86400_000;

let seq = 0;
function m(over: Partial<HealthMetric> & { daysAgo: number; hourTaipei?: number }): HealthMetric {
  const base = new Date(NOW.getTime() - over.daysAgo * DAY);
  const day = new Date(base.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
  const measured = new Date(`${day}T${String(over.hourTaipei ?? 8).padStart(2, "0")}:00:00+08:00`).toISOString();
  return {
    id: String(seq++), user_id: "u", metric_type: "blood_pressure", measured_at: measured,
    weight_kg: null, systolic: null, diastolic: null, pulse: null, glucose_mg_dl: null, glucose_context: null, notes: null,
    ...over,
  } as HealthMetric;
}

describe("levels", () => {
  it("classifies blood pressure", () => {
    expect(bpLevel(142, 80)).toBe("high");
    expect(bpLevel(120, 91)).toBe("high");
    expect(bpLevel(132, 80)).toBe("warn");
    expect(bpLevel(85, 55)).toBe("low");
    expect(bpLevel(118, 76)).toBe("normal");
  });
  it("classifies glucose by context", () => {
    expect(glucoseLevel(65, "after_meal")).toBe("low");
    expect(glucoseLevel(130, "fasting")).toBe("high");
    expect(glucoseLevel(105, "before_meal")).toBe("warn");
    expect(glucoseLevel(150, "after_meal")).toBe("warn");
    expect(glucoseLevel(210, "after_meal")).toBe("high");
    expect(glucoseLevel(150, "bedtime")).toBeNull();
  });
  it("part of day uses Taipei time", () => {
    expect(partOfDay("2026-10-13T00:00:00Z")).toBe("morning"); // 08:00
    expect(partOfDay("2026-10-13T13:00:00Z")).toBe("evening"); // 21:00
    expect(partOfDay("2026-10-13T06:00:00Z")).toBe("other"); // 14:00
  });
});

describe("splitPeriods", () => {
  it("splits into current and previous ranges", () => {
    const list = [m({ daysAgo: 1 }), m({ daysAgo: 8 }), m({ daysAgo: 20 })];
    const { current, previous } = splitPeriods(list, 7, NOW);
    expect(current).toHaveLength(1);
    expect(previous).toHaveLength(1);
  });
});

describe("summarizeBp", () => {
  it("averages, counts levels, compares with the previous period and splits morning/evening", () => {
    const list = [
      ...[1, 2, 3].map((d) => m({ daysAgo: d, hourTaipei: 7, systolic: 140, diastolic: 88 })),
      ...[1, 2, 3].map((d) => m({ daysAgo: d, hourTaipei: 21, systolic: 120, diastolic: 76 })),
      ...[8, 9, 10].map((d) => m({ daysAgo: d, systolic: 140, diastolic: 90 })),
    ];
    const s = summarizeBp(list, 7, NOW)!;
    expect(s).toMatchObject({ count: 6, days: 3, avgSys: 130, avgDia: 82, maxSys: 140, minSys: 120, diffSys: -10 });
    expect(s.levels).toEqual({ high: 3, warn: 0, normal: 3, low: 0 });
    expect(s.morning).toEqual({ count: 3, avgSys: 140, avgDia: 88 });
    expect(s.evening).toEqual({ count: 3, avgSys: 120, avgDia: 76 });
    const lines = bpLines(s, 7);
    expect(lines[0]).toBe("這 7 天量了 6 次（3 天有量），平均 130/82。");
    expect(lines).toContain("比前 7 天收縮壓平均低 10。");
    expect(lines).toContain("3 次在 140/90 以上。");
    expect(lines).toContain("早上平均 140/88，晚上平均 120/76。");
  });
  it("no comparison with too few previous readings; praises all-normal", () => {
    const s = summarizeBp([m({ daysAgo: 1, systolic: 118, diastolic: 75 }), m({ daysAgo: 9, systolic: 150, diastolic: 95 })], 7, NOW)!;
    expect(s.diffSys).toBeNull();
    expect(bpLines(s, 7)).toContain("每一次都在正常範圍，很穩定 👍");
  });
  it("returns null without readings in range", () => {
    expect(summarizeBp([m({ daysAgo: 40, systolic: 120, diastolic: 80 })], 30, NOW)).toBeNull();
  });
});

describe("summarizeGlucose", () => {
  it("groups by context and flags lows", () => {
    const list = [
      ...[1, 2, 3].map((d) => m({ daysAgo: d, metric_type: "blood_glucose", glucose_mg_dl: 110, glucose_context: "fasting" })),
      m({ daysAgo: 1, metric_type: "blood_glucose", glucose_mg_dl: 160, glucose_context: "after_meal" }),
      m({ daysAgo: 2, metric_type: "blood_glucose", glucose_mg_dl: 65, glucose_context: "bedtime" }),
      ...[8, 9, 10].map((d) => m({ daysAgo: d, metric_type: "blood_glucose", glucose_mg_dl: 95, glucose_context: "fasting" })),
    ];
    const s = summarizeGlucose(list, 7, NOW)!;
    expect(s.count).toBe(5);
    expect(s.lows).toBe(1);
    expect(s.byContext.map((c) => [c.label, c.count, c.avg, c.diff])).toEqual([
      ["空腹", 3, 110, 15],
      ["飯後", 1, 160, null],
      ["睡前", 1, 65, null],
    ]);
    const lines = glucoseLines(s, 7);
    expect(lines).toContain("空腹 3 次，平均 110；飯後 1 次，平均 160；睡前 1 次，平均 65。");
    expect(lines).toContain("空腹比前 7 天平均高 15。");
    expect(lines).toContain("空腹有 3 次在 100 以上。");
    expect(lines).toContain("飯後有 1 次在 140 以上。");
    expect(lines.some((l) => l.includes("1 次低於 70"))).toBe(true);
  });
});

describe("weight and chart", () => {
  it("weight change", () => {
    const s = summarizeWeight([
      m({ daysAgo: 20, metric_type: "weight", weight_kg: 62.5 }),
      m({ daysAgo: 1, metric_type: "weight", weight_kg: 61.8 }),
    ], 30, NOW)!;
    expect(s.change).toBe(-0.7);
    expect(weightLines(s, 30)[0]).toBe("這 30 天量了 2 次，從 62.5 變成 61.8 公斤（少 0.7 公斤）。");
  });
  it("chart points are time-ordered and only the requested kind", () => {
    const pts = chartPoints("blood_pressure", [
      m({ daysAgo: 1, systolic: 130, diastolic: 80 }),
      m({ daysAgo: 3, systolic: 120, diastolic: 70 }),
      m({ daysAgo: 2, metric_type: "weight", weight_kg: 60 }),
    ], 7, NOW);
    expect(pts.map((p) => p.label)).toEqual(["120/70", "130/80"]);
    expect(pts[1].level).toBe("warn");
  });
});

describe("dailyAverage", () => {
  it("averages readings of the same Taipei day", () => {
    const pts = chartPoints("blood_pressure", [
      m({ daysAgo: 1, hourTaipei: 7, systolic: 140, diastolic: 90 }),
      m({ daysAgo: 1, hourTaipei: 21, systolic: 120, diastolic: 80 }),
      m({ daysAgo: 2, hourTaipei: 7, systolic: 118, diastolic: 76 }),
    ], 7, NOW);
    const d = dailyAverage("blood_pressure", pts);
    expect(d.map((p) => p.label)).toEqual(["118/76", "平均 130/85（2 次）"]);
    expect(d[1].level).toBe("warn");
  });
  it("glucose daily average has no level (mixed fasting/after meal)", () => {
    const pts = chartPoints("blood_glucose", [
      m({ daysAgo: 1, metric_type: "blood_glucose", glucose_mg_dl: 100, glucose_context: "fasting" }),
      m({ daysAgo: 1, hourTaipei: 13, metric_type: "blood_glucose", glucose_mg_dl: 160, glucose_context: "after_meal" }),
    ], 7, NOW);
    expect(dailyAverage("blood_glucose", pts)[0]).toMatchObject({ values: [130], level: null, label: "平均 130（2 次）" });
  });
});
