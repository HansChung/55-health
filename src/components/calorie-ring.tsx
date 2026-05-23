"use client";

interface CalorieRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
}

export function CalorieRing({ value, max, size = 220, stroke = 18 }: CalorieRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = c * (1 - pct);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F4B58E" />
            <stop offset="50%" stopColor="#E8845A" />
            <stop offset="100%" stopColor="#D9A441" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-deep)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#ring-grad)" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 6 }}>今日攝取</div>
        <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--primary-deep)", lineHeight: 1, letterSpacing: "-1px" }}>
          {value.toLocaleString()}
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 6 }}>
          / {max.toLocaleString()} 大卡
        </div>
      </div>
    </div>
  );
}
