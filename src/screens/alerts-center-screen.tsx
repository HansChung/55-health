"use client";

import { Icon } from "@/components/icons";
import { LockedFeatureCard } from "@/components/locked-feature-card";
import { SubPage } from "@/components/sub-page";
import { hasFeature, type SubscriptionTier } from "@/lib/feature-gates";
import type { HealthAlert } from "@/lib/health-alerts";

interface AlertsCenterScreenProps {
  alerts: HealthAlert[];
  tier: SubscriptionTier;
  onBack: () => void;
}

export function AlertsCenterScreen({ alerts, tier, onBack }: AlertsCenterScreenProps) {
  const allowed = hasFeature(tier, "alerts_center");

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
      ) : alerts.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>✓</div>
          <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>目前沒有重要提醒</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 6 }}>
            今天狀態看起來不錯，繼續保持。
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
    </SubPage>
  );
}
