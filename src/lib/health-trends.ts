// ────────────────────────────────────────────────
// 血壓、血糖、體重趨勢（前後端共用，純計算，不靠模型）
// 最近 N 天的平均、高低次數、早晚差別，和前 N 天比；最後寫成幾句白話。只整理數字，不診斷
// 時間一律用台北時間（早上／晚上、哪一天）
// ────────────────────────────────────────────────

import type { HealthMetric } from "@/lib/api-client";

export const TREND_RANGES = [7, 30, 90] as const;
export type TrendRange = (typeof TREND_RANGES)[number];

export type MetricKind = "weight" | "blood_pressure" | "blood_glucose";
export type GlucoseContext = "fasting" | "before_meal" | "after_meal" | "bedtime";

export type Level = "high" | "warn" | "normal" | "low";

export const LEVEL_META: Record<Level, { label: string; color: string }> = {
  high: { label: "偏高", color: "#C95B6E" },
  warn: { label: "偏高警戒", color: "#D9A441" },
  normal: { label: "正常", color: "#7AA779" },
  low: { label: "偏低", color: "#5BA0C9" },
};

export const GLUCOSE_CONTEXTS: { id: GlucoseContext; label: string }[] = [
  { id: "fasting", label: "空腹" },
  { id: "before_meal", label: "飯前" },
  { id: "after_meal", label: "飯後" },
  { id: "bedtime", label: "睡前" },
];

/** 血壓分級（和健康紀錄畫面原本的標準一樣） */
export function bpLevel(systolic: number, diastolic: number): Level {
  if (systolic >= 140 || diastolic >= 90) return "high";
  if (systolic >= 130 || diastolic >= 85) return "warn";
  if (systolic < 90 || diastolic < 60) return "low";
  return "normal";
}

