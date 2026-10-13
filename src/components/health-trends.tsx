"use client";

// ────────────────────────────────────────────────
// 血壓、血糖、體重趨勢：7／30／90 天切換、折線圖（點一下看那一次的數字）、白話摘要、列印給醫生看
// 長輩自己的健康紀錄、家人狀況都用這一塊；metrics 要包含「前一段」（往前 2 倍天數），才比得出變化
// ────────────────────────────────────────────────

import { useMemo, useState } from "react";
import type { HealthMetric } from "@/lib/api-client";
import {
  BP_722_TIP,
  GLUCOSE_CONTEXTS,
  LEVEL_META,
  TREND_DISCLAIMER,
  TREND_RANGES,
  bpLines,
  DAILY_AVERAGE_AFTER_DAYS,
  chartPoints,
  dailyAverage,
  glucoseLines,
  splitPeriods,
  summarizeBp,
  summarizeGlucose,
  summarizeWeight,
  weightLines,
  type ChartPoint,
  type MetricKind,
  type TrendRange,
} from "@/lib/health-trends";

const KIND_META: Record<MetricKind, { label: string; unit: string; colors: string[]; refs: { v: number; label: string }[] }> = {
  blood_pressure: { label: "血壓", unit: "mmHg", colors: ["#C95B6E", "#E59AA7"], refs: [{ v: 140, label: "140" }, { v: 90, label: "90" }] },
  blood_glucose: { label: "血糖", unit: "mg/dL", colors: ["#D9A441"], refs: [{ v: 140, label: "140" }, { v: 70, label: "70" }] },
  weight: { label: "體重", unit: "公斤", colors: ["#7AA779"], refs: [] },
};

const DAY = 86400_000;

