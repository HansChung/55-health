"use client";

// ────────────────────────────────────────────────
// 最外層 Error Boundary — 連 root layout 都出錯時的最後防線
// 必須自帶 <html>/<body>（會取代整個 root layout）
// ────────────────────────────────────────────────

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="zh-TW">
      <body
        style={{
          margin: 0,
          fontFamily: '"Noto Sans TC", "PingFang TC", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "32px 24px",
            background: "#FAF5EC",
            color: "#3D2E20",
            gap: 20,
          }}
        >
          <div style={{ fontSize: 64, lineHeight: 1 }} aria-hidden="true">
            🍊
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>哎呀，出了點小狀況</h1>
          <p style={{ fontSize: 22, color: "#6B5848", margin: 0, maxWidth: 360, lineHeight: 1.6 }}>
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
              fontSize: 26,
              fontWeight: 800,
              color: "#FFFFFF",
              background: "#E8845A",
              border: "none",
              borderRadius: 999,
              boxShadow: "0 6px 16px rgba(75,50,30,0.12)",
            }}
          >
            再試一次
          </button>
        </div>
      </body>
    </html>
  );
}
