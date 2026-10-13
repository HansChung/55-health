// ────────────────────────────────────────────────
// 看診小幫手（前後端共用）
// 回診前：長輩說哪裡不舒服、想問什麼 → 暖暖整理成「看診小卡」（帶上目前吃的藥、最近量的血壓血糖）
// 看完診：拍檢驗報告 → 暖暖逐項用白話說明，和上次比較。只說明、不診斷
// ────────────────────────────────────────────────

export const CLINIC_TEXT_MAX = 600;
export const CLINIC_DEPARTMENT_MAX = 40;
export const CLINIC_NOTES_MAX = 1000;
// 免費會員每天可以看幾張檢驗報告：後台「方案與次數」的 clinic_report_free_daily（預設 3；標準版以上用每月拍照次數）

/** 不舒服多久了（點一下就好） */
export const CLINIC_SINCE_OPTIONS = ["今天", "這幾天", "一兩個禮拜", "一個月以上", "時好時壞"] as const;

/** 常見想問醫生的問題（點一下加進去） */
export const CLINIC_QUESTION_PRESETS = [
  "這個藥要吃多久？",
  "會有什麼副作用？",
  "飲食要注意什麼？",
  "可以運動嗎？",
  "什麼情況要提早回診？",
  "下次什麼時候回診？",
] as const;

/** 看診要帶的東西（固定清單，不靠模型） */
export const CLINIC_BRING = ["健保卡", "正在吃的藥或藥袋", "血壓、血糖紀錄", "上次的檢驗報告"] as const;

export interface ClinicPrepInput {
  department: string;
  symptoms: string;
  since: string;
  questions: string;
}

/** 看診小卡（暖暖整理的部分） */
export interface ClinicCard {
  /** 一句話說這次為什麼來 */
  chief: string;
  /** 症狀重點（給醫生看的條列） */
  points: string[];
  /** 想問醫生的問題 */
  questions: string[];
}

export interface ClinicMed {
  name: string;
  dose: string | null;
  time: string | null;
}

/** 最近 30 天自己量的數值（伺服器算，不靠模型） */
export interface ClinicMetrics {
  bp: { count: number; avgSystolic: number; avgDiastolic: number; latest: string } | null;
  glucose: { count: number; avgFasting: number | null; avgAll: number; latest: string } | null;
  weight: { latestKg: number; latest: string } | null;
}

export type LabFlag = "high" | "low" | "normal" | "unknown";

export interface LabItem {
  name: string;
  value: string;
  unit: string;
  /** 報告上印的參考範圍 */
  range: string;
  flag: LabFlag;
  /** 這一項在看什麼（白話） */
  plain: string;
}

export interface LabReport {
  title: string;
  /** 報告上的日期（看得到才填） */
  date: string;
  items: LabItem[];
  /** 整體白話說明（不診斷） */
  summary: string;
  /** 可以問醫生的問題 */
  ask_doctor: string[];
}

export interface ClinicVisit {
  id: string;
  visit_date: string;
  department: string | null;
  prep: { input: ClinicPrepInput; card: ClinicCard; meds: ClinicMed[]; metrics: ClinicMetrics } | null;
  report: LabReport | null;
  doctor_notes: string | null;
  created_at: string;
}

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? [...v.replace(/\s+/g, " ").trim()].slice(0, max).join("") : "";
}

function cleanList(v: unknown, maxItems: number, maxLen: number): string[] {
  return Array.isArray(v) ? v.map((x) => clean(x, maxLen)).filter(Boolean).slice(0, maxItems) : [];
}

/** 長輩打的字：保留換行，截長 */
export function sanitizeClinicText(v: unknown, max = CLINIC_TEXT_MAX): string {
  if (typeof v !== "string") return "";
  const t = v
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return [...t].slice(0, max).join("");
}

/** 長輩寫的問題：一行一題（或用問號分開），補上問號 */
export function splitQuestions(text: string): string[] {
  return text
    .split(/\n|(?<=[？?])/)
    .map((q) => q.trim())
    .filter((q) => q && !/^[？?]+$/.test(q))
    .map((q) => (/[？?]$/.test(q) ? q : `${q}？`));
}

/** 兩題是不是在問同一件事：短的那題的字，八成以上出現在長的那題（模型常把「可以爬山嗎」改寫成「我還可以去爬山嗎？」） */
export function sameQuestion(a: string, b: string): boolean {
  const chars = (s: string) => new Set([...s.replace(/[\s？?！!，,。.、]/g, "")]);
  const [x, y] = [chars(a), chars(b)].sort((p, q) => p.size - q.size);
  if (x.size === 0) return false;
  let hit = 0;
  for (const c of x) if (y.has(c)) hit += 1;
  return hit / x.size >= 0.8;
}

