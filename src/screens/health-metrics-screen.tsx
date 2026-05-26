"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { api, type HealthMetric } from "@/lib/api-client";

interface HealthMetricsScreenProps {
  onBack: () => void;
}

type TabType = "weight" | "blood_pressure" | "blood_glucose";

const TAB_INFO: Record<TabType, { label: string; emoji: string; unit: string; color: string }> = {
  weight: { label: "體重", emoji: "⚖️", unit: "公斤", color: "#7AA779" },
  blood_pressure: { label: "血壓", emoji: "🩺", unit: "mmHg", color: "#C95B6E" },
  blood_glucose: { label: "血糖", emoji: "🩸", unit: "mg/dL", color: "#D9A441" },
};

export function HealthMetricsScreen({ onBack }: HealthMetricsScreenProps) {
  const [tab, setTab] = useState<TabType>("weight");
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const { metrics } = await api.listMetrics(tab, 30);
      setMetrics(metrics);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [tab]);

  return (
    <SubPage
      title="健康紀錄"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
      footer={
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={26} color="#fff" stroke={2.8} />
          新增{TAB_INFO[tab].label}記錄
        </button>
      }
    >
      {/* Tabs */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 20,
        background: "var(--surface)", borderRadius: 14, padding: 6,
        border: "1px solid var(--line)",
      }}>
        {(Object.keys(TAB_INFO) as TabType[]).map((t) => {
          const info = TAB_INFO[t];
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 10,
                background: active ? info.color : "transparent",
                color: active ? "#fff" : "var(--ink-2)",
                fontSize: "var(--fs-sm)", fontWeight: 700,
                border: "none", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2,
              }}
            >
              <span style={{ fontSize: 20 }}>{info.emoji}</span>
              {info.label}
            </button>
          );
        })}
      </div>

      {/* 最新數值 */}
      <LatestCard tab={tab} metrics={metrics} />

      {/* 趨勢圖 */}
      {metrics.length >= 2 && (
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 14 }}>
            過去 30 天趨勢
          </div>
          <TrendChart tab={tab} metrics={metrics} />
        </div>
      )}

      {/* 列表 */}
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
        所有記錄
      </div>
      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--ink-2)" }}>載入中…</div>
      ) : metrics.length === 0 ? (
        <div style={{
          background: "var(--surface)", borderRadius: 16,
          padding: 40, textAlign: "center", border: "1px dashed var(--line-strong)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{TAB_INFO[tab].emoji}</div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 4 }}>還沒記錄</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
            點下方按鈕開始記錄 {TAB_INFO[tab].label}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {metrics.map((m) => (
            <MetricRow key={m.id} metric={m} onDeleted={reload} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddMetricSheet
          tab={tab}
          previousMetric={metrics[0]}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); reload(); }}
        />
      )}
    </SubPage>
  );
}

function LatestCard({ tab, metrics }: { tab: TabType; metrics: HealthMetric[] }) {
  const latest = metrics[0];
  const info = TAB_INFO[tab];

  if (!latest) {
    return (
      <div className="card" style={{
        padding: 24, marginBottom: 20, textAlign: "center",
        background: "linear-gradient(180deg, #FFF9EF, #FFFFFF)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{info.emoji}</div>
        <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)" }}>
          還沒記錄{info.label}
        </div>
      </div>
    );
  }

  const status = getStatus(tab, latest);

  return (
    <div className="card" style={{
      padding: 24, marginBottom: 20,
      background: "linear-gradient(180deg, #FFF9EF, #FFFFFF)",
    }}>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 6 }}>
        最新{info.label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        {tab === "weight" && (
          <>
            <span style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: info.color }}>
              {latest.weight_kg}
            </span>
            <span style={{ fontSize: "var(--fs-lg)", color: "var(--ink-2)" }}>{info.unit}</span>
          </>
        )}
        {tab === "blood_pressure" && (
          <>
            <span style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: info.color }}>
              {latest.systolic}/{latest.diastolic}
            </span>
            <span style={{ fontSize: "var(--fs-lg)", color: "var(--ink-2)" }}>{info.unit}</span>
          </>
        )}
        {tab === "blood_glucose" && (
          <>
            <span style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: info.color }}>
              {latest.glucose_mg_dl}
            </span>
            <span style={{ fontSize: "var(--fs-lg)", color: "var(--ink-2)" }}>{info.unit}</span>
          </>
        )}
      </div>
      {status && (
        <div style={{
          display: "inline-block",
          padding: "4px 10px", borderRadius: 999,
          background: status.color + "22", color: status.color,
          fontSize: "var(--fs-xs)", fontWeight: 700,
        }}>
          {status.label}
        </div>
      )}
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 8 }}>
        {new Date(latest.measured_at).toLocaleString("zh-TW", {
          month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
        })}
      </div>
    </div>
  );
}

