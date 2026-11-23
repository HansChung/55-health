"use client";

// ────────────────────────────────────────────────
// 功能分頁（底部「功能」）：生活羅盤
// 上面找功能（打字或用說的）→ 羅盤（中間暖暖、周圍書本 SMART 五個方向，點一個就展開那一類大按鈕）
// → 下面「全部功能」清單（照 MENU_GROUPS，不習慣羅盤的人也找得到）
// 沒給動作的功能（後台關掉）不顯示；方向／整類都沒有就不顯示
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { DictationButton } from "@/components/dictation-button";
import { FeatureTileGrid } from "@/components/feature-tile";
import { Mascot } from "@/components/mascot";
import {
  COMPASS_BUTTON,
  COMPASS_CENTER,
  COMPASS_CENTER_SIZE,
  COMPASS_DIRECTIONS,
  COMPASS_RADIUS,
  compassLayout,
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
  emoji: "🍊",
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
              <FeatureTileGrid ids={results} onOpen={open} />
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
              // 不縮排：這裡的大按鈕跟下面「全部功能」的左右邊對齊
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0, width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, lineHeight: 1, background: "var(--surface)", border: `3px solid ${picked.color}`,
                    }}
                  >
                    {picked.emoji}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{picked.label}</h2>
                    <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2, lineHeight: 1.4 }}>
                      {picked.desc}（{picked.smartLabel}）
                    </div>
                  </div>
                </div>
                <div aria-hidden="true" style={{ height: 5, borderRadius: 3, background: picked.color, margin: "12px 0 14px" }} />
                <FeatureTileGrid ids={picked.items} onOpen={open} />
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
            <FeatureTileGrid ids={items} onOpen={open} />
          </section>
        );
      })}
    </div>
  );
}

// ── 羅盤：方向照數量平均排在同一個圓環上（從正上方順時針），中間是暖暖 ──
// 位置、高度都在 compassLayout 算（單位＝羅盤寬度的 %）：每顆方向按鈕一樣大、中心都在環上，不會超出羅盤

/** 羅盤最寬幾 px；左右各留 24 */
const COMPASS_MAX = 380;
const COMPASS_GUTTER = 24;
/**
 * 羅盤裡的字：最大就是 max，窄螢幕（320）或開大字時跟著羅盤寬度縮，四個字才不會被按鈕切掉。
 * 用視窗寬度算羅盤寬度（min／calc 舊手機也支援；容器查詢單位 cqi 在舊的 Android WebView 沒有）
 */
const fit = (ratio: number, max: string) =>
  `min(${max}, calc((min(100vw, ${COMPASS_MAX + COMPASS_GUTTER * 2}px) - ${COMPASS_GUTTER * 2}px) * ${ratio}))`;

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
  const layout = compassLayout(directions.length);
  /** 直的位置：compassLayout 的 y 是寬度的 %，CSS 的 top 要換成高度的 % */
  const top = (y: number) => `${Math.round((y / layout.height) * 10000) / 100}%`;
  const spots = directions.map((d, i) => ({ d, ...layout.spots[i] }));
  return (
    <section aria-label="生活羅盤" style={{ padding: `20px ${COMPASS_GUTTER}px 0` }}>
      <div style={{ position: "relative", width: "100%", maxWidth: COMPASS_MAX, margin: "0 auto", aspectRatio: `100 / ${layout.height}` }}>
        <svg viewBox={`0 0 100 ${layout.height}`} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <circle cx={layout.cx} cy={layout.cy} r={COMPASS_RADIUS} fill="var(--surface-warm)" stroke="var(--line-strong)" strokeWidth="1" />
          {spots.map(({ d, x, y }) => (
            <line key={d.key} x1={layout.cx} y1={layout.cy} x2={x} y2={y} stroke={d.color} strokeWidth={pick === d.key ? 2.2 : 1.2} strokeLinecap="round" />
          ))}
        </svg>

        <button
          type="button"
          onClick={() => centerEnabled && onPick("center")}
          disabled={!centerEnabled}
          aria-pressed={pick === "center"}
          aria-label={centerEnabled ? "暖暖：問暖暖" : "暖暖"}
          style={{
            position: "absolute", left: `${layout.cx}%`, top: top(layout.cy), transform: "translate(-50%, -50%)",
            width: `${COMPASS_CENTER_SIZE}%`, aspectRatio: "1 / 1", borderRadius: "50%", padding: 4,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            background: pick === "center" ? "var(--primary-soft)" : "var(--surface)",
            border: `3px solid ${pick === "center" ? "var(--primary-deep)" : "var(--primary)"}`,
            boxShadow: pick === "center" ? "var(--shadow-lg)" : "var(--shadow-md)",
            cursor: centerEnabled ? "pointer" : "default", fontFamily: "inherit",
          }}
        >
          <Mascot size={44} mood="happy" />
          <span style={{ fontSize: fit(0.056, "var(--fs-sm)"), fontWeight: 800, color: "var(--ink-1)", lineHeight: 1.2, whiteSpace: "nowrap" }}>
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
                position: "absolute", left: `${x}%`, top: top(y), transform: "translate(-50%, -50%)",
                width: `${COMPASS_BUTTON.width}%`, aspectRatio: `${COMPASS_BUTTON.width} / ${COMPASS_BUTTON.height}`, minHeight: 64,
                padding: "4px 2px", borderRadius: 18,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                // 選到的方向：底色淡淡的方向色（color 都是 #RRGGBB；疊在白底上，後面的線才不會透出來）
                background: on ? `linear-gradient(${d.color}40, ${d.color}40) var(--surface)` : "var(--surface)",
                border: `3px solid ${d.color}`,
                boxShadow: on ? "var(--shadow-lg)" : "var(--shadow-sm)",
                cursor: "pointer", fontFamily: "inherit", textAlign: "center",
              }}
            >
              {/* 書本的 SMART 字母：小圓章釘在上面朝外的那個角（不會壓到中間的暖暖，也不會蓋到下面的字）；完整名稱在 aria-label 和展開的標題 */}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute", top: -11, width: 26, height: 26, borderRadius: "50%",
                  ...(x > layout.cx ? { right: -7 } : { left: -7 }),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, lineHeight: 1, color: "var(--ink-1)",
                  background: "var(--surface)", border: `2px solid ${d.color}`,
                }}
              >
                {d.key}
              </span>
              <span style={{ fontSize: fit(0.075, "26px"), lineHeight: 1.1 }} aria-hidden="true">{d.emoji}</span>
              <span style={{ fontSize: fit(0.056, "var(--fs-sm)"), fontWeight: 800, color: "var(--ink-1)", lineHeight: 1.25, whiteSpace: "nowrap" }}>{d.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