export function normalizeClinicCard(raw: unknown, input: ClinicPrepInput): ClinicCard {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const chief = clean(r.chief, 80);
  const points = cleanList(r.points, 6, 80);
  if (!chief && points.length === 0) throw new Error("empty clinic card");
  // 長輩自己寫的問題一定要在：模型改寫的題數對得上才用改寫的，不然用原文
  const original = splitQuestions(input.questions).map((q) => clean(q, 80));
  const rewritten = cleanList(r.own_questions, 10, 80);
  const own = rewritten.length === original.length ? rewritten : original;
  const questions = [...own];
  // 暖暖建議補問的（舊格式只有 questions 也接受），和已經有的重複就不加
  // 只限制暖暖加的題數（最多 4 題）；長輩自己的問題全部保留
  let extras = 0;
  for (const q of [...cleanList(r.extra_questions, 4, 80), ...cleanList(r.questions, 8, 80)]) {
    if (extras >= 4) break;
    if (!questions.some((x) => sameQuestion(x, q))) {
      questions.push(q);
      extras += 1;
    }
  }
  return { chief: chief || points[0], points, questions };
}

const FLAGS: LabFlag[] = ["high", "low", "normal", "unknown"];

export function normalizeLabReport(raw: unknown): LabReport {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const items = (Array.isArray(r.items) ? r.items : [])
    .map((x): LabItem | null => {
      const i = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      const name = clean(i.name, 40);
      const value = clean(i.value, 20);
      if (!name || !value) return null;
      return {
        name,
        value,
        unit: clean(i.unit, 20),
        range: clean(i.range, 30),
        flag: FLAGS.includes(i.flag as LabFlag) ? (i.flag as LabFlag) : "unknown",
        plain: clean(i.plain, 120),
      };
    })
    .filter((x): x is LabItem => x !== null)
    .slice(0, 40);
  const summary = clean(r.summary, 400);
  if (items.length === 0 && !summary) throw new Error("empty lab report");
  return {
    title: clean(r.title, 40) || "檢驗報告",
    date: clean(r.date, 20),
    items,
    summary,
    ask_doctor: cleanList(r.ask_doctor, 5, 80),
  };
}

/** 同一項檢驗的名字可能寫法不同（全形、大小寫、空白、括號裡的英文） */
export function labKey(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s()（）\[\]【】:：\-_.]/g, "");
}

/** 確切的數字才算；「<5」「>200」「≦0.5」這種只知道範圍的不能比高低 */
function toNumber(v: string): number | null {
  if (/[<>≦≧≤≥＜＞]/.test(v)) return null;
  const m = /-?\d+(?:\.\d+)?/.exec(v.replace(/,/g, ""));
  return m ? Number(m[0]) : null;
}

export interface LabCompare {
  prevValue: string;
  prevDate: string;
  /** 數字變高、變低、差不多；不是數字就 null */
  trend: "up" | "down" | "same" | null;
}

/** 這次每一項和上一份報告比：名字對得上才比 */
export function compareLab(current: LabReport, previous: { report: LabReport; date: string } | null): Map<string, LabCompare> {
  const out = new Map<string, LabCompare>();
  if (!previous) return out;
  const prev = new Map(previous.report.items.map((i) => [labKey(i.name), i]));
  for (const item of current.items) {
    const p = prev.get(labKey(item.name));
    if (!p) continue;
    const a = toNumber(p.value);
    const b = toNumber(item.value);
    let trend: LabCompare["trend"] = null;
    if (a !== null && b !== null) {
      const diff = b - a;
      trend = Math.abs(diff) <= Math.max(Math.abs(a) * 0.03, 1e-9) ? "same" : diff > 0 ? "up" : "down";
    }
    out.set(item.name, { prevValue: p.value, prevDate: previous.date, trend });
  }
  return out;
}

