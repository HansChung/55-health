"use client";

interface FoodPlaceholderProps {
  label: string;
  color?: string;
  size?: number;
  radius?: number;
}

export function FoodPlaceholder({ label, color = "#E8845A", size = 80, radius = 16 }: FoodPlaceholderProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: `repeating-linear-gradient(45deg, ${color}22 0 8px, ${color}11 8px 16px)`,
      border: `1px dashed ${color}66`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontFamily: "ui-monospace, monospace",
      color: "var(--ink-2)", textAlign: "center", padding: 6, lineHeight: 1.2,
      flexShrink: 0,
    }}>{label}</div>
  );
}
