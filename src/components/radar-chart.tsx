"use client";

import { useEffect, useState } from "react";
import {
  DIMENSIONS,
  weakestDimension,
  type SmartDimension,
  type SmartScores,
} from "@/lib/smart";

interface RadarChartProps {
  scores: SmartScores;
  /** 可選：上一次分數，疊一層做對比 */
  compare?: SmartScores | null;
  size?: number;
  /** 高亮軸（預設最弱構面） */
  highlight?: SmartDimension | null;
  /** 目前選中的構面 */
  selected?: SmartDimension | null;
  /** 點擊構面標籤／頂點 */
  onSelectDimension?: (key: SmartDimension) => void;
  /** 進場展開動畫（預設開；尊重 prefers-reduced-motion） */
  animate?: boolean;
}

/**
 * 五軸雷達圖（SVG，無外部套件）
 * 軸順序：S(上) → M → A → R → T 順時針
 */
export function RadarChart({
  scores,
  compare,
  size = 280,
  highlight,
  selected = null,
  onSelectDimension,
  animate = true,
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const n = DIMENSIONS.length;

  const highlightKey = highlight ?? weakestDimension(scores).key;

  const [progress, setProgress] = useState(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      setProgress(1);
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(1);
      return;
    }

    setProgress(0);
    let raf = 0;
    const start = performance.now();
    const duration = 700;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, scores.S, scores.M, scores.A, scores.R, scores.T]);

  const angle = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);

  const pointAt = (i: number, ratio: number) => {
    const a = angle(i);
    return {
      x: cx + Math.cos(a) * maxR * ratio,
      y: cy + Math.sin(a) * maxR * ratio,
    };
  };

  const displayScores: SmartScores = {
    S: scores.S * progress,
    M: scores.M * progress,
    A: scores.A * progress,
    R: scores.R * progress,
    T: scores.T * progress,
  };

  const ringRatios = [0.25, 0.5, 0.75, 1];
  const gridRings = ringRatios.map((ratio) =>
    DIMENSIONS.map((_, i) => pointAt(i, ratio))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ")
  );

  const toPolygon = (s: SmartScores) =>
    DIMENSIONS.map((d, i) => pointAt(i, (s[d.key] ?? 0) / 100))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

  // 刻度標在「社會連結」軸偏左一點，避免擋標籤
  const scaleLabelPos = (ratio: number) => {
    const a = angle(0) - 0.22;
    return {
      x: cx + Math.cos(a) * maxR * ratio,
      y: cy + Math.sin(a) * maxR * ratio,
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="智慧幸福五軸雷達圖"
      >
        {/* 網格圈 */}
        {gridRings.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="var(--line, #EDE3D0)"
            strokeWidth={1}
          />
        ))}

        {/* 刻度 25 / 50 / 75 */}
        {[0.25, 0.5, 0.75].map((ratio) => {
          const p = scaleLabelPos(ratio);
          return (
            <text
              key={ratio}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={700}
              fill="var(--ink-3, #A89580)"
            >
              {Math.round(ratio * 100)}
            </text>
          );
        })}

        {/* 軸線 */}
        {DIMENSIONS.map((d, i) => {
          const p = pointAt(i, 1);
          const isHi = d.key === highlightKey;
          const isSel = d.key === selected;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={isHi || isSel ? d.color : "var(--line, #EDE3D0)"}
              strokeWidth={isHi || isSel ? 2.5 : 1}
              strokeOpacity={isHi || isSel ? 0.85 : 1}
            />
          );
        })}

        {/* 對比層（上次）— 不動畫，方便對照 */}
        {compare && (
          <polygon
            points={toPolygon(compare)}
            fill="rgba(168,149,128,0.12)"
            stroke="#A89580"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* 本次分數 */}
        <polygon
          points={toPolygon(displayScores)}
          fill="rgba(232,132,90,0.22)"
          stroke="#E8845A"
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {/* 頂點圓點 + 選中光暈 */}
        {DIMENSIONS.map((d, i) => {
          const p = pointAt(i, (displayScores[d.key] ?? 0) / 100);
          const isHi = d.key === highlightKey;
          const isSel = d.key === selected;
          return (
            <g
              key={i}
              style={{ cursor: onSelectDimension ? "pointer" : "default" }}
              onClick={() => onSelectDimension?.(d.key)}
              role={onSelectDimension ? "button" : undefined}
              tabIndex={onSelectDimension ? 0 : undefined}
              onKeyDown={(e) => {
                if (!onSelectDimension) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDimension(d.key);
                }
              }}
              aria-label={`${d.label} ${scores[d.key]} 分`}
            >
              {(isSel || isHi) && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSel ? 12 : 9}
                  fill={d.color}
                  fillOpacity={isSel ? 0.22 : 0.14}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isSel ? 6 : isHi ? 5.5 : 4}
                fill={d.color}
                stroke="#fff"
                strokeWidth={isSel || isHi ? 2 : 0}
              />
            </g>
          );
        })}

        {/* 構面標籤（可點） */}
        {DIMENSIONS.map((d, i) => {
          const a = angle(i);
          const lx = cx + Math.cos(a) * (maxR + 26);
          const ly = cy + Math.sin(a) * (maxR + 22);
          const anchor =
            Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
          const isSel = d.key === selected;
          const isHi = d.key === highlightKey;
          return (
            <g
              key={`label-${i}`}
              style={{ cursor: onSelectDimension ? "pointer" : "default" }}
              onClick={() => onSelectDimension?.(d.key)}
            >
              <text
                x={lx}
                y={ly - 5}
                textAnchor={anchor}
                fontSize={15}
                fontWeight={800}
                fill={isSel || isHi ? d.color : "var(--ink-1, #3D2E20)"}
              >
                {d.label}
              </text>
              <text
                x={lx}
                y={ly + 14}
                textAnchor={anchor}
                fontSize={15}
                fontWeight={800}
                fill={d.color}
              >
                {scores[d.key]}
              </text>
            </g>
          );
        })}
      </svg>

      {compare && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 4,
            fontSize: "var(--fs-xs, 12px)",
            color: "var(--ink-3, #A89580)",
            fontWeight: 700,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 18,
                height: 0,
                borderTop: "3px solid #E8845A",
                display: "inline-block",
              }}
            />
            本次
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 18,
                height: 0,
                borderTop: "2px dashed #A89580",
                display: "inline-block",
              }}
            />
            上次
          </span>
        </div>
      )}
    </div>
  );
}
