"use client";

// ────────────────────────────────────────────────
// 路由層 Error Boundary — 防止 render 例外造成白屏
// 對長者顯示友善訊息 + 一顆大的「再試一次」按鈕
// ────────────────────────────────────────────────

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 記到 console / 監控（不顯示技術細節給長者）
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 24px",
        background: "var(--bg, #FAF5EC)",
        color: "var(--ink-1, #3D2E20)",
        gap: 20,
      }}
    >
      <div style={{ fontSize: 64, lineHeight: 1 }} aria-hidden="true">
        🍊
      </div>
      <h1 style={{ fontSize: "var(--fs-xl, 32px)", fontWeight: 800, margin: 0 }}>
        哎呀，出了點小狀況
      </h1>
      <p
        style={{
          fontSize: "var(--fs-base, 22px)",
          color: "var(--ink-2, #6B5848)",
          margin: 0,
          maxWidth: 360,
          lineHeight: 1.6,
        }}
      >
        畫面剛剛卡住了，別擔心，您的資料都還在。
        <br />
        點下面的按鈕再試一次就好。
      </p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          marginTop: 8,
          minWidth: 220,
          padding: "18px 28px",
          fontSize: "var(--fs-lg, 26px)",
          fontWeight: 800,
          color: "#FFFFFF",
          background: "var(--primary, #E8845A)",
          border: "none",
          borderRadius: 999,
          boxShadow: "var(--shadow-md, 0 6px 16px rgba(75,50,30,0.12))",
        }}
      >
        再試一次
      </button>
      <button
        type="button"
        onClick={() => {
          window.location.href = "/";
        }}
        style={{
          padding: "12px 20px",
          fontSize: "var(--fs-sm, 18px)",
          fontWeight: 700,
          color: "var(--primary-deep, #C95E36)",
          background: "transparent",
          border: "none",
        }}
      >
        回到首頁
      </button>
    </div>
  );
}
