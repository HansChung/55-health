"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { api, type WeeklyReport } from "@/lib/api-client";

interface WeeklyReportScreenProps {
  onBack: () => void;
}

export function WeeklyReportScreen({ onBack }: WeeklyReportScreenProps) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getWeeklyReport()
      .then(({ report }) => setReport(report))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SubPage
      title="每週健康報告"
      onBack={onBack}
      accent="linear-gradient(180deg, #DCEBD8 0%, transparent 100%)"
    >
      {loading && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-2)" }}>整理本週報告中…</div>
      )}
      {error && (
        <div style={{ padding: 16, background: "var(--berry-soft)", borderRadius: 14, color: "var(--berry)" }}>
          載入失敗：{error}
        </div>
      )}
      {!loading && report && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 20, background: "linear-gradient(135deg, #FFF9EF 0%, #FFFFFF 100%)" }}>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 6 }}>
              過去 7 天摘要
            </div>
            <div style={{ fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--ink-1)" }}>
              記錄 {report.meals.days_logged}/7 天
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 6 }}>
              平均每天 {report.meals.avg_calories.toLocaleString()} 大卡
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SummaryCard icon="flame" color="var(--primary)" label="飲食記錄" value={`${report.meals.meals_count}`} unit="餐" />
            <SummaryCard icon="heart" color="#7AA779" label="運動時間" value={`${report.exercise.minutes}`} unit="分鐘" />
          </div>

          <div className="card" style={{ padding: 18 }}>
            <SectionTitle icon="target" title="營養總量" />
            <MetricLine label="蛋白質" value={`${report.meals.protein_g} g`} color="var(--primary)" />
            <MetricLine label="醣類" value={`${report.meals.carb_g} g`} color="var(--gold)" />
            <MetricLine label="脂肪" value={`${report.meals.fat_g} g`} color="#7AA779" />
          </div>

          <div className="card" style={{ padding: 18 }}>
            <SectionTitle icon="heart" title="健康數值" />
            <MetricLine
              label="體重"
              value={report.health.weight?.latest ? `${report.health.weight.latest} 公斤${formatChange(report.health.weight.change)}` : "尚無資料"}
              color="#7AA779"
            />
            <MetricLine
              label="血壓"
              value={report.health.blood_pressure?.systolic
                ? `${report.health.blood_pressure.systolic}/${report.health.blood_pressure.diastolic} · ${report.health.blood_pressure.status}`
                : "尚無資料"}
              color="var(--berry)"
            />
            <MetricLine
              label="血糖"
              value={report.health.blood_glucose?.value
                ? `${report.health.blood_glucose.value} mg/dL · ${report.health.blood_glucose.status}`
                : "尚無資料"}
              color="var(--gold)"
            />
          </div>

          <div className="card" style={{ padding: 18, background: "var(--surface-warm)" }}>
            <SectionTitle icon="sparkle" title="暖暖下週小提醒" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {report.tips.map((tip, index) => (
                <div key={index} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  fontSize: "var(--fs-base)", lineHeight: 1.5, color: "var(--ink-1)",
                }}>
                  <span style={{ color: "var(--primary-deep)", fontWeight: 800 }}>{index + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {report.family_summary && report.family_summary.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <SectionTitle icon="user" title="給家人的摘要" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {report.family_summary.map((line, index) => (
                  <div key={index} style={{
                    fontSize: "var(--fs-base)", lineHeight: 1.55,
                    color: "var(--ink-1)", padding: 12,
                    background: "var(--surface-warm)", borderRadius: 12,
                  }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SubPage>
  );
}

function SummaryCard({ icon, color, label, value, unit }: {
  icon: string;
  color: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <Icon name={icon} size={26} color={color} />
      <div style={{ marginTop: 10, fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--ink-1)" }}>
        {value}<span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Icon name={icon} size={20} color="var(--primary-deep)" />
      <div style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>{title}</div>
    </div>
  );
}

function MetricLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 12,
      padding: "10px 0", borderTop: "1px solid var(--line)",
      fontSize: "var(--fs-base)",
    }}>
      <span style={{ color: "var(--ink-2)" }}>{label}</span>
      <span style={{ color, fontWeight: 800, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function formatChange(change: number | null) {
  if (!change) return "";
  return change > 0 ? `（+${change}）` : `（${change}）`;
}
