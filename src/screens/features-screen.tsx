"use client";

// ────────────────────────────────────────────────
// 功能分頁（底部「功能」）：生活羅盤
// 上面找功能（打字或用說的）→ 羅盤（中間暖暖、周圍書本 SMART 五個方向，點一個就展開那一類大按鈕）
// → 下面「全部功能」清單（照 MENU_GROUPS，不習慣羅盤的人也找得到）
// 沒給動作的功能（後台關掉）不顯示；方向／整類都沒有就不顯示
// ────────────────────────────────────────────────

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DictationButton } from "@/components/dictation-button";
import { FeatureTile } from "@/components/feature-tile";
import { Mascot } from "@/components/mascot";
import {
  COMPASS_CENTER,
  COMPASS_DIRECTIONS,
  MENU_GROUPS,
  recordMenuUse,
  searchMenu,
  type MenuId,
} from "@/lib/feature-menu";

export type MenuActions = Partial<Record<MenuId, () => void>>;

/** 羅盤上點的是中間的暖暖（center）或某個方向（S/M/A/R/T） */
type CompassPick = "center" | (typeof COMPASS_DIRECTIONS)[number]["key"];

const PICK_KEY = "nuannuan_compass_pick";

const CENTER = {
  label: "問暖暖",
  smartLabel: "羅盤中間・暖暖",
  color: "var(--primary)",
  desc: "不知道在哪裡？直接問暖暖",
};

function readPick(): CompassPick | null {
  try {
    const v = sessionStorage.getItem(PICK_KEY);
    if (v === "center" || COMPASS_DIRECTIONS.some((d) => d.key === v)) return v as CompassPick;
  } catch { /* 私密瀏覽 */ }
  return null;
}

const tileGrid: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

