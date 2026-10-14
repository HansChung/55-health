"use client";

// ────────────────────────────────────────────────
// 首頁「常用」：4 個大按鈕（這支手機最常用的，一開始是預設的 4 個）＋「全部功能」
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { FeatureTile } from "@/components/feature-tile";
import { pickFavorites, readMenuUsage, recordMenuUse, type MenuId, type MenuUsage } from "@/lib/feature-menu";
import type { MenuActions } from "@/screens/features-screen";

export function FavoriteFeatures({ actions, onAll }: { actions: MenuActions; onAll: () => void }) {
  // localStorage 只在瀏覽器讀得到：掛載後才換成真正的使用紀錄（伺服器先用預設）
  const [usage, setUsage] = useState<MenuUsage>({});
  useEffect(() => setUsage(readMenuUsage()), []);
  const available = (Object.keys(actions) as MenuId[]).filter((id) => actions[id]);
  const favorites = pickFavorites(usage, available);
  if (favorites.length === 0) return null;

  return (
    <section aria-label="常用" style={{ padding: "24px 24px 0" }}>
      <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: 700, margin: "0 0 12px" }}>常用</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {favorites.map((id) => (
          <FeatureTile key={id} id={id} showDesc={false} onClick={() => { recordMenuUse(id); actions[id]?.(); }} />
        ))}
      </div>
      <button type="button" onClick={onAll} className="btn-ghost" style={{ width: "100%", marginTop: 12, minHeight: 60 }}>
        ▦ 全部功能
      </button>
    </section>
  );
}
