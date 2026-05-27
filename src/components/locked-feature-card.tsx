"use client";

import { FeatureKey, requiredTierLabel } from "@/lib/feature-gates";
import { Icon } from "./icons";

interface LockedFeatureCardProps {
  feature: FeatureKey;
  title: string;
  description: string;
  compact?: boolean;
}

export function LockedFeatureCard({ feature, title, description, compact = false }: LockedFeatureCardProps) {
  return (
    <div style={{
      padding: compact ? 14 : 18,
      borderRadius: "var(--r-lg)",
      background: "linear-gradient(135deg, #FFF9EF 0%, #FFFFFF 100%)",
      border: "1px solid var(--gold-soft)",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: "var(--primary-soft)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name="lock" size={22} color="var(--primary-deep)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)" }}>{title}</div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, marginTop: 4 }}>
          {description}
        </div>
        <button
          onClick={() => { window.location.href = "/pricing"; }}
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 999,
            background: "var(--primary)",
            color: "#fff",
            fontSize: "var(--fs-sm)",
            fontWeight: 800,
          }}
        >
          升級{requiredTierLabel(feature)}
        </button>
      </div>
    </div>
  );
}
