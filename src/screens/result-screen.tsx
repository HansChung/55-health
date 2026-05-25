"use client";

import { useState } from "react";
import { FoodResult } from "@/lib/types";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { SpeechBubble } from "@/components/speech-bubble";
import { MacroBar } from "@/components/macro-bar";

interface ResultScreenProps {
  result: FoodResult;
  photoDataUrl?: string | null;
  onClose: () => void;
  onSave: (adjusted: { cal: number; protein: number; carb: number; fat: number }) => void;
}

export function ResultScreen({ result, photoDataUrl, onClose, onSave }: ResultScreenProps) {
  const [portion, setPortion] = useState(1);
  const adjusted = {
    cal: Math.round(result.cal * portion),
    protein: Math.round(result.protein * portion),
    carb: Math.round(result.carb * portion),
    fat: Math.round(result.fat * portion),
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        height: 240, position: "relative", overflow: "hidden",
        background: photoDataUrl
          ? `#000 url(${photoDataUrl}) center/cover no-repeat`
          : "radial-gradient(ellipse 70% 60% at 50% 55%, #D67340 0%, #8C4521 60%, #4A2510 100%)",
      }}>
        {!photoDataUrl && (
          <div style={{
            position: "absolute", left: "50%", top: "52%",
            transform: "translate(-50%, -50%)",
            width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #FBE8C6 0%, #E0BC85 60%, #B8924C 100%)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 24,
          }}>
            <div style={{ borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #F5F0E0, #D4C8A4)" }} />
            <div style={{ borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #C95E36, #8C3A1C)" }} />
            <div style={{ borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, #7AA779, #4F7A4E)" }} />
            <div style={{ borderRadius: 10, background: "repeating-linear-gradient(0deg, #E8C97A 0 5px, #D0AC55 5px 10px)" }} />
          </div>
        )}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, left: 16,
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="chevronL" size={26} color="#fff" stroke={2.5} />
        </button>
        <button style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
          padding: "10px 18px", borderRadius: 999,
          fontSize: "var(--fs-sm)", color: "#fff", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Icon name="refresh" size={20} color="#fff" />
          重拍
        </button>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflowY: "auto", padding: "20px 24px 140px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 24 }}>
          <Mascot size={56} mood="happy" />
          <SpeechBubble tone="orange">
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 4 }}>
              我看到了 {result.items.length} 樣食物
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              如果認錯了，可以點下面修改喔
            </div>
          </SpeechBubble>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {result.items.map((it, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              borderRadius: 16, padding: "14px 16px",
              border: "1px solid var(--line)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: it.color, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>{it.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{it.name}</div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{it.amount}　·　{it.cal} 大卡</div>
              </div>
              <button style={{
                color: "var(--primary-deep)", fontSize: "var(--fs-sm)", fontWeight: 600,
                padding: "6px 12px",
              }}>修改</button>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 14 }}>您吃了多少？</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { v: 0.5, label: "半份" },
              { v: 1, label: "一份" },
              { v: 1.5, label: "一份半" },
              { v: 2, label: "兩份" },
            ].map(opt => (
              <button key={opt.v} onClick={() => setPortion(opt.v)} style={{
                flex: 1, padding: "14px 8px",
                borderRadius: 14,
                background: portion === opt.v ? "var(--primary)" : "var(--surface)",
                color: portion === opt.v ? "#fff" : "var(--ink-1)",
                border: portion === opt.v ? "none" : "2px solid var(--line-strong)",
                fontSize: "var(--fs-sm)", fontWeight: 700,
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>這餐營養</span>
            <span style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--primary-deep)" }}>
              {adjusted.cal} <span style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--ink-2)" }}>大卡</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <MacroBar label="蛋白質" value={adjusted.protein} max={65} color="linear-gradient(90deg, #E8845A, #F4B58E)" />
            <MacroBar label="醣類" value={adjusted.carb} max={220} color="linear-gradient(90deg, #D9A441, #F0CB72)" />
            <MacroBar label="脂肪" value={adjusted.fat} max={55} color="linear-gradient(90deg, #7AA779, #A3C4A0)" />
          </div>
        </div>

        <div style={{
          background: "var(--sage-soft)",
          borderRadius: "var(--r-lg)",
          padding: 18,
          border: "1px solid #B5D2B0",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "var(--sage)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="leaf" size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--fs-sm)", color: "#4F7A4E", fontWeight: 700, marginBottom: 4 }}>健康提醒</div>
            <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-1)", lineHeight: 1.5 }}>
              這餐蔬菜不錯！記得多喝水，份量剛好不會太多。
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "16px 24px 32px",
        background: "linear-gradient(180deg, transparent, var(--bg) 30%)",
        display: "flex", gap: 12,
      }}>
        <button className="btn-ghost" style={{ flex: 1 }}>稍後修改</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={() => onSave(adjusted)}>
          <Icon name="check" size={26} color="#fff" stroke={3} />
          確認儲存
        </button>
      </div>
    </div>
  );
}
