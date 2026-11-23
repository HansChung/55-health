"use client";

// 功能大按鈕（全部功能頁、首頁常用共用）：大圖示、名稱、一行說明
// FeatureTileGrid：兩欄排好，同一列一樣高；單數的最後一個橫著佔滿一列（不會右邊空一格）
import { MENU_ITEMS, type MenuId } from "@/lib/feature-menu";

export function FeatureTile({
  id,
  onClick,
  showDesc = true,
  wide = false,
}: {
  id: MenuId;
  onClick: () => void;
  showDesc?: boolean;
  /** 橫式：圖示在左、字在右，佔滿整列 */
  wide?: boolean;
}) {
  const item = MENU_ITEMS[id];
  return (
    <button
      type="button"
      onClick={onClick}
      className="card"
      style={{
        display: "flex", alignItems: "center", cursor: "pointer", fontFamily: "inherit",
        border: "1px solid var(--line)", width: "100%", height: "100%",
        ...(wide
          ? { flexDirection: "row", justifyContent: "center", gap: 16, padding: "14px 16px", minHeight: 92, textAlign: "left", gridColumn: "1 / -1" }
          // 從上面排下來（不是置中）：說明折成兩行時，同一列的圖示和名稱還是對齊
          : { flexDirection: "column", justifyContent: "flex-start", gap: 4, padding: "16px 8px", minHeight: showDesc ? 124 : 104, textAlign: "center" }),
      }}
    >
      <span style={{ fontSize: 36, lineHeight: 1.1, flexShrink: 0 }} aria-hidden="true">{item.emoji}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: wide ? 2 : 4, minWidth: 0 }}>
        <span style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", lineHeight: 1.3 }}>{item.label}</span>
        {showDesc && <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.35 }}>{item.desc}</span>}
      </span>
    </button>
  );
}

export function FeatureTileGrid({ ids, onOpen }: { ids: MenuId[]; onOpen: (id: MenuId) => void }) {
  const odd = ids.length % 2 === 1;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {ids.map((id, i) => (
        <FeatureTile key={id} id={id} wide={odd && i === ids.length - 1} onClick={() => onOpen(id)} />
      ))}
    </div>
  );
}
