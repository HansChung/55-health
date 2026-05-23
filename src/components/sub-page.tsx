"use client";

import { ReactNode } from "react";
import { Icon } from "./icons";

interface SubPageProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  accent?: string;
  footer?: ReactNode;
}

export function SubPage({ title, onBack, children, accent, footer }: SubPageProps) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 45,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      animation: "slide-in-right 0.28s ease both",
    }}>
      <div style={{
        paddingTop: 16,
        background: accent || "transparent",
        position: "relative",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px 14px",
        }}>
          <button onClick={onBack} style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--surface)", border: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-sm)", flexShrink: 0,
          }}>
            <Icon name="chevronL" size={26} color="var(--ink-1)" stroke={2.5} />
          </button>
          <h1 style={{
            fontSize: "var(--fs-xl)", fontWeight: 800,
            margin: 0, letterSpacing: "-0.5px",
          }}>{title}</h1>
        </div>
      </div>
      <div className="scroll-area" style={{
        flex: 1, overflowY: "auto",
        padding: footer ? "4px 24px 120px" : "4px 24px 40px",
      }}>{children}</div>
      {footer && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "16px 24px 32px",
          background: "linear-gradient(180deg, transparent, var(--bg) 30%)",
        }}>{footer}</div>
      )}
    </div>
  );
}
