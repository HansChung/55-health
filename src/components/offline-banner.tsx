"use client";

// ────────────────────────────────────────────────
// 離線偵測橫幅 — 網路斷線時在最上方顯示提示
// 對長者友善：大字、清楚說明「不是 App 壞了，是網路問題」
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";

export function OfflineBanner() {
  // 初始假設在線（SSR 安全）；掛載後再用真實狀態校正
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update(); // 掛載當下先校正一次

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: "#9B2F44",
        color: "#FFFFFF",
        padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: "var(--fs-sm, 18px)",
        fontWeight: 700,
        lineHeight: 1.4,
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }} aria-hidden="true">
        📶
      </span>
      <span>目前沒有網路連線，記錄會等連上網路後再儲存</span>
    </div>
  );
}
