"use client";

import { DIMENSIONS, type SmartScores } from "@/lib/smart";

interface RadarChartProps {
  scores: SmartScores;
  /** 可選：上一次分數，疊一層做對比 */
  compare?: SmartScores | null;
  size?: number;
}

/**
 * 五軸雷達圖（SVG，無外部套件）
 * 軸順序：S(上) → M → A → R → T 順時針
 */
export function RadarChart({ scores, compare, size = 280 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34; // 留空間給外圈標籤
  const n = DIMENSIONS.length;

  // 第 i 軸的角度（-90 度從正上方開始，順時針）
  const angle = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);

  const pointAt = (i: number, ratio: number) => {
    const a = angle(i);
    return {
      x: cx + Math.cos(a) * maxR * ratio,
      y: cy + Math.sin(a) * maxR * ratio,
    };
  };

  // 背景網格（4 圈）
  const gridRings = [0.25, 0.5, 0.75, 1].map((ratio) =>
    DIMENSIONS.map((_, i) => pointAt(i, ratio))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ")
  );

  const toPolygon = (s: SmartScores) =>
    DIMENSIONS.map((d, i) => pointAt(i, (s[d.key] ?? 0) / 100))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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

      {/* 軸線 */}
      {DIMENSIONS.map((_, i) => {
        const p = pointAt(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--line, #EDE3D0)"
            strokeWidth={1}
          />
        );
      })}

      {/* 對比層（上次） */}
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
        points={toPolygon(scores)}
        fill="rgba(232,132,90,0.22)"
        stroke="#E8845A"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* 頂點圓點 */}
      {DIMENSIONS.map((d, i) => {
        const p = pointAt(i, (scores[d.key] ?? 0) / 100);
        return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={d.color} />;
      })}

      {/* 構面標籤 */}
      {DIMENSIONS.map((d, i) => {
        const p = pointAt(i, 1.0);
        // 標籤往外推一點
        const a = angle(i);
        const lx = cx + Math.cos(a) * (maxR + 22);
        const ly = cy + Math.sin(a) * (maxR + 18);
        const anchor =
          Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <g key={i}>
            <text
              x={lx}
              y={ly - 4}
              textAnchor={anchor}
              fontSize={13}
              fontWeight={700}
              fill="var(--ink-1, #3D2E20)"
            >
              {d.label}
            </text>
            <text
              x={lx}
              y={ly + 13}
              textAnchor={anchor}
              fontSize={13}
              fontWeight={800}
              fill={d.color}
            >
              {scores[d.key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
