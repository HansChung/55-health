"use client";

import { useEffect, useState } from "react";
import type { AchievementProgress } from "@/lib/achievements";

/**
 * 解鎖成就的慶祝視窗。
 * 一次顯示一個徽章；若同時解鎖多個會逐一播放。
 */
export function AchievementToast({
  unlocked,
  onClose,
}: {
  unlocked: AchievementProgress[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const current = unlocked[index];

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("achv-toast-kf")) return;
    const style = document.createElement("style");
    style.id = "achv-toast-kf";
    style.textContent = `
      @keyframes achvPop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.06); } 100% { transform: scale(1); opacity: 1; } }
      @keyframes achvBadge { 0% { transform: scale(0.3) rotate(-12deg); } 70% { transform: scale(1.15) rotate(6deg); } 100% { transform: scale(1) rotate(0); } }
    `;
    document.head.appendChild(style);
  }, []);

  if (!current) return null;

  const next = () => {
    if (index + 1 < unlocked.length) setIndex(index + 1);
    else onClose();
  };

  return (
    <div
      onClick={next}
      style={{
        position: "absolute", inset: 0, zIndex: 120,
        background: "rgba(20, 14, 10, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 320,
          background: "linear-gradient(180deg, #FFF9EF 0%, #FFFFFF 100%)",
          borderRadius: 24, padding: "32px 24px 24px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          border: "1px solid var(--gold-soft)",
          animation: "achvPop 0.4s ease-out",
        }}
      >
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)", letterSpacing: 1 }}>
          🎉 解鎖新徽章
        </div>

        <div style={{
          margin: "20px auto 16px",
          width: 110, height: 110, borderRadius: 28,
          background: "var(--primary-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 60,
          animation: "achvBadge 0.6s ease-out",
        }}>
          {current.achievement.emoji}
        </div>

        <div style={{ fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--ink-1)" }}>
          {current.achievement.title}
        </div>
        <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>
          {current.achievement.description}
        </div>

        {unlocked.length > 1 && (
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 14 }}>
            {index + 1} / {unlocked.length}
          </div>
        )}

        <button
          onClick={next}
          className="btn-primary"
          style={{ width: "100%", marginTop: 22 }}
        >
          {index + 1 < unlocked.length ? "看下一個" : "太棒了！"}
        </button>
      </div>
    </div>
  );
}