export function FeaturesScreen({ actions }: { actions: MenuActions }) {
  const [pick, setPick] = useState<CompassPick | null>(null);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  // 回到功能分頁時記得上次點的方向（只在這個分頁期間）
  useEffect(() => setPick(readPick()), []);

  const has = (id: MenuId) => Boolean(actions[id]);
  const available = (Object.keys(actions) as MenuId[]).filter(has);
  const centerItems = COMPASS_CENTER.filter(has);
  const directions = COMPASS_DIRECTIONS.map((d) => ({ ...d, items: d.items.filter(has) })).filter((d) => d.items.length > 0);

  const open = (id: MenuId) => {
    recordMenuUse(id);
    actions[id]?.();
  };
  const choose = (p: CompassPick) => {
    setPick(p);
    try { sessionStorage.setItem(PICK_KEY, p); } catch { /* 存不了就算了 */ }
    // 展開的大按鈕在羅盤下面：捲過去讓長輩看到
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const picked = pick === "center"
    ? (centerItems.length > 0 ? { ...CENTER, items: centerItems } : null)
    : directions.find((d) => d.key === pick) ?? null;

  const searching = query.trim().length > 0;
  const results = searching ? searchMenu(query, available) : [];

  return (
    <div className="scroll-area" style={{ flex: 1, overflowY: "auto", paddingBottom: 140 }}>
      <div style={{ padding: "8px 24px 4px" }}>
        <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: 0 }}>生活羅盤</h1>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 4, lineHeight: 1.5 }}>
          點一個方向，看看裡面有什麼。常用的會自動出現在首頁
        </div>
      </div>

      <section aria-label="找功能" style={{ padding: "16px 24px 0" }}>
        <label htmlFor="feature-search" style={{ display: "block", fontSize: "var(--fs-base)", fontWeight: 800, marginBottom: 8 }}>
          🔎 找功能
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <input
            id="feature-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 40))}
            placeholder="例如：血壓、詐騙、影片"
            enterKeyHint="search"
            style={{
              flex: 1, minWidth: 0, minHeight: 60, padding: "0 16px", fontSize: "var(--fs-base)", fontFamily: "inherit",
              color: "var(--ink-1)", background: "var(--surface)", border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
            }}
          />
          {searching && (
            <button type="button" onClick={() => setQuery("")} className="btn-ghost" style={{ minHeight: 60, minWidth: 72, padding: "0 12px" }}>
              清除
            </button>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <DictationButton where="features_search" onText={(t) => setQuery(t.slice(0, 40))} />
        </div>
      </section>

      {searching ? (
        <section aria-label="找到的功能" aria-live="polite" style={{ padding: "20px 24px 0" }}>
          {results.length > 0 ? (
            <>
              <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: 800, margin: "0 0 12px" }}>找到 {results.length} 個</h2>
              <div style={tileGrid}>
                {results.map((id) => <FeatureTile key={id} id={id} onClick={() => open(id)} />)}
              </div>
            </>
          ) : (
            <div className="card" style={{ border: "1px solid var(--line)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>找不到「{query.trim()}」</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>換個說法試試，或直接問暖暖</div>
              {actions.ask && (
                <button type="button" onClick={() => open("ask")} className="btn-primary" style={{ width: "100%", marginTop: 14, minHeight: 60 }}>
                  💬 問暖暖
                </button>
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          <Compass
            directions={directions}
            centerEnabled={centerItems.length > 0}
            pick={pick}
            onPick={choose}
          />
          <section ref={panelRef} aria-label={picked ? picked.label : "怎麼用羅盤"} aria-live="polite" style={{ padding: "8px 24px 0", scrollMarginBottom: 120 }}>
            {picked ? (
              <div style={{ borderLeft: `6px solid ${picked.color}`, paddingLeft: 14 }}>
                <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: 0 }}>{picked.label}</h2>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "4px 0 14px", lineHeight: 1.5 }}>
                  {picked.desc}（{picked.smartLabel}）
                </div>
                <div style={tileGrid}>
                  {picked.items.map((id) => <FeatureTile key={id} id={id} onClick={() => open(id)} />)}
                </div>
              </div>
            ) : (
              <div className="card" style={{ border: "1px dashed var(--line-strong)", textAlign: "center", fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
                👆 點羅盤上的一個方向，<br />或點中間的暖暖
              </div>
            )}
          </section>
        </>
      )}

      <div style={{ padding: "36px 24px 0" }}>
        <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: 0 }}>📋 全部功能</h2>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 4 }}>照種類排，一樣點一下就打開</div>
      </div>
      {MENU_GROUPS.map((g) => {
        const items = g.items.filter(has);
        if (items.length === 0) return null;
        return (
          <section key={g.id} aria-label={g.label} style={{ padding: "20px 24px 0" }}>
            <h3 style={{ fontSize: "var(--fs-lg)", fontWeight: 800, margin: "0 0 12px" }}>{g.label}</h3>
            <div style={tileGrid}>
              {items.map((id) => <FeatureTile key={id} id={id} onClick={() => open(id)} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── 羅盤：方向照數量平均排一圈（從正上方順時針），中間是暖暖 ──

/** 方向按鈕中心離羅盤中心多遠（羅盤寬度的 %） */
const RADIUS = 35.5;

function Compass({
  directions,
  centerEnabled,
  pick,
  onPick,
}: {
  directions: typeof COMPASS_DIRECTIONS;
  centerEnabled: boolean;
  pick: CompassPick | null;
  onPick: (p: CompassPick) => void;
}) {
  const spots = directions.map((d, i) => {
    const angle = (i / directions.length) * 2 * Math.PI;
    // 取到小數兩位：伺服器和瀏覽器算出來的最後一位會不一樣（hydration 對不上）
    const at = (v: number) => Math.round(v * 100) / 100;
    return { d, x: at(50 + RADIUS * Math.sin(angle)), y: at(50 - RADIUS * Math.cos(angle)) };
  });
  return (
    <section aria-label="生活羅盤" style={{ padding: "20px 16px 0" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 380, margin: "0 auto", aspectRatio: "1 / 1" }}>
        <svg viewBox="0 0 100 100" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <circle cx="50" cy="50" r="47" fill="var(--surface-warm)" stroke="var(--line-strong)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
          {spots.map(({ d, x, y }) => (
            <line key={d.key} x1="50" y1="50" x2={x} y2={y} stroke={d.color} strokeWidth={pick === d.key ? 2.2 : 1.2} strokeLinecap="round" />
          ))}
        </svg>

        <button
          type="button"
          onClick={() => centerEnabled && onPick("center")}
          disabled={!centerEnabled}
          aria-pressed={pick === "center"}
          aria-label={centerEnabled ? "暖暖：問暖暖" : "暖暖"}
          style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: "31%", aspectRatio: "1 / 1", borderRadius: "50%", padding: 4,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            background: pick === "center" ? "var(--primary-soft)" : "var(--surface)",
            border: `3px solid ${pick === "center" ? "var(--primary-deep)" : "var(--primary)"}`,
            boxShadow: pick === "center" ? "var(--shadow-lg)" : "var(--shadow-md)",
            cursor: centerEnabled ? "pointer" : "default", fontFamily: "inherit",
          }}
        >
          <Mascot size={48} mood="happy" />
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-1)", lineHeight: 1.2 }}>
            {centerEnabled ? "問暖暖" : "暖暖"}
          </span>
        </button>

        {spots.map(({ d, x, y }) => {
          const on = pick === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onPick(d.key)}
              aria-pressed={on}
              aria-label={`${d.label}（${d.smartLabel}）`}
              style={{
                position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)",
                width: "31%", minHeight: 64, padding: "8px 4px", borderRadius: 18,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                // 選到的方向：底色淡淡的方向色（color 都是 #RRGGBB；疊在白底上，後面的線才不會透出來）
                background: on ? `linear-gradient(${d.color}40, ${d.color}40) var(--surface)` : "var(--surface)",
                border: `3px solid ${d.color}`,
                boxShadow: on ? "var(--shadow-lg)" : "var(--shadow-sm)",
                cursor: "pointer", fontFamily: "inherit", textAlign: "center",
              }}
            >
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-1)", lineHeight: 1.25 }}>{d.label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-2)", lineHeight: 1.2 }}>{d.smartLabel}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
