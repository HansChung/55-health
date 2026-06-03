"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { LockedFeatureCard } from "@/components/locked-feature-card";
import { SubPage } from "@/components/sub-page";
import { hasFeature, type SubscriptionTier } from "@/lib/feature-gates";
import type { HealthAlert } from "@/lib/health-alerts";
import { api, type PersistedAlert } from "@/lib/api-client";

interface AlertsCenterScreenProps {
  alerts: HealthAlert[];
  tier: SubscriptionTier;
  onBack: () => void;
}

const SEVERITY_STYLE: Record<
  string,
  { bg: string; border: string; dot: string; label: string }
> = {
  critical: { bg: "#FBE8EC", border: "#E4A9B5", dot: "var(--berry)", label: "需要注意" },
  warning: { bg: "#FFF3DF", border: "var(--gold-soft)", dot: "var(--gold)", label: "提醒" },
  info: { bg: "var(--sage-soft)", border: "#B5D2B0", dot: "var(--sage)", label: "通知" },
};

const TYPE_EMOJI: Record<string, string> = {
  inactivity: "📭",
  blood_pressure: "🩺",
  blood_glucose: "🩸",
  weight_change: "⚖️",
  missed_medication: "💊",
};

export function AlertsCenterScreen({ alerts, tier, onBack }: AlertsCenterScreenProps) {
  const allowed = hasFeature(tier, "alerts_center");

  const [guardianAlerts, setGuardianAlerts] = useState<PersistedAlert[]>([]);
  const [loadingGuardian, setLoadingGuardian] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) {
      setLoadingGuardian(false);
      return;
    }
    api
      .listAlerts()
      .then(({ alerts }) => setGuardianAlerts(alerts))
      .catch((e) => console.warn("[alerts] load guardian alerts failed:", e))
      .finally(() => setLoadingGuardian(false));
  }, [allowed]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    // 樂觀更新
    setGuardianAlerts((arr) =>
      arr.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
    try {
      await api.resolveAlert(id);
    } catch (e) {
      console.error(e);
      // 失敗回滾
      setGuardianAlerts((arr) =>
        arr.map((a) => (a.id === id ? { ...a, resolved: false } : a))
      );
    }
    setResolvingId(null);
  };

  const activeGuardian = guardianAlerts.filter((a) => !a.resolved);
  const resolvedGuardian = guardianAlerts.filter((a) => a.resolved);

  return (
    <SubPage
      title="安全提醒中心"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
    >
      {!allowed ? (
        <LockedFeatureCard
          feature="alerts_center"
          title="完整提醒中心"
          description="升級後可集中查看血壓、血糖、用藥與記錄狀態，不漏掉重要提醒。"
        />
      ) : (
        <>
          {/* ── 守護紀錄（後端 cron 偵測 + 已通知家人）── */}
          <SectionTitle
            title="守護紀錄"
            subtitle="暖暖偵測到的異常，已通知家人"
          />

          {loadingGuardian ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--ink-2)" }}>
              載入中…
            </div>
          ) : activeGuardian.length === 0 && resolvedGuardian.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 38, marginBottom: 8 }}>🛡️</div>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>
                目前一切正常
              </div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>
                暖暖每天都會自動守護，<br />
                若有異常會通知您的家人。
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {activeGuardian.map((a) => (
                <GuardianCard
                  key={a.id}
                  alert={a}
                  onResolve={handleResolve}
                  resolving={resolvingId === a.id}
                />
              ))}
              {resolvedGuardian.length > 0 && (
                <>
                  <div style={{
                    fontSize: "var(--fs-xs)", color: "var(--ink-3)",
                    fontWeight: 700, marginTop: 4,
                  }}>
                    已處理（{resolvedGuardian.length}）
                  </div>
                  {resolvedGuardian.slice(0, 5).map((a) => (
                    <GuardianCard key={a.id} alert={a} onResolve={handleResolve} resolving={false} />
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── 今日即時提醒（前端計算）── */}
          <SectionTitle title="今日提醒" subtitle="根據今天的記錄即時整理" />

          {alerts.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 38, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>今天沒有提醒</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 6 }}>
                狀態看起來不錯，繼續保持。
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {alerts.map((alert) => (
                <div key={alert.id} className="card" style={{
                  padding: 18,
                  border: alert.level === "warning" ? "1px solid var(--gold-soft)" : "1px solid var(--line)",
                  background: alert.level === "warning" ? "#FFF3DF" : "var(--surface)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: "var(--surface)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon name={alert.level === "warning" ? "bell" : "sparkle"} size={22} color="var(--primary-deep)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>{alert.title}</div>
                      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, marginTop: 4 }}>
                        {alert.message}
                      </div>
                      {alert.action && (
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--primary-deep)", fontWeight: 800, marginTop: 8 }}>
                          建議：{alert.action}
                        </div>
                      )}
                    </div>
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

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 12, marginTop: 4 }}>
      <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)" }}>
        {title}
      </div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>
        {subtitle}
      </div>
    </div>
  );
}

function GuardianCard({
  alert,
  onResolve,
  resolving,
}: {
  alert: PersistedAlert;
  onResolve: (id: string) => void;
  resolving: boolean;
}) {
  const style = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.warning;
  const emoji = TYPE_EMOJI[alert.alert_type] ?? "⚠️";
  const dim = alert.resolved;

  return (
    <div className="card" style={{
      padding: 16,
      border: `1px solid ${dim ? "var(--line)" : style.border}`,
      background: dim ? "var(--surface)" : style.bg,
      opacity: dim ? 0.6 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 22,
        }}>{emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>{alert.title}</span>
            {!dim && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                background: style.dot, padding: "2px 8px", borderRadius: 8,
              }}>{style.label}</span>
            )}
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, marginTop: 4 }}>
            {alert.message}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
              {formatTime(alert.created_at)}
              {alert.notified_family.length > 0 && ` · 已通知 ${alert.notified_family.length} 位家人`}
            </span>
          </div>
          {!alert.resolved && (
            <button
              onClick={() => onResolve(alert.id)}
              disabled={resolving}
              style={{
                marginTop: 10, padding: "8px 16px",
                background: "var(--surface)",
                border: "1px solid var(--line-strong)",
                borderRadius: 999,
                fontSize: "var(--fs-sm)", fontWeight: 700,
                color: "var(--ink-1)", cursor: "pointer",
                opacity: resolving ? 0.5 : 1,
              }}
            >
              {resolving ? "處理中…" : "✓ 標記已處理"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