/** 血糖分級；睡前（或沒寫什麼時候量的）只看有沒有太低 */
export function glucoseLevel(value: number, context: GlucoseContext | null): Level | null {
  if (value < 70) return "low";
  if (context === "fasting" || context === "before_meal") {
    if (value >= 126) return "high";
    if (value >= 100) return "warn";
    return "normal";
  }
  if (context === "after_meal") {
    if (value >= 200) return "high";
    if (value >= 140) return "warn";
    return "normal";
  }
  return null;
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

/** 台北日期 YYYY-MM-DD */
export function taipeiDay(iso: string): string {
  return new Date(new Date(iso).getTime() + 8 * HOUR).toISOString().slice(0, 10);
}

function taipeiHour(iso: string): number {
  return new Date(new Date(iso).getTime() + 8 * HOUR).getUTCHours();
}

/** 早上（4～11 點）／晚上（18 點以後、凌晨 4 點前） */
export function partOfDay(iso: string): "morning" | "evening" | "other" {
  const h = taipeiHour(iso);
  if (h >= 4 && h < 11) return "morning";
  if (h >= 18 || h < 4) return "evening";
  return "other";
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

const round = (n: number) => Math.round(n);
const round1 = (n: number) => Math.round(n * 10) / 10;

/** 分成這一段（最近 rangeDays 天）和前一段（再往前 rangeDays 天） */
export function splitPeriods<T extends Pick<HealthMetric, "measured_at">>(
  metrics: T[],
  rangeDays: number,
  now: Date = new Date()
): { current: T[]; previous: T[] } {
  const end = now.getTime();
  const start = end - rangeDays * DAY;
  const prevStart = start - rangeDays * DAY;
  const current: T[] = [];
  const previous: T[] = [];
  for (const m of metrics) {
    const t = new Date(m.measured_at).getTime();
    if (t > end) continue;
    if (t >= start) current.push(m);
    else if (t >= prevStart) previous.push(m);
  }
  const byTime = (a: T, b: T) => a.measured_at.localeCompare(b.measured_at);
  return { current: current.sort(byTime), previous: previous.sort(byTime) };
}

/** 至少幾次才拿來比較（太少次比出來的不準） */
export const MIN_COMPARE = 3;

export interface BpSummary {
  count: number;
  days: number;
  avgSys: number;
  avgDia: number;
  maxSys: number;
  minSys: number;
  levels: Record<Level, number>;
  morning: { count: number; avgSys: number; avgDia: number } | null;
  evening: { count: number; avgSys: number; avgDia: number } | null;
  /** 這一段平均減前一段平均（前一段太少次就是 null） */
  diffSys: number | null;
  diffDia: number | null;
}

type BpReading = Pick<HealthMetric, "measured_at" | "systolic" | "diastolic">;

function bpOnly<T extends BpReading>(list: T[]): (T & { systolic: number; diastolic: number })[] {
  return list.filter((m): m is T & { systolic: number; diastolic: number } => m.systolic != null && m.diastolic != null);
}

function partAvg(list: { systolic: number; diastolic: number }[]) {
  return list.length >= MIN_COMPARE
    ? { count: list.length, avgSys: round(avg(list.map((m) => m.systolic))), avgDia: round(avg(list.map((m) => m.diastolic))) }
    : null;
}

export function summarizeBp(metrics: BpReading[], rangeDays: number, now: Date = new Date()): BpSummary | null {
  const { current, previous } = splitPeriods(bpOnly(metrics), rangeDays, now);
  if (current.length === 0) return null;
  const levels: Record<Level, number> = { high: 0, warn: 0, normal: 0, low: 0 };
  for (const m of current) levels[bpLevel(m.systolic, m.diastolic)]++;
  const sys = current.map((m) => m.systolic);
  const dia = current.map((m) => m.diastolic);
  const avgSys = round(avg(sys));
  const avgDia = round(avg(dia));
  const prev = bpOnly(previous);
  return {
    count: current.length,
    days: new Set(current.map((m) => taipeiDay(m.measured_at))).size,
    avgSys,
    avgDia,
    maxSys: Math.max(...sys),
    minSys: Math.min(...sys),
    levels,
    morning: partAvg(current.filter((m) => partOfDay(m.measured_at) === "morning")),
    evening: partAvg(current.filter((m) => partOfDay(m.measured_at) === "evening")),
    diffSys: prev.length >= MIN_COMPARE ? avgSys - round(avg(prev.map((m) => m.systolic))) : null,
    diffDia: prev.length >= MIN_COMPARE ? avgDia - round(avg(prev.map((m) => m.diastolic))) : null,
  };
}

export interface GlucoseContextSummary {
  context: GlucoseContext | null;
  label: string;
  count: number;
  avg: number;
  levels: Record<Level, number>;
  diff: number | null;
}

export interface GlucoseSummary {
  count: number;
  days: number;
  lows: number;
  byContext: GlucoseContextSummary[];
}

type GlucoseReading = Pick<HealthMetric, "measured_at" | "glucose_mg_dl" | "glucose_context">;

export function summarizeGlucose(metrics: GlucoseReading[], rangeDays: number, now: Date = new Date()): GlucoseSummary | null {
  const only = metrics.filter((m): m is GlucoseReading & { glucose_mg_dl: number } => m.glucose_mg_dl != null);
  const { current, previous } = splitPeriods(only, rangeDays, now);
  if (current.length === 0) return null;
  const groups: (GlucoseContext | null)[] = [...GLUCOSE_CONTEXTS.map((c) => c.id), null];
  const byContext: GlucoseContextSummary[] = [];
  for (const ctx of groups) {
    const list = current.filter((m) => (m.glucose_context ?? null) === ctx);
    if (list.length === 0) continue;
    const levels: Record<Level, number> = { high: 0, warn: 0, normal: 0, low: 0 };
    for (const m of list) {
      const l = glucoseLevel(m.glucose_mg_dl, ctx);
      if (l) levels[l]++;
    }
    const a = round(avg(list.map((m) => m.glucose_mg_dl)));
    const prev = previous.filter((m) => (m.glucose_context ?? null) === ctx);
    byContext.push({
      context: ctx,
      label: GLUCOSE_CONTEXTS.find((c) => c.id === ctx)?.label ?? "其他",
      count: list.length,
      avg: a,
      levels,
      diff: prev.length >= MIN_COMPARE && list.length >= MIN_COMPARE ? a - round(avg(prev.map((m) => m.glucose_mg_dl))) : null,
    });
  }
  return {
    count: current.length,
    days: new Set(current.map((m) => taipeiDay(m.measured_at))).size,
    lows: current.filter((m) => m.glucose_mg_dl < 70).length,
    byContext,
  };
}

export interface WeightSummary {
  count: number;
  first: number;
  last: number;
  change: number;
}

type WeightReading = Pick<HealthMetric, "measured_at" | "weight_kg">;

export function summarizeWeight(metrics: WeightReading[], rangeDays: number, now: Date = new Date()): WeightSummary | null {
  const only = metrics.filter((m) => m.weight_kg != null && Number(m.weight_kg) > 0);
  const { current } = splitPeriods(only, rangeDays, now);
  if (current.length === 0) return null;
  const first = Number(current[0].weight_kg);
  const last = Number(current[current.length - 1].weight_kg);
  return { count: current.length, first, last, change: round1(last - first) };
}

function compareText(diff: number | null, rangeDays: number, unit: string, same: number): string | null {
  if (diff === null) return null;
  if (Math.abs(diff) < same) return `和前 ${rangeDays} 天差不多。`;
  return `比前 ${rangeDays} 天平均${diff > 0 ? "高" : "低"} ${Math.abs(diff)}${unit}。`;
}

/** 血壓白話摘要 */
export function bpLines(s: BpSummary, rangeDays: number): string[] {
  const lines = [`這 ${rangeDays} 天量了 ${s.count} 次（${s.days} 天有量），平均 ${s.avgSys}/${s.avgDia}。`];
  const cmp = compareText(s.diffSys, rangeDays, "", 3);
  if (cmp) lines.push(cmp.replace("平均", "收縮壓平均"));
  if (s.levels.high === 0 && s.levels.warn === 0 && s.levels.low === 0) {
    lines.push("每一次都在正常範圍，很穩定 👍");
  } else {
    const parts: string[] = [];
    if (s.levels.high) parts.push(`${s.levels.high} 次在 140/90 以上`);
    if (s.levels.warn) parts.push(`${s.levels.warn} 次在 130/85～139/89`);
    if (s.levels.low) parts.push(`${s.levels.low} 次低於 90/60`);
    lines.push(`${parts.join("，")}。`);
  }
  if (s.morning && s.evening) {
    lines.push(`早上平均 ${s.morning.avgSys}/${s.morning.avgDia}，晚上平均 ${s.evening.avgSys}/${s.evening.avgDia}。`);
  }
  if (s.levels.low) lines.push("量到偏低又頭暈的話，先坐下或躺下休息。");
  return lines;
}

/** 血糖白話摘要 */
export function glucoseLines(s: GlucoseSummary, rangeDays: number): string[] {
  const lines = [`這 ${rangeDays} 天量了 ${s.count} 次血糖（${s.days} 天有量）。`];
  lines.push(`${s.byContext.map((c) => `${c.label} ${c.count} 次，平均 ${c.avg}`).join("；")}。`);
  for (const c of s.byContext) {
    const cmp = compareText(c.diff, rangeDays, "", 10);
    if (cmp && c.label !== "其他") lines.push(`${c.label}${cmp}`);
    const over = c.levels.high + c.levels.warn;
    if (over && (c.context === "fasting" || c.context === "before_meal")) lines.push(`${c.label}有 ${over} 次在 100 以上。`);
    if (over && c.context === "after_meal") lines.push(`飯後有 ${over} 次在 140 以上。`);
  }
  if (s.lows) lines.push(`有 ${s.lows} 次低於 70（低血糖），請記下當時的情況，回診時告訴醫生。`);
  return lines;
}

export function weightLines(s: WeightSummary, rangeDays: number): string[] {
  if (s.count < 2) return [`這 ${rangeDays} 天量了 1 次體重：${s.last} 公斤。`];
  const change = s.change === 0 ? "沒有變" : `${s.change > 0 ? "多" : "少"} ${Math.abs(s.change)} 公斤`;
  return [`這 ${rangeDays} 天量了 ${s.count} 次，從 ${s.first} 變成 ${s.last} 公斤（${change}）。`];
}

export const TREND_DISCLAIMER = "這裡只整理你量的數字，給你和醫生參考，不是診斷。要不要調整藥，請問醫生。";
/** 台灣高血壓學會的居家量血壓建議 */
export const BP_722_TIP = "量血壓「722」：連續 7 天、早上起床和晚上睡前各量 1 回、每回量 2 遍取平均。";

/** 圖上的點（依時間排） */
export interface ChartPoint {
  t: number;
  values: number[];
  level: Level | null;
  label: string;
}

export function chartPoints(kind: MetricKind, metrics: HealthMetric[], rangeDays: number, now: Date = new Date()): ChartPoint[] {
  const { current } = splitPeriods(metrics.filter((m) => m.metric_type === kind), rangeDays, now);
  const out: ChartPoint[] = [];
  for (const m of current) {
    const t = new Date(m.measured_at).getTime();
    if (kind === "blood_pressure" && m.systolic != null && m.diastolic != null) {
      out.push({ t, values: [m.systolic, m.diastolic], level: bpLevel(m.systolic, m.diastolic), label: `${m.systolic}/${m.diastolic}` });
    } else if (kind === "blood_glucose" && m.glucose_mg_dl != null) {
      const ctx = (m.glucose_context ?? null) as GlucoseContext | null;
      const ctxLabel = GLUCOSE_CONTEXTS.find((c) => c.id === ctx)?.label;
      out.push({ t, values: [m.glucose_mg_dl], level: glucoseLevel(m.glucose_mg_dl, ctx), label: `${m.glucose_mg_dl}${ctxLabel ? `（${ctxLabel}）` : ""}` });
    } else if (kind === "weight" && m.weight_kg != null) {
      out.push({ t, values: [Number(m.weight_kg)], level: null, label: `${Number(m.weight_kg)} 公斤` });
    }
  }
  return out;
}

/** 超過幾天就改畫「每天平均」（每次都畫的話早晚交錯，線太密） */
export const DAILY_AVERAGE_AFTER_DAYS = 7;

/** 同一天（台北）的點平均成一個點；分級用平均值重新算 */
export function dailyAverage(kind: MetricKind, points: ChartPoint[]): ChartPoint[] {
  const byDay = new Map<string, ChartPoint[]>();
  for (const p of points) {
    const day = taipeiDay(new Date(p.t).toISOString());
    byDay.set(day, [...(byDay.get(day) ?? []), p]);
  }
  const out: ChartPoint[] = [];
  for (const [day, list] of byDay) {
    if (list.length === 1 && kind !== "blood_glucose") {
      out.push(list[0]);
      continue;
    }
    const n = list[0].values.length;
    const values = Array.from({ length: n }, (_, i) => (kind === "weight" ? round1 : round)(avg(list.map((p) => p.values[i]))));
    // 中午 12 點（台北）當作那一天的位置
    const t = new Date(`${day}T12:00:00+08:00`).getTime();
    const unit = kind === "weight" ? " 公斤" : "";
    const level = kind === "blood_pressure" ? bpLevel(values[0], values[1]) : null;
    const text = kind === "blood_pressure" ? `${values[0]}/${values[1]}` : `${values[0]}${unit}`;
    out.push({ t, values, level, label: list.length > 1 ? `平均 ${text}（${list.length} 次）` : list[0].label });
  }
  return out.sort((a, b) => a.t - b.t);
}
