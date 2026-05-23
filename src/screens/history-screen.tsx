"use client";

import { Icon } from "@/components/icons";
import { HISTORY_DAYS } from "@/lib/mock-data";

interface HistoryScreenProps {
  onMeal: () => void;
}

export function HistoryScreen({ onMeal }: HistoryScreenProps) {
  const weekStats = [
    { label: "平均熱量", value: "1,460", unit: "大卡" },
    { label: "達標天數", value: "5", unit: "/7 天" },
    { label: "記錄餐數", value: "18", unit: "餐" },
  ];

  return (
    <div className="scroll-area" style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>
      <div style={{ padding: "8px 24px 16px" }}>
        <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          飲食日記
        </h1>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 4 }}>
          這週的記錄
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {weekStats.map((s, i) => (
              <div key={i} style={{ display: "contents" }}>
                {i > 0 && <div style={{ width: 1, background: "var(--line)" }} />}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--primary-deep)", letterSpacing: "-0.5px" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
                    {s.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 24px 0" }}>
        {HISTORY_DAYS.map((day, di) => (
          <div key={di} style={{ marginBottom: 28 }}>
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              marginBottom: 12, padding: "0 4px",
            }}>
              <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700 }}>
                {day.date}
              </div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 700, color: "var(--primary-deep)" }}>{day.cal}</span>
                <span> / {day.goal} 大卡</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {day.meals.map((m, mi) => (
                <button key={mi} onClick={onMeal} style={{
                  textAlign: "left",
                  background: "var(--surface)",
                  borderRadius: 16, padding: 14,
                  border: "1px solid var(--line)",
                  display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "var(--shadow-sm)",
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 12,
                    background: m.color + "22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, flexShrink: 0,
                  }}>{m.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                      {m.name}　·　{m.time}
                    </div>
                    <div style={{
                      fontSize: "var(--fs-base)", fontWeight: 600,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{m.items}</div>
                  </div>
                  <div style={{
                    fontSize: "var(--fs-base)", fontWeight: 700,
                    color: "var(--primary-deep)",
                  }}>
                    {m.cal}<span style={{ fontSize: 12, color: "var(--ink-3)" }}> 卡</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