function TrendChart({ tab, metrics }: { tab: TabType; metrics: HealthMetric[] }) {
  const info = TAB_INFO[tab];
  // 依時間升序
  const sorted = [...metrics].reverse();
  const values = sorted.map((m) => {
    if (tab === "weight") return Number(m.weight_kg) || 0;
    if (tab === "blood_pressure") return m.systolic ?? 0;
    return m.glucose_mg_dl ?? 0;
  });
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
      {sorted.map((m, i) => {
        const v = values[i];
        const heightPct = ((v - min) / range) * 80 + 10; // 10-90%
        return (
          <div
            key={m.id}
            title={`${new Date(m.measured_at).toLocaleDateString("zh-TW")}: ${v}`}
            style={{
              flex: 1, height: `${heightPct}%`,
              background: info.color,
              borderRadius: "4px 4px 0 0",
              minHeight: 4,
            }}
          />
        );
      })}
    </div>
  );
}

function MetricRow({ metric, onDeleted }: { metric: HealthMetric; onDeleted: () => void }) {
  const info = TAB_INFO[metric.metric_type as TabType];

  const handleDelete = async () => {
    if (!confirm("刪除這筆記錄？")) return;
    try {
      await api.deleteMetric(metric.id);
      onDeleted();
    } catch (e) {
      alert("刪除失敗");
    }
  };

  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14,
      padding: "12px 14px", border: "1px solid var(--line)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{ fontSize: 28 }}>{info.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>
          {metric.metric_type === "weight" && `${metric.weight_kg} 公斤`}
          {metric.metric_type === "blood_pressure" && `${metric.systolic}/${metric.diastolic} mmHg${metric.pulse ? ` · 脈搏 ${metric.pulse}` : ""}`}
          {metric.metric_type === "blood_glucose" && (
            <>
              {metric.glucose_mg_dl} mg/dL
              {metric.glucose_context && (
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginLeft: 6 }}>
                  ({GLUCOSE_CONTEXT_LABEL[metric.glucose_context]})
                </span>
              )}
            </>
          )}
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
          {new Date(metric.measured_at).toLocaleString("zh-TW", {
            month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </div>
        {metric.notes && (
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2 }}>
            📝 {metric.notes}
          </div>
        )}
      </div>
      <button onClick={handleDelete} style={{ padding: 8 }}>
        <Icon name="x" size={18} color="var(--ink-3)" stroke={2.5} />
      </button>
    </div>
  );
}

