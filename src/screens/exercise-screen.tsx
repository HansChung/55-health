"use client";

import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";

interface ExerciseScreenProps {
  onBack: () => void;
}

export function ExerciseScreen({ onBack }: ExerciseScreenProps) {
  const logs = [
    { label: "散步", minutes: 30, kcal: 95, time: "06:30", icon: "🚶" },
    { label: "伸展操", minutes: 10, kcal: 22, time: "08:00", icon: "🧘" },
  ];
  const totalMin = logs.reduce((s, l) => s + l.minutes, 0);
  const totalKcal = logs.reduce((s, l) => s + l.kcal, 0);
  const goalMin = 60;
  const pct = Math.min((totalMin / goalMin) * 100, 100);

  return (
    <SubPage
      title="運動記錄"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
      footer={
        <button className="btn-primary" style={{ width: "100%" }}>
          <Icon name="plus" size={26} color="#fff" stroke={2.8} />
          新增運動
        </button>
      }
    >
      <div className="card" style={{
        padding: 20, marginBottom: 20,
        background: "linear-gradient(180deg, #FFF9EF 0%, #FFFFFF 100%)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 14,
        }}>
          <span style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>今天動了多少</span>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>目標 {goalMin} 分</span>
        </div>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 6,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--primary-deep)", letterSpacing: "-1px" }}>
            {totalMin}
          </span>
          <span style={{ fontSize: "var(--fs-lg)", color: "var(--ink-2)" }}>分鐘</span>
          <span style={{ marginLeft: "auto", fontSize: "var(--fs-base)", color: "var(--gold)", fontWeight: 700 }}>
            -{totalKcal} 大卡
          </span>
        </div>
        <div style={{
          height: 12, background: "var(--bg-deep)", borderRadius: 6, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #F4B58E, #E8845A)",
            borderRadius: 6, transition: "width 0.8s ease",
          }} />
        </div>
        <div style={{
          fontSize: "var(--fs-sm)", color: "var(--sage)",
          fontWeight: 700, marginTop: 10,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Icon name="check" size={20} color="var(--sage)" stroke={3} />
          已達標！繼續保持～
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 14 }}>這週運動</div>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 8,
          height: 110,
        }}>
          {[
            { d: "一", v: 45 }, { d: "二", v: 30 }, { d: "三", v: 0 },
            { d: "四", v: 55 }, { d: "五", v: 40 }, { d: "六", v: 65 },
            { d: "日", v: 40, today: true },
          ].map((b, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
            }}>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
                {b.v > 0 ? b.v : "-"}
              </div>
              <div style={{
                width: "100%", height: `${(b.v / 70) * 80}px`,
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
        {[
          { label: "散步 30 分", icon: "🚶", cal: 95 },
          { label: "太極拳", icon: "🥋", cal: 60 },
          { label: "伸展操", icon: "🧘", cal: 22 },
          { label: "其他運動", icon: "➕", cal: null as number | null },
        ].map((q, i) => (
          <button key={i} style={{
            background: "var(--surface)", borderRadius: 16, padding: 16,
            border: "2px solid var(--line)", textAlign: "left",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>{q.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>{q.label}</div>
              {q.cal !== null && (
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--gold)" }}>-{q.cal} 卡</div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
        今天記錄了
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {logs.map((l, i) => (
          <div key={i} style={{
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
            }}>{l.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{l.time}</div>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{l.label} · {l.minutes} 分</div>
            </div>
            <div style={{
              fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--gold)",
            }}>-{l.kcal} 卡</div>
          </div>
        ))}
      </div>
    </SubPage>
  );
}
