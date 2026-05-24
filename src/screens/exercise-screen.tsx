"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { api, type ExerciseRecord } from "@/lib/api-client";

interface ExerciseScreenProps {
  onBack: () => void;
}

const QUICK = [
  { type: "walk", label: "散步 30 分", minutes: 30, kcal: 95, icon: "🚶" },
  { type: "taichi", label: "太極拳", minutes: 30, kcal: 60, icon: "🥋" },
  { type: "stretch", label: "伸展操", minutes: 15, kcal: 22, icon: "🧘" },
  { type: "other", label: "其他運動", minutes: 0, kcal: 0, icon: "➕" },
];

export function ExerciseScreen({ onBack }: ExerciseScreenProps) {
  const [logs, setLogs] = useState<ExerciseRecord[]>([]);
  const [weekLogs, setWeekLogs] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const reload = async () => {
    try {
      const { exercises } = await api.listExercises(7);
      setWeekLogs(exercises);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      setLogs(exercises.filter((e) => new Date(e.performed_at) >= todayStart));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const totalMin = logs.reduce((s, l) => s + l.minutes, 0);
  const totalKcal = logs.reduce((s, l) => s + l.kcal_burned, 0);
  const goalMin = 60;
  const pct = Math.min((totalMin / goalMin) * 100, 100);

  const addQuick = async (q: typeof QUICK[0]) => {
    if (q.type === "other") {
      const minutes = Number(prompt("運動了幾分鐘？"));
      const label = prompt("運動類型？") || "其他";
      if (!minutes || minutes <= 0) return;
      setAdding(true);
      try {
        await api.createExercise({
          exercise_type: label,
          minutes,
          kcal_burned: Math.round(minutes * 3.5),
        });
        await reload();
      } catch (e) {
        alert("新增失敗：" + (e as Error).message);
      }
      setAdding(false);
      return;
    }
    setAdding(true);
    try {
      await api.createExercise({
        exercise_type: q.label.split(" ")[0],
        minutes: q.minutes,
        kcal_burned: q.kcal,
      });
      await reload();
    } catch (e) {
      alert("新增失敗：" + (e as Error).message);
    }
    setAdding(false);
  };

  // 算這週圖表
  const weekChart = (() => {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getTime() - (6 - i) * 86400000);
      const start = new Date(d);
      const end = new Date(d.getTime() + 86400000);
      const v = weekLogs
        .filter((l) => {
          const t = new Date(l.performed_at);
          return t >= start && t < end;
        })
        .reduce((s, l) => s + l.minutes, 0);
      return {
        d: days[d.getDay()],
        v,
        today: i === 6,
      };
    });
  })();
  const maxV = Math.max(...weekChart.map((c) => c.v), 60);

  return (
    <SubPage
      title="運動記錄"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--ink-2)" }}>載入中…</div>
      ) : (
        <>
          <div className="card" style={{
            padding: 20, marginBottom: 20,
            background: "linear-gradient(180deg, #FFF9EF 0%, #FFFFFF 100%)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <span style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>今天動了多少</span>
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>目標 {goalMin} 分</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--primary-deep)" }}>
                {totalMin}
              </span>
              <span style={{ fontSize: "var(--fs-lg)", color: "var(--ink-2)" }}>分鐘</span>
              {totalKcal > 0 && (
                <span style={{ marginLeft: "auto", fontSize: "var(--fs-base)", color: "var(--gold)", fontWeight: 700 }}>
                  -{totalKcal} 大卡
                </span>
              )}
            </div>
            <div style={{ height: 12, background: "var(--bg-deep)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: "linear-gradient(90deg, #F4B58E, #E8845A)",
                borderRadius: 6, transition: "width 0.8s ease",
              }} />
            </div>
            {totalMin >= goalMin && (
              <div style={{
                fontSize: "var(--fs-sm)", color: "var(--sage)",
                fontWeight: 700, marginTop: 10,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Icon name="check" size={20} color="var(--sage)" stroke={3} />
                已達標！繼續保持～
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 14 }}>這週運動</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>
              {weekChart.map((b, i) => (
                <div key={i} style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6,
                }}>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
                    {b.v > 0 ? b.v : "-"}
                  </div>
                  <div style={{
                    width: "100%", height: `${(b.v / maxV) * 80}px`,
                    minHeight: b.v ? 6 : 0,
                    background: b.today
                      ? "linear-gradient(180deg, #F4B58E, #E8845A)"
                      : b.v >= 30 ? "var(--sage)" : "var(--line-strong)",
                    borderRadius: 6,
                  }} />
                  <div style={{
                    fontSize: "var(--fs-sm)",
                    fontWeight: b.today ? 700 : 500,
                    color: b.today ? "var(--primary-deep)" : "var(--ink-2)",
                  }}>{b.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
            快速記錄
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {QUICK.map((q, i) => (
              <button
                key={i}
                onClick={() => addQuick(q)}
                disabled={adding}
                style={{
                  background: "var(--surface)", borderRadius: 16, padding: 16,
                  border: "2px solid var(--line)", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12,
                  opacity: adding ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: 32, lineHeight: 1 }}>{q.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>{q.label}</div>
                  {q.kcal > 0 && (
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--gold)" }}>-{q.kcal} 卡</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
            今天記錄了
          </div>
          {logs.length === 0 ? (
            <div style={{
              background: "var(--surface)", borderRadius: 16, padding: 30,
              border: "1px dashed var(--line-strong)", textAlign: "center",
              color: "var(--ink-3)", fontSize: "var(--fs-sm)",
            }}>
              還沒有運動記錄，按上方快速記錄試試吧
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {logs.map((l) => (
                <div key={l.id} style={{
                  background: "var(--surface)", borderRadius: 16, padding: 14,
                  border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: "var(--sage-soft)",
                    fontSize: 28, lineHeight: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>🏃</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                      {new Date(l.performed_at).toTimeString().substring(0, 5)}
                    </div>
                    <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{l.exercise_type} · {l.minutes} 分</div>
                  </div>
                  <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--gold)" }}>
                    -{l.kcal_burned} 卡
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </SubPage>
  );
}
