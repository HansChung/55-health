"use client";

interface ToggleProps {
  on: boolean;
  onChange?: (v: boolean) => void;
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange?.(!on)}
      style={{
        width: 56, height: 32, borderRadius: 16,
        background: on ? "var(--primary)" : "var(--bg-deep)",
        position: "relative", transition: "background 0.2s",
        flexShrink: 0, border: "none", cursor: "pointer", padding: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 27 : 3,
        width: 26, height: 26, borderRadius: "50%",
        background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}
