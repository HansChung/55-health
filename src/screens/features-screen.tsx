"use client";

// ────────────────────────────────────────────────
// 全部功能（底部「功能」分頁）：分 6 類、每類一排大按鈕
// 沒給動作的功能（後台關掉）不顯示；整類都沒有就整類不顯示
// ────────────────────────────────────────────────

import { FeatureTile } from "@/components/feature-tile";
import { MENU_GROUPS, recordMenuUse, type MenuId } from "@/lib/feature-menu";

export type MenuActions = Partial<Record<MenuId, () => void>>;

export function FeaturesScreen({ actions }: { actions: MenuActions }) {
  const open = (id: MenuId) => {
    recordMenuUse(id);
    actions[id]?.();
  };
  return (
    <div className="scroll-area" style={{ flex: 1, overflowY: "auto", paddingBottom: 140 }}>
      <div style={{ padding: "8px 24px 4px" }}>
        <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: 0 }}>全部功能</h1>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 4 }}>點一下就打開，常用的會自動出現在首頁</div>
      </div>
      {MENU_GROUPS.map((g) => {
        const items = g.items.filter((id) => actions[id]);
        if (items.length === 0) return null;
        return (
          <section key={g.id} aria-label={g.label} style={{ padding: "20px 24px 0" }}>
            <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: 800, margin: "0 0 12px" }}>{g.label}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {items.map((id) => <FeatureTile key={id} id={id} onClick={() => open(id)} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