function AddMetricSheet({ tab, previousMetric, onClose, onSaved }: {
  tab: TabType;
  previousMetric?: HealthMetric;
  onClose: () => void;
  onSaved: () => void;
}) {
  const info = TAB_INFO[tab];
  // 預填上次的值（方便長者快速記錄）
  const [weight, setWeight] = useState(previousMetric?.weight_kg?.toString() ?? "");
  const [systolic, setSystolic] = useState(previousMetric?.systolic?.toString() ?? "");
  const [diastolic, setDiastolic] = useState(previousMetric?.diastolic?.toString() ?? "");
  const [pulse, setPulse] = useState("");
  const [glucose, setGlucose] = useState("");
  const [glucoseContext, setGlucoseContext] = useState<"fasting" | "before_meal" | "after_meal" | "bedtime">("fasting");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const body: Partial<HealthMetric> = {
        metric_type: tab,
        measured_at: new Date().toISOString(),
        notes: notes || null,
      };
      if (tab === "weight") body.weight_kg = Number(weight);
      if (tab === "blood_pressure") {
        body.systolic = Number(systolic);
        body.diastolic = Number(diastolic);
        if (pulse) body.pulse = Number(pulse);
      }
      if (tab === "blood_glucose") {
        body.glucose_mg_dl = Number(glucose);
        body.glucose_context = glucoseContext;
      }
      await api.createMetric(body);
      onSaved();
    } catch (e) {
      alert("儲存失敗：" + (e as Error).message);
    }
    setSaving(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 100,
        background: "rgba(45, 28, 14, 0.5)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{
          width: "100%", background: "var(--bg)",
          borderRadius: "28px 28px 0 0",
          padding: "12px 24px 32px",
          maxHeight: "85%", overflowY: "auto",
        }}
      >
        <div style={{ width: 48, height: 5, borderRadius: 3, background: "var(--line-strong)", margin: "6px auto 16px" }} />

        <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: "0 0 6px" }}>
          {info.emoji} 新增{info.label}
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "0 0 20px" }}>
          {new Date().toLocaleString("zh-TW", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>

        {tab === "weight" && (
          <Field label="體重（公斤）">
            <BigInput value={weight} onChange={setWeight} placeholder="65.5" suffix="kg" />
          </Field>
        )}

        {tab === "blood_pressure" && (
          <>
            <Field label="收縮壓 / 高壓（上面那個數字）">
              <BigInput value={systolic} onChange={setSystolic} placeholder="120" suffix="mmHg" />
            </Field>
            <Field label="舒張壓 / 低壓（下面那個數字）">
              <BigInput value={diastolic} onChange={setDiastolic} placeholder="80" suffix="mmHg" />
            </Field>
            <Field label="脈搏（可選）">
              <BigInput value={pulse} onChange={setPulse} placeholder="72" suffix="次/分" />
            </Field>
          </>
        )}

        {tab === "blood_glucose" && (
          <>
            <Field label="血糖值（mg/dL）">
              <BigInput value={glucose} onChange={setGlucose} placeholder="100" suffix="mg/dL" />
            </Field>
            <Field label="什麼時候量的？">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {([
                  { v: "fasting", label: "空腹" },
                  { v: "before_meal", label: "餐前" },
                  { v: "after_meal", label: "餐後 2 小時" },
                  { v: "bedtime", label: "睡前" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setGlucoseContext(opt.v)}
                    style={{
                      padding: "12px", borderRadius: 12,
                      background: glucoseContext === opt.v ? "var(--primary)" : "var(--surface)",
                      color: glucoseContext === opt.v ? "#fff" : "var(--ink-1)",
                      border: glucoseContext === opt.v ? "none" : "2px solid var(--line-strong)",
                      fontSize: "var(--fs-sm)", fontWeight: 700,
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </Field>
          </>
        )}

        <Field label="備註（可選）">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例如：剛吃完飯、運動完"
            style={{
              width: "100%", padding: "12px 14px",
              border: "2px solid var(--line-strong)", borderRadius: 12,
              fontSize: "var(--fs-base)", outline: "none", fontFamily: "inherit",
            }}
          />
        </Field>

        <button
          className="btn-primary"
          style={{ width: "100%", marginTop: 12, opacity: saving ? 0.5 : 1 }}
          disabled={saving}
          onClick={save}
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function BigInput({ value, onChange, placeholder, suffix }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "var(--surface)", border: "2px solid var(--line-strong)",
      borderRadius: 14, padding: "4px 16px",
    }}>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, padding: "16px 0",
          border: "none", outline: "none",
          fontSize: "var(--fs-2xl)", fontWeight: 800,
          color: "var(--ink-1)", background: "transparent",
          fontFamily: "ui-monospace, monospace",
        }}
      />
      <span style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", fontWeight: 600 }}>
        {suffix}
      </span>
    </div>
  );
}

// ─── helpers ───

const GLUCOSE_CONTEXT_LABEL: Record<string, string> = {
  fasting: "空腹",
  before_meal: "餐前",
  after_meal: "餐後",
  bedtime: "睡前",
};

function getStatus(tab: TabType, m: HealthMetric): { label: string; color: string } | null {
  if (tab === "blood_pressure" && m.systolic && m.diastolic) {
    if (m.systolic >= 140 || m.diastolic >= 90) return { label: "⚠️ 偏高", color: "#C95B6E" };
    if (m.systolic >= 130 || m.diastolic >= 85) return { label: "⚠️ 偏高警戒", color: "#D9A441" };
    if (m.systolic < 90 || m.diastolic < 60) return { label: "⚠️ 偏低", color: "#5BA0C9" };
    return { label: "✅ 正常", color: "#7AA779" };
  }
  if (tab === "blood_glucose" && m.glucose_mg_dl) {
    const ctx = m.glucose_context;
    const g = m.glucose_mg_dl;
    if (ctx === "fasting" || ctx === "before_meal") {
      if (g >= 126) return { label: "⚠️ 偏高（糖尿病範圍）", color: "#C95B6E" };
      if (g >= 100) return { label: "⚠️ 偏高警戒", color: "#D9A441" };
      if (g < 70) return { label: "⚠️ 偏低", color: "#5BA0C9" };
      return { label: "✅ 正常", color: "#7AA779" };
    }
    if (ctx === "after_meal") {
      if (g >= 200) return { label: "⚠️ 偏高（糖尿病範圍）", color: "#C95B6E" };
      if (g >= 140) return { label: "⚠️ 偏高警戒", color: "#D9A441" };
      return { label: "✅ 正常", color: "#7AA779" };
    }
  }
  return null;
}
