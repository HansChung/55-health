"use client";

interface MacroBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, value, max, color, unit = "克" }: MacroBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginBottom: 6 }}>{value}/{max}{unit}</div>
      <div style={{ height: 10, background: "var(--bg-deep)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: color,
          borderRadius: 6,
          transition: "width 0.8s ease",
        }} />
      </div>
    </div>
  );
}
