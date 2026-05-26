"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/components/mascot";
import { api, type AiSuggestion } from "@/lib/api-client";

interface SuggestionSheetProps {
  onClose: () => void;
  initial?: AiSuggestion | null;
}

export function SuggestionSheet({ onClose, initial }: SuggestionSheetProps) {
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) return;
    api.getSuggestion()
      .then(({ suggestion }) => setSuggestion(suggestion))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [initial]);

  const regenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const { suggestion } = await api.getSuggestion();
      setSuggestion(suggestion);
      // 同時清掉首頁的快取，下次刷新會抓新的
      if (typeof window !== "undefined") {
        try { localStorage.removeItem("nuannuan_suggestion_v1"); } catch {}
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 40,
        background: "rgba(45, 28, 14, 0.4)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{
          width: "100%",
          background: "var(--bg)",
          borderRadius: "28px 28px 0 0",
          padding: "12px 24px 32px",
          maxHeight: "80%", overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{
          width: 48, height: 5, borderRadius: 3,
          background: "var(--line-strong)", margin: "6px auto 18px",
        }} />

        {loading && (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="pop"><Mascot size={72} mood="thinking" /></div>
            <div style={{ marginTop: 16, color: "var(--ink-2)" }}>暖暖想一下…</div>
          </div>
        )}

        {error && (
          <div style={{
            padding: 20, background: "var(--berry-soft)", borderRadius: 12,
            color: "var(--berry)", textAlign: "center",
          }}>
            建議生成失敗：{error}
          </div>
        )}

        {suggestion && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <Mascot size={72} mood="excited" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--primary-deep)", fontWeight: 700, letterSpacing: "0.5px" }}>
                  暖暖的建議
                </div>
                <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, color: "var(--ink-1)", lineHeight: 1.3 }}>
                  {suggestion.headline}
                </div>
              </div>
            </div>

            {suggestion.reason && (
              <div style={{
                background: "var(--surface)", borderRadius: "var(--r-lg)",
                padding: 18, marginBottom: 16,
                border: "1px solid var(--line)",
              }}>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700, marginBottom: 10 }}>
                  為什麼這樣建議
                </div>
                <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, color: "var(--ink-1)" }}>
                  {suggestion.reason}
                </div>
              </div>
            )}

            {suggestion.recommendations.length > 0 && (
              <>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700, marginBottom: 10 }}>
                  推薦選擇
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  {suggestion.recommendations.map((f, i) => (
                    <div key={i} style={{
                      flex: 1, background: "var(--surface)",
                      borderRadius: 16, padding: 14,
                      border: "1px solid var(--line)",
                      textAlign: "center",
                    }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: "50%",
                        background: (f.color ?? "#E8845A") + "33",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 32, margin: "0 auto 8px",
                      }}>{f.emoji}</div>
                      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>{f.name}</div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>{f.cal} 卡</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={regenerate}
                disabled={loading}
                style={{
                  flex: 1, padding: "16px",
                  background: "var(--surface)",
                  border: "2px solid var(--line-strong)",
                  borderRadius: 999,
                  fontSize: "var(--fs-base)", fontWeight: 700,
                  color: "var(--ink-1)",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                🔄 換個建議
              </button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={onClose}>
                知道了
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
