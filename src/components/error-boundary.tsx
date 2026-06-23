"use client";

import React from "react";
import { trackError } from "@/lib/telemetry";

interface Props { children: React.ReactNode }
interface State { hasError: boolean }

/** React 錯誤邊界：畫面崩潰時記錄錯誤 + 顯示友善畫面（而非白屏） */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    trackError("react_error", {
      message: String(error?.message ?? "").slice(0, 300),
      stack: String(error?.stack ?? "").slice(0, 500),
      component: String(info?.componentStack ?? "").slice(0, 300),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          padding: 32, textAlign: "center", background: "#FAF5EC", color: "#3D2E20",
          fontFamily: "'Noto Sans TC', sans-serif",
        }}>
          <div style={{ fontSize: 56 }}>🐻</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>暖暖剛剛打了個盹</h1>
          <p style={{ fontSize: 16, color: "#6B5848", margin: 0, lineHeight: 1.6 }}>
            畫面好像出了點小狀況，<br />請重新整理一下就好。
          </p>
          <button
            onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}
            style={{
              marginTop: 8, padding: "14px 36px", border: "none",
              background: "#E8845A", color: "#fff", borderRadius: 999,
              fontSize: 16, fontWeight: 700, cursor: "pointer",
            }}
          >
            重新整理
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
