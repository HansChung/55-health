"use client";

import { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  align?: "left" | "right";
  tone?: "cream" | "orange";
}

export function SpeechBubble({ children, align = "left", tone = "cream" }: SpeechBubbleProps) {
  const bg = tone === "orange" ? "var(--primary-soft)" : "var(--surface-warm)";
  return (
    <div style={{
      background: bg,
      borderRadius: 22,
      padding: "16px 20px",
      fontSize: "var(--fs-base)",
      lineHeight: 1.55,
      color: "var(--ink-1)",
      maxWidth: "85%",
      position: "relative",
      border: "1px solid var(--line)",
      boxShadow: "var(--shadow-sm)",
      marginLeft: align === "left" ? 14 : 0,
      marginRight: align === "right" ? 14 : 0,
    }}>
      <div style={{
        position: "absolute",
        left: align === "left" ? -8 : "auto",
        right: align === "right" ? -8 : "auto",
        bottom: 14,
        width: 16, height: 16,
        background: bg,
        borderLeft: align === "left" ? "1px solid var(--line)" : "none",
        borderBottom: "1px solid var(--line)",
        borderRight: align === "right" ? "1px solid var(--line)" : "none",
        transform: "rotate(45deg)",
      }} />
      {children}
    </div>
  );
}
