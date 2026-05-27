"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { LockedFeatureCard } from "@/components/locked-feature-card";
import { SubPage } from "@/components/sub-page";
import { api, type WeeklyReport } from "@/lib/api-client";
import { hasFeature, type SubscriptionTier } from "@/lib/feature-gates";

interface WeeklyReportScreenProps {
  onBack: () => void;
  tier: SubscriptionTier;
}

export function WeeklyReportScreen({ onBack, tier }: WeeklyReportScreenProps) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    if (!hasFeature(tier, "weekly_report")) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api.getWeeklyReport()
      .then(({ report }) => setReport(report))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [tier]);

  const handleShare = async () => {
    if (!report) return;
    const text = buildLineShareText(report);
    try {
      if (navigator.share) {
        await navigator.share({ title: "暖暖每週健康報告", text });
        setShareMessage("已開啟分享，選 LINE 傳給家人即可。");
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareMessage("已複製摘要，請貼到 LINE 傳給家人。");
    } catch {
      setShareMessage("分享未完成，可以稍後再試一次。");
    }
  };

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
      {!loading && !hasFeature(tier, "weekly_report") && (
        <LockedFeatureCard
          feature="weekly_report"
          title="每週進階健康報告"
          description="升級專業版後，可查看完整週報、家人摘要與 LINE 分享文字。"
        />
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

          {hasFeature(tier, "line_share") ? (
            <div className="card" style={{ padding: 18, background: "linear-gradient(135deg, #DCEBD8 0%, #FFFFFF 100%)" }}>
              <SectionTitle icon="user" title="分享給家人" />
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 12 }}>
                產生適合貼到 LINE 的簡短摘要，讓家人快速掌握本週狀況。
              </div>
              <button
                onClick={handleShare}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 999,
                  background: "#06C755",
                  color: "#fff",
                  fontSize: "var(--fs-base)",
                  fontWeight: 800,
                }}
              >
                分享給家人
              </button>
              {shareMessage && (
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--primary-deep)", fontWeight: 700, marginTop: 10 }}>
                  {shareMessage}
                </div>
              )}
            </div>
          ) : (
            <LockedFeatureCard
              feature="line_share"
              title="LINE 分享給家人"
              description="升級專業版後，可一鍵產生 LINE 摘要文字給家人。"
              compact
            />
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

function buildLineShareText(report: WeeklyReport) {
  const bloodPressure = report.health.blood_pressure?.status ?? "尚無血壓資料";
  const glucose = report.health.blood_glucose?.status ?? "尚無血糖資料";
  const familySummaryLines = report.family_summary ?? [];
  const familySummary = familySummaryLines.length > 0
    ? familySummaryLines.map((line) => `- ${line}`).join("\n")
    : "- 本週資料還不多，建議先協助持續記錄。";

  return [
    "暖暖每週健康摘要",
    `本週記錄：${report.meals.days_logged}/7 天，共 ${report.meals.meals_count} 餐`,
    `平均熱量：每天 ${report.meals.avg_calories.toLocaleString()} 大卡`,
    `運動時間：${report.exercise.minutes} 分鐘`,
    `血壓狀態：${bloodPressure}`,
    `血糖狀態：${glucose}`,
    "",
    "給家人的重點：",
    familySummary,
  ].join("\n");
}
