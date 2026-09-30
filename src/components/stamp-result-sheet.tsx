"use client";

// ────────────────────────────────────────────────
// 掃站點 QR Code 後跳出來的蓋章結果：大印章＋第幾章＋這一站的小知識（可以念出來）
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { StudyTourStampResult } from "@/lib/study-tours";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";

export type StampSheetState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: StudyTourStampResult };

export function StampResultSheet({
  state,
  onClose,
  onOpenPassport,
}: {
  state: StampSheetState;
  onClose: () => void;
  onOpenPassport: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => stopGuideSpeech(), []);

  const close = () => {
    stopGuideSpeech();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="蓋章結果"
      style={{
        position: "absolute", inset: 0, zIndex: 130,
        background: "rgba(20, 14, 10, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 360, maxHeight: "100%", overflowY: "auto",
          background: "linear-gradient(180deg, #FFF9EF 0%, #FFFFFF 100%)",
          borderRadius: 24, padding: "28px 22px 22px",
          textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          border: "1px solid var(--gold-soft)",
          animation: "pop 0.35s ease-out both",
        }}
      >
        {state.status === "loading" && (
          <>
            <div
              aria-hidden="true"
              style={{
                width: 56, height: 56, margin: "8px auto 16px", borderRadius: "50%",
                border: "5px solid var(--primary-soft)", borderTopColor: "var(--primary)",
                animation: "spin 1s linear infinite",
              }}
            />
            <div role="status" style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>暖暖正在幫你蓋章…</div>
          </>
        )}

        {state.status === "error" && (
          <>
            <div style={{ fontSize: 56 }} aria-hidden="true">🤔</div>
            <div role="alert" style={{ fontSize: "var(--fs-base)", fontWeight: 800, margin: "8px 0 20px", lineHeight: 1.5 }}>
              {state.message}
            </div>
            <button onClick={close} className="btn-primary" style={{ width: "100%" }}>好</button>
          </>
        )}

        {state.status === "done" && (() => {
          const r = state.result;
          const funFact = r.stop.fun_fact.trim();
          return (
            <>
              <div
                aria-hidden="true"
                style={{
                  width: 132, height: 132, margin: "0 auto 12px", borderRadius: "50%",
                  border: "6px double #C0392B", color: "#C0392B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 64, transform: "rotate(-8deg)",
                  background: "rgba(192, 57, 43, 0.06)",
                  animation: "pop 0.5s ease-out 0.1s both",
                }}
              >
                {r.stop.stamp_emoji}
              </div>
              <div role="status" style={{ fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--primary-deep)" }}>
                {r.newly_stamped ? "蓋章成功！" : "這一站蓋過囉"}
              </div>
              <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, marginTop: 6 }}>{r.stop.name}</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2 }}>{r.tour_title}</div>

              <div style={{
                margin: "14px auto 0", display: "inline-block", padding: "6px 16px", borderRadius: 999,
                background: "var(--gold-soft)", fontSize: "var(--fs-base)", fontWeight: 800,
              }}>
                已集 {r.stamped_count}／{r.total_stops} 章
              </div>

              {r.just_completed && (
                <div style={{
                  marginTop: 14, padding: 14, borderRadius: "var(--r-md)",
                  background: "var(--sage-soft)", fontSize: "var(--fs-base)", fontWeight: 800, color: "#35613A",
                }}>
                  🎓 全部集滿了！<br />到「我的研學護照」領結業證書
                </div>
              )}

              {funFact && (
                <div style={{
                  marginTop: 16, padding: 16, textAlign: "left", borderRadius: "var(--r-md)",
                  background: "var(--surface)", border: "1px solid var(--line)",
                }}>
                  <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--gold)" }}>💡 這一站的小知識</div>
                  <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, marginTop: 6 }}>{funFact}</div>
                  {canSpeakGuide() && (
                    <button
                      onClick={() => {
                        if (speaking) {
                          stopGuideSpeech();
                          setSpeaking(false);
                          return;
                        }
                        const ok = speakGuideParagraphs([r.stop.name, funFact], {
                          onEnd: () => setSpeaking(false),
                          onError: () => setSpeaking(false),
                        });
                        setSpeaking(ok);
                      }}
                      className="btn-ghost"
                      style={{ width: "100%", marginTop: 12, minHeight: 52, fontSize: "var(--fs-sm)" }}
                    >
                      {speaking ? "⏹ 停止" : "🔊 念給我聽"}
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                <button
                  onClick={() => {
                    stopGuideSpeech();
                    onOpenPassport();
                  }}
                  className="btn-primary"
                  style={{ width: "100%" }}
                >
                  📘 看我的研學護照
                </button>
                <button onClick={close} className="btn-ghost" style={{ width: "100%" }}>好</button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
