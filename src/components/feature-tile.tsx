"use client";

// 功能大按鈕（全部功能頁、首頁常用共用）：大圖示、名稱、一行說明
import { MENU_ITEMS, type MenuId } from "@/lib/feature-menu";

export function FeatureTile({ id, onClick, showDesc = true }: { id: MenuId; onClick: () => void; showDesc?: boolean }) {
  const item = MENU_ITEMS[id];
  return (
    <button
      type="button"
      onClick={onClick}
      className="card"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "16px 8px", minHeight: showDesc ? 124 : 104, width: "100%", textAlign: "center", cursor: "pointer",
        border: "1px solid var(--line)", fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 36, lineHeight: 1.1 }} aria-hidden="true">{item.emoji}</span>
      <span style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", lineHeight: 1.3 }}>{item.label}</span>
      {showDesc && <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.35 }}>{item.desc}</span>}
    </button>
  );
}
