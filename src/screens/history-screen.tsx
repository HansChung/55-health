"use client";

import { useEffect, useState } from "react";
import { api, type MealRecord } from "@/lib/api-client";

interface HistoryScreenProps {
  onMeal: (meal: MealRecord) => void;
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "點心",
};

export function HistoryScreen({ onMeal }: HistoryScreenProps) {
  const [mealsByDay, setMealsByDay] = useState<{ date: string; label: string; meals: MealRecord[]; totalCal: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listMeals(7)
      .then(({ meals }) => {
        // 按日期分組
        const groups = new Map<string, MealRecord[]>();
        for (const m of meals) {
          const day = m.eaten_at.substring(0, 10);
          const arr = groups.get(day) ?? [];
          arr.push(m);
          groups.set(day, arr);
        }
        const today = new Date();
        const todayStr = today.toISOString().substring(0, 10);
        const yesterday = new Date(today.getTime() - 86400000).toISOString().substring(0, 10);

        const sorted = Array.from(groups.entries())
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, meals]) => {
            const d = new Date(date);
            const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
            const label = date === todayStr
              ? `今天 · ${monthDay}`
              : date === yesterday
              ? `昨天 · ${monthDay}`
              : `${monthDay} · 星期${["日", "一", "二", "三", "四", "五", "六"][d.getDay()]}`;
            return {
              date,
              label,
              meals,
              totalCal: meals.reduce((s, m) => s + m.total_cal, 0),
            };
          });
        setMealsByDay(sorted);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 計算週統計
  const weekTotal = mealsByDay.reduce((s, d) => s + d.totalCal, 0);
  const weekDays = mealsByDay.length;
  const weekMeals = mealsByDay.reduce((s, d) => s + d.meals.length, 0);
  const avgCal = weekDays > 0 ? Math.round(weekTotal / weekDays) : 0;

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
            <StatCol value={avgCal.toLocaleString()} label="平均熱量" unit="大卡" />
            <Divider />
            <StatCol value={`${weekDays}`} label="記錄天數" unit="/7 天" />
            <Divider />
            <StatCol value={`${weekMeals}`} label="記錄餐數" unit="餐" />
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 24px 0" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--ink-2)" }}>載入中…</div>
        )}
        {error && (
          <div style={{ padding: 16, background: "var(--berry-soft)", borderRadius: 12, color: "var(--berry)" }}>
            載入失敗：{error}
          </div>
        )}
        {!loading && mealsByDay.length === 0 && (
          <div style={{
            background: "var(--surface)", borderRadius: "var(--r-lg)",
            padding: 40, textAlign: "center", border: "1px dashed var(--line-strong)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📔</div>
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 4 }}>還沒有記錄</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              拍張食物照片開始記錄吧！
            </div>
          </div>
        )}
        {mealsByDay.map((day, di) => (
          <div key={di} style={{ marginBottom: 28 }}>
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              marginBottom: 12, padding: "0 4px",
            }}>
              <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700 }}>
                {day.label}
              </div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 700, color: "var(--primary-deep)" }}>{day.totalCal}</span>
                <span> 大卡</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {day.meals.map((m) => (
                <button key={m.id} onClick={() => onMeal(m)} style={{
                  textAlign: "left",
                  background: "var(--surface)",
                  borderRadius: 16, padding: 14,
                  border: "1px solid var(--line)",
                  display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "var(--shadow-sm)",
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 12,
                    background: (m.items[0]?.color ?? "#E8845A") + "22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, flexShrink: 0,
                  }}>{m.items[0]?.emoji ?? "🍽"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                      {MEAL_LABEL[m.meal_type]}　·　{m.eaten_at.substring(11, 16)}
                    </div>
                    <div style={{
                      fontSize: "var(--fs-base)", fontWeight: 600,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{m.items.map((it) => it.name).join("、")}</div>
                  </div>
                  <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--primary-deep)" }}>
                    {m.total_cal}<span style={{ fontSize: 12, color: "var(--ink-3)" }}> 卡</span>
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

function StatCol({ value, label, unit }: { value: string; label: string; unit: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--primary-deep)", letterSpacing: "-0.5px" }}>
        {value}
      </div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>{unit}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: "var(--line)" }} />;
}