/** 報告的時間：報告上印的日期（2026/10/03、2026-10-03、115/10/03 民國年），沒有就用看診日 */
export function reportDay(v: ClinicVisit): string {
  const m = /(\d{2,4})[/.\-年](\d{1,2})[/.\-月](\d{1,2})/.exec(v.report?.date ?? "");
  if (m) {
    const y = Number(m[1]) < 1000 ? Number(m[1]) + 1911 : Number(m[1]);
    return `${y}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  return v.visit_date;
}

/** 這份報告之前、最近的一份檢驗報告（照報告日期排，不是照紀錄建立的順序；同一天的不比） */
export function previousReport(visits: ClinicVisit[], current: ClinicVisit): { report: LabReport; date: string } | null {
  if (!current.report) return null;
  const day = reportDay(current);
  const before = visits
    .filter((v) => v.id !== current.id && v.report && v.report.items.length > 0 && reportDay(v) < day)
    .sort((a, b) => reportDay(b).localeCompare(reportDay(a)));
  const v = before[0];
  return v?.report ? { report: v.report, date: v.report.date || v.visit_date } : null;
}

/** 最近 30 天自己量的數值 → 看診小卡上的一行 */
export function summarizeMetrics(
  rows: { metric_type: string; measured_at: string; systolic?: number | null; diastolic?: number | null; glucose_mg_dl?: number | null; glucose_context?: string | null; weight_kg?: number | string | null }[]
): ClinicMetrics {
  // 台灣時間的日期（早上量的血壓不會變成前一天）
  const day = (iso: string) => new Date(Date.parse(iso) + 8 * 3600 * 1000).toISOString().slice(5, 10).replace("-", "/");
  const bpRows = rows.filter((r) => r.metric_type === "blood_pressure" && r.systolic && r.diastolic);
  const gRows = rows.filter((r) => r.metric_type === "blood_glucose" && r.glucose_mg_dl);
  const wRows = rows.filter((r) => r.metric_type === "weight" && r.weight_kg);
  const avg = (ns: number[]) => Math.round(ns.reduce((s, n) => s + n, 0) / ns.length);
  const latest = <T extends { measured_at: string }>(rs: T[]) => [...rs].sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0];
  const fasting = gRows.filter((r) => r.glucose_context === "fasting");
  const lw = latest(wRows);
  return {
    bp: bpRows.length
      ? { count: bpRows.length, avgSystolic: avg(bpRows.map((r) => r.systolic!)), avgDiastolic: avg(bpRows.map((r) => r.diastolic!)), latest: day(latest(bpRows).measured_at) }
      : null,
    glucose: gRows.length
      ? { count: gRows.length, avgFasting: fasting.length ? avg(fasting.map((r) => r.glucose_mg_dl!)) : null, avgAll: avg(gRows.map((r) => r.glucose_mg_dl!)), latest: day(latest(gRows).measured_at) }
      : null,
    weight: lw ? { latestKg: Number(lw.weight_kg), latest: day(lw.measured_at) } : null,
  };
}

export function metricsLines(m: ClinicMetrics): string[] {
  const lines: string[] = [];
  if (m.bp) lines.push(`血壓：最近 30 天量了 ${m.bp.count} 次，平均 ${m.bp.avgSystolic}/${m.bp.avgDiastolic} mmHg`);
  if (m.glucose) {
    lines.push(
      m.glucose.avgFasting !== null
        ? `血糖：最近 30 天量了 ${m.glucose.count} 次，空腹平均 ${m.glucose.avgFasting} mg/dL`
        : `血糖：最近 30 天量了 ${m.glucose.count} 次，平均 ${m.glucose.avgAll} mg/dL`
    );
  }
  if (m.weight) lines.push(`體重：${m.weight.latestKg} 公斤（${m.weight.latest}）`);
  return lines;
}

/** 傳給家人（LINE）／念給我聽 */
export function clinicCardText(v: ClinicVisit): string {
  if (!v.prep) return "";
  const { card, meds, metrics } = v.prep;
  const lines = [`🩺 看診小卡${v.department ? `｜${v.department}` : ""}（${v.visit_date}）`, `這次來：${card.chief}`];
  if (card.points.length) lines.push("情況：", ...card.points.map((p) => `・${p}`));
  if (meds.length) lines.push("正在吃的藥：", ...meds.map((m) => `・${m.name}${m.dose ? ` ${m.dose}` : ""}`));
  const ml = metricsLines(metrics);
  if (ml.length) lines.push(...ml);
  if (card.questions.length) lines.push("想問醫生：", ...card.questions.map((q, i) => `${i + 1}. ${q}`));
  return lines.join("\n");
}

export const LAB_FLAG_META: Record<LabFlag, { label: string; color: string }> = {
  high: { label: "偏高", color: "var(--berry)" },
  low: { label: "偏低", color: "#2E7CB8" },
  normal: { label: "在範圍內", color: "#3D7A3A" },
  unknown: { label: "", color: "var(--ink-3)" },
};

export function labSpeech(r: LabReport): string[] {
  const out = [r.summary].filter(Boolean);
  const off = r.items.filter((i) => i.flag === "high" || i.flag === "low");
  if (off.length) out.push(`不在參考範圍的有：${off.map((i) => `${i.name}${LAB_FLAG_META[i.flag].label}`).join("、")}。`);
  if (r.ask_doctor.length) out.push(`可以問醫生：${r.ask_doctor.join("；")}`);
  out.push("暖暖只是幫你看懂報告，真正的意思請問醫生。");
  return out;
}
