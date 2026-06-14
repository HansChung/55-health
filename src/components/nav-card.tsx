"use client";

// ────────────────────────────────────────────────
// 首頁導覽卡片 — 統一「圖示方塊 + 標題 + 副標 + 箭頭」的入口樣式
// 給智慧幸福檢測、健康成就等首頁入口共用
// ────────────────────────────────────────────────

import { Icon } from "@/components/icons";

interface NavCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  /** 卡片漸層背景，預設暖色 */
  background?: string;
  /** 邊框色 */
  borderColor?: string;
  /** 圖示方塊底色 */
  iconBg?: string;
}

export function NavCard({
  emoji,
  title,
  subtitle,
  onClick,
  background = "linear-gradient(135deg, #FFF9EF 0%, #FFFFFF 100%)",
  borderColor = "var(--gold-soft)",
  iconBg = "var(--primary-soft)",
}: NavCardProps) {
  return (
    <div style={{ padding: "18px 24px 0" }}>
      <button
        onClick={onClick}
        style={{
          width: "100%",
          textAlign: "left",
          background,
          borderRadius: "var(--r-lg)",
          padding: 18,
          border: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)" }}>
            {title}
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        <Icon name="chevronR" size={20} color="var(--ink-3)" />
      </button>
    </div>
  );
}
