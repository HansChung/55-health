"use client";

import { Mascot } from "@/components/mascot";

interface SuggestionSheetProps {
  onClose: () => void;
}

export function SuggestionSheet({ onClose }: SuggestionSheetProps) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 40,
      background: "rgba(45, 28, 14, 0.4)",
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div className="fade-up" onClick={e => e.stopPropagation()} style={{
        width: "100%",
        background: "var(--bg)",
        borderRadius: "28px 28px 0 0",
        padding: "12px 24px 32px",
        maxHeight: "80%", overflowY: "auto",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          width: 48, height: 5, borderRadius: 3,
          background: "var(--line-strong)",
          margin: "6px auto 18px",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <Mascot size={72} mood="excited" />
          <div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--primary-deep)", fontWeight: 700, letterSpacing: "0.5px" }}>
              暖暖的建議
            </div>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, color: "var(--ink-1)", lineHeight: 1.3 }}>
              下午可以吃個水果補維他命C
            </div>
          </div>
        </div>

        <div style={{
          background: "var(--surface)", borderRadius: "var(--r-lg)",
          padding: 18, marginBottom: 16,
          border: "1px solid var(--line)",
        }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700, marginBottom: 10 }}>
            為什麼這樣建議
          </div>
          <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, color: "var(--ink-1)" }}>
            您今天早餐吃了白粥和青菜，蛋白質和碳水都夠了，但是<strong style={{ color: "var(--primary-deep)" }}>維他命C 還缺一些</strong>。一顆柳丁或半顆芭樂就剛剛好。
          </div>
        </div>

        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700, marginBottom: 10 }}>
          推薦選擇
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            { name: "柳丁", cal: 60, emoji: "🍊", color: "#E8845A" },
            { name: "芭樂", cal: 70, emoji: "🍈", color: "#7AA779" },
            { name: "奇異果", cal: 55, emoji: "🥝", color: "#D9A441" },
          ].map((f, i) => (
            <div key={i} style={{
              flex: 1, background: "var(--surface)",
              borderRadius: 16, padding: 14,
              border: "1px solid var(--line)",
              textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: f.color + "22",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, margin: "0 auto 8px",
              }}>{f.emoji}</div>
              <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>{f.name}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>{f.cal} 卡</div>
            </div>
          ))}
        </div>

        <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>
          知道了，謝謝暖暖
        </button>
      </div>
    </div>
  );
}
