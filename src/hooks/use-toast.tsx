"use client";

// ────────────────────────────────────────────────
// 全域 Toast 系統 — 取代原生 alert()
// 對長者友善：暖色、大字、自動消失、不阻斷操作
// 用法：const toast = useToast(); toast.error("人話化的訊息")
// ────────────────────────────────────────────────

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const KIND_STYLE: Record<ToastKind, { bg: string; border: string; ink: string; emoji: string }> = {
  success: { bg: "#DCEBD8", border: "#B5D2B0", ink: "#3B5E3A", emoji: "✅" },
  error: { bg: "#F7DDE0", border: "#E9B7BF", ink: "#9B2F44", emoji: "🍊" },
  info: { bg: "#FBE6D4", border: "#F0C9A8", ink: "#9A4A24", emoji: "💬" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, kind, message }]);
      // 成功/資訊 3 秒、錯誤 5 秒（讓長者有時間看清楚）
      const ttl = kind === "error" ? 5000 : 3000;
      setTimeout(() => remove(id), ttl);
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const s = KIND_STYLE[t.kind];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => remove(t.id)}
              aria-label="關閉提示"
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: 440,
                textAlign: "left",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 18,
                padding: "16px 18px",
                color: s.ink,
                fontSize: "var(--fs-base)",
                fontWeight: 700,
                lineHeight: 1.45,
                boxShadow: "var(--shadow-lg)",
                animation: "toast-in 0.25s ease",
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1.2 }}>{s.emoji}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{t.message}</span>
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Provider 未掛載時的安全 fallback（理論上不會發生）
    return {
      success: (m) => console.log("[toast]", m),
      error: (m) => console.error("[toast]", m),
      info: (m) => console.log("[toast]", m),
    };
  }
  return ctx;
}