function fmtDate(t: number) {
  const d = new Date(t + 8 * 3600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
function fmtDateTime(t: number) {
  const d = new Date(t + 8 * 3600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function TrendChart({ kind, points, rangeDays, now }: { kind: MetricKind; points: ChartPoint[]; rangeDays: number; now: number }) {
  const [sel, setSel] = useState<number | null>(null);
  const meta = KIND_META[kind];
  const W = 340, H = 230, L = 36, R = 10, T = 12, B = 26;
  const start = now - rangeDays * DAY;
  const all = points.flatMap((p) => p.values);
  const refVals = meta.refs.map((r) => r.v);
  let lo = Math.min(...all, ...(all.length ? refVals.filter((v) => v >= Math.min(...all) - 20) : []));
  let hi = Math.max(...all, ...(all.length ? refVals.filter((v) => v <= Math.max(...all) + 20) : []));
  if (kind === "weight") { lo -= 1; hi += 1; } else { lo -= 8; hi += 8; }
  if (hi - lo < 1) hi = lo + 1;
  const x = (t: number) => L + ((t - start) / (now - start)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const series = meta.colors.map((_, i) => points.map((p) => `${x(p.t).toFixed(1)},${y(p.values[i]).toFixed(1)}`).join(" "));
  const selected = sel !== null ? points[sel] : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${meta.label}趨勢圖`} style={{ display: "block", touchAction: "manipulation" }}>
        {/* 參考線 */}
        {meta.refs.filter((r) => r.v > lo && r.v < hi).map((r) => (
          <g key={r.v}>
            <line x1={L} x2={W - R} y1={y(r.v)} y2={y(r.v)} stroke="#C95B6E" strokeOpacity={0.45} strokeDasharray="5 4" />
            <text x={L - 4} y={y(r.v) + 4} fontSize="11" textAnchor="end" fill="#A0485A">{r.label}</text>
          </g>
        ))}
        {/* 上下界 */}
        <text x={L - 4} y={T + 8} fontSize="11" textAnchor="end" fill="#A89580">{Math.round(hi)}</text>
        <text x={L - 4} y={H - B} fontSize="11" textAnchor="end" fill="#A89580">{Math.round(lo)}</text>
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#ECDFC8" />
        {/* 日期 */}
        {[start, start + (now - start) / 2, now].map((t, i) => (
          <text key={i} x={x(t)} y={H - 8} fontSize="11" textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} fill="#6B5848">{fmtDate(t)}</text>
        ))}
        {/* 折線 */}
        {/* 血糖空腹、飯後混在一起，連線沒有意義 → 只畫點 */}
        {points.length > 1 && kind !== "blood_glucose" && series.map((pts, i) => (
          <polyline key={i} points={pts} fill="none" stroke={meta.colors[i]} strokeWidth={2.5} strokeLinejoin="round" />
        ))}
        {/* 點（顏色＝高低） */}
        {points.map((p, pi) =>
          p.values.map((v, i) => (
            <circle
              key={`${pi}-${i}`}
              cx={x(p.t)}
              cy={y(v)}
              r={sel === pi ? 7 : 4.5}
              fill={p.level ? LEVEL_META[p.level].color : meta.colors[i]}
              stroke="#fff"
              strokeWidth={1.5}
            />
          ))
        )}
        {/* 點擊範圍（比點大，手指好按） */}
        {points.map((p, pi) => (
          <rect
            key={`hit-${pi}`}
            x={x(p.t) - 10}
            y={T}
            width={20}
            height={H - T - B}
            fill="transparent"
            onClick={() => setSel(sel === pi ? null : pi)}
            style={{ cursor: "pointer" }}
          >
            <title>{`${fmtDateTime(p.t)} ${p.label}`}</title>
          </rect>
        ))}
      </svg>
      <div style={{ minHeight: 28, fontSize: "var(--fs-sm)", color: "var(--ink-2)", textAlign: "center" }}>
        {selected ? (
          <>
            {selected.label.startsWith("平均") ? fmtDate(selected.t) : fmtDateTime(selected.t)}　<strong style={{ color: "var(--ink-1)" }}>{selected.label}</strong>
            {selected.level && <span style={{ color: LEVEL_META[selected.level].color, fontWeight: 700 }}>　{LEVEL_META[selected.level].label}</span>}
          </>
        ) : (
          `${kind === "blood_pressure" ? "深色線＝收縮壓、淺色線＝舒張壓。" : ""}${rangeDays > DAILY_AVERAGE_AFTER_DAYS && kind !== "blood_glucose" ? "每天一個點（當天平均），" : ""}點一下圖看數字`
        )}
      </div>
    </div>
  );
}

export function HealthTrends({
  kind,
  metrics,
  range,
  onRange,
  title,
}: {
  kind: MetricKind;
  /** 至少要有最近 2×range 天的紀錄 */
  metrics: HealthMetric[];
  range: TrendRange;
  onRange: (r: TrendRange) => void;
  /** 列印時的標題（例如「王阿嬤的血壓紀錄」） */
  title?: string;
}) {
  // 資料或天數換了才重算「現在」（畫面重畫時圖不會一直位移）
  const now = useMemo(() => Date.now(), [metrics, range]);
  const nowDate = new Date(now);
  const meta = KIND_META[kind];
  const ofKind = metrics.filter((m) => m.metric_type === kind);
  const raw = chartPoints(kind, ofKind, range, nowDate);
  const points = range > DAILY_AVERAGE_AFTER_DAYS && kind !== "blood_glucose" ? dailyAverage(kind, raw) : raw;
  const lines =
    kind === "blood_pressure" ? (() => { const s = summarizeBp(ofKind, range, nowDate); return s ? bpLines(s, range) : []; })()
    : kind === "blood_glucose" ? (() => { const s = summarizeGlucose(ofKind, range, nowDate); return s ? glucoseLines(s, range) : []; })()
    : (() => { const s = summarizeWeight(ofKind, range, nowDate); return s ? weightLines(s, range) : []; })();
  // 列印的表格和圖、摘要用同一批（沒有數字的那筆不列）
  const readings = splitPeriods(ofKind, range, nowDate).current.filter((m) =>
    kind === "blood_pressure" ? m.systolic != null && m.diastolic != null
    : kind === "blood_glucose" ? m.glucose_mg_dl != null
    : m.weight_kg != null && Number(m.weight_kg) > 0
  );

  const print = () => {
    document.body.classList.add("printing-trends");
    const done = () => {
      document.body.classList.remove("printing-trends");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  return (
    <div className="card trends-print" style={{ padding: 18, marginBottom: 20 }}>
      <style>{`
        @media print {
          body.printing-trends * { visibility: hidden !important; }
          body.printing-trends .trends-print, body.printing-trends .trends-print * { visibility: visible !important; }
          body.printing-trends .trends-print { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; box-shadow: none; border: none; }
          body.printing-trends .trends-no-print { display: none !important; }
          body.printing-trends div.trends-only-print { display: block !important; }
          body.printing-trends table.trends-only-print { display: table !important; }
        }
      `}</style>
      <div className="trends-only-print" style={{ display: "none", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
        {title ?? `${meta.label}紀錄`}（{fmtDate(now - range * DAY)}～{fmtDate(now)}，單位 {meta.unit}）
      </div>
      <div className="trends-no-print" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, marginBottom: 8 }}>📈 {meta.label}趨勢</div>
        <div role="radiogroup" aria-label="看幾天" style={{ display: "flex", gap: 8 }}>
          {TREND_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={range === r}
              onClick={() => onRange(r)}
              style={{
                flex: 1, minHeight: 44, padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                fontSize: "var(--fs-sm)", fontWeight: 700,
                border: `2px solid ${range === r ? "var(--primary)" : "var(--line)"}`,
                background: range === r ? "var(--primary-soft)" : "var(--surface)", color: "var(--ink-1)",
              }}
            >
              {r} 天
            </button>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <div style={{ color: "var(--ink-2)", textAlign: "center", padding: "24px 0" }}>這 {range} 天還沒有{meta.label}紀錄</div>
      ) : (
        <>
          <TrendChart kind={kind} points={points} rangeDays={range} now={now} />
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {lines.map((l, i) => (
              <div key={i} style={{ fontSize: "var(--fs-base)", lineHeight: 1.6 }}>{l}</div>
            ))}
          </div>
          {kind === "blood_pressure" && (
            <div className="trends-no-print" style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 10, lineHeight: 1.6, background: "var(--surface-warm)", borderRadius: 12, padding: "8px 12px" }}>
              💡 {BP_722_TIP}
            </div>
          )}
          {/* 列印時附上每一次的數字 */}
          <table className="trends-only-print" style={{ display: "none", width: "100%", marginTop: 12, borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {readings.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "3px 6px" }}>{fmtDateTime(new Date(m.measured_at).getTime())}</td>
                  <td style={{ padding: "3px 6px" }}>
                    {kind === "blood_pressure" ? `${m.systolic}/${m.diastolic}${m.pulse ? `　脈搏 ${m.pulse}` : ""}` : kind === "blood_glucose" ? `${m.glucose_mg_dl}` : `${m.weight_kg}`}
                  </td>
                  <td style={{ padding: "3px 6px" }}>
                    {[GLUCOSE_CONTEXTS.find((c) => c.id === m.glucose_context)?.label, m.notes].filter(Boolean).join("　")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 10, lineHeight: 1.6 }}>{TREND_DISCLAIMER}</div>
          <button type="button" className="btn-ghost trends-no-print" style={{ width: "100%", marginTop: 12 }} onClick={print}>
            🖨️ 列印給醫生看
          </button>
        </>
      )}
    </div>
  );
}
