"use client";

// ────────────────────────────────────────────────
// 家人狀況：看長輩的血壓、血糖、體重趨勢（長輩開了健康權限才有這個按鈕；伺服器也會再檢查）
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError, type HealthMetric } from "@/lib/api-client";
import { HealthTrends } from "@/components/health-trends";
import type { MetricKind, TrendRange } from "@/lib/health-trends";

const TABS: { id: MetricKind; label: string; emoji: string }[] = [
  { id: "blood_pressure", label: "血壓", emoji: "🩺" },
  { id: "blood_glucose", label: "血糖", emoji: "🩸" },
  { id: "weight", label: "體重", emoji: "⚖️" },
];

export function FamilyHealthTrends({ elderId, elderName, onClose }: { elderId: string; elderName: string; onClose: () => void }) {
  const [kind, setKind] = useState<MetricKind>("blood_pressure");
  const [range, setRange] = useState<TrendRange>(30);
  const [metrics, setMetrics] = useState<HealthMetric[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setMetrics(null);
    setError(null);
    api.familyMetrics(elderId, kind, range * 2)
      .then((r) => { if (alive) setMetrics(r.metrics); })
      .catch((e) => { if (alive) setError(e instanceof ApiError && !e.isNetwork ? e.message : "沒載入成功，請再試一次"); });
    return () => { alive = false; };
  }, [elderId, kind, range]);

  if (typeof document === "undefined") return null;
  const label = TABS.find((t) => t.id === kind)!.label;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${elderName}的健康趨勢`} style={{
      position: "fixed", inset: 0, zIndex: 80, background: "var(--bg)", overflowY: "auto", padding: "16px 16px 40px",
    }}>
      <div className="trends-no-print" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button type="button" onClick={onClose} aria-label="關閉" className="btn-ghost" style={{ minWidth: 48 }}>✕</button>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>{elderName}的健康趨勢</div>
      </div>
      <div className="trends-no-print" role="tablist" style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={kind === t.id}
            onClick={() => setKind(t.id)}
            style={{
              flex: 1, minHeight: 52, borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: "var(--fs-sm)",
              border: `2px solid ${kind === t.id ? "var(--primary)" : "var(--line)"}`,
              background: kind === t.id ? "var(--primary-soft)" : "var(--surface)", color: "var(--ink-1)",
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      {error ? (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-2)", padding: 24 }}>{error}</div>
      ) : metrics === null ? (
        <div style={{ textAlign: "center", color: "var(--ink-2)", padding: 24 }}>載入中…</div>
      ) : (
        <HealthTrends kind={kind} metrics={metrics} range={range} onRange={setRange} title={`${elderName}的${label}紀錄`} />
      )}
    </div>,
    document.body
  );
}
