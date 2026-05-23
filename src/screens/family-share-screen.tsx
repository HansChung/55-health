"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { Toggle } from "@/components/toggle";

interface FamilyShareScreenProps {
  onBack: () => void;
}

function InviteModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "rgba(45, 28, 14, 0.5)",
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: "var(--bg)",
        borderRadius: "28px 28px 0 0", padding: "12px 24px 32px",
        animation: "slide-up 0.3s ease both",
      }}>
        <div style={{
          width: 48, height: 5, borderRadius: 3,
          background: "var(--line-strong)", margin: "6px auto 18px",
        }} />
        <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: "0 0 8px" }}>
          邀請家人看顧
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "0 0 24px" }}>
          請家人下載「暖暖」App 並輸入這組邀請碼
        </p>

        <div style={{
          background: "linear-gradient(135deg, #FFF9EF 0%, #FBE6D4 100%)",
          borderRadius: "var(--r-lg)", padding: 24,
          textAlign: "center", border: "1px solid var(--gold-soft)",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 8 }}>
            您的邀請碼
          </div>
          <div style={{
            fontSize: "var(--fs-3xl)", fontWeight: 800,
            color: "var(--primary-deep)", letterSpacing: "8px",
            fontFamily: "ui-monospace, monospace",
          }}>872-461</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 8 }}>
            24 小時內有效
          </div>
        </div>

        <div style={{
          background: "var(--surface)", borderRadius: "var(--r-lg)",
          padding: 20, textAlign: "center", border: "1px solid var(--line)",
          marginBottom: 24,
        }}>
          <div style={{
            width: 140, height: 140, margin: "0 auto 8px",
            background: `
              repeating-linear-gradient(0deg, var(--ink-1) 0 6px, transparent 6px 12px),
              repeating-linear-gradient(90deg, var(--ink-1) 0 6px, transparent 6px 12px)
            `,
            backgroundColor: "#fff",
            borderRadius: 8, border: "4px solid var(--ink-1)",
          }} />
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
            或用手機掃描 QR Code
          </div>
        </div>

        <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>
          複製邀請碼
        </button>
      </div>
    </div>
  );
}

export function FamilyShareScreen({ onBack }: FamilyShareScreenProps) {
  const [showInvite, setShowInvite] = useState(false);
  const family = [
    { name: "王志明", rel: "兒子", status: "已連結", avatar: "志", color: "#7AA779", view: "所有資料" },
    { name: "王雅雯", rel: "女兒", status: "已連結", avatar: "雅", color: "#E8845A", view: "健康警示" },
    { name: "王小華", rel: "孫女", status: "已邀請", avatar: "華", color: "#D9A441", view: "—" },
  ];

  return (
    <SubPage
      title="家人共享"
      onBack={onBack}
      accent="linear-gradient(180deg, #DCEBD8 0%, transparent 100%)"
      footer={
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => setShowInvite(true)}>
          <Icon name="plus" size={26} color="#fff" stroke={2.8} />
          邀請家人
        </button>
      }
    >
      <div style={{
        background: "var(--sage-soft)", borderRadius: "var(--r-lg)",
        padding: 18, marginBottom: 22,
        display: "flex", gap: 14, alignItems: "flex-start",
        border: "1px solid #B5D2B0",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--sage)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="heart" size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "#4F7A4E", marginBottom: 4 }}>
            為什麼讓家人看到？
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-1)", lineHeight: 1.5 }}>
            家人可以幫您留意飲食和健康。如果發現異常（例如連續沒吃飯），會立刻通知他們。
          </div>
        </div>
      </div>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
        已連結的家人
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {family.map((f, i) => (
          <div key={i} style={{
            background: "var(--surface)", borderRadius: "var(--r-lg)",
            padding: 16, border: "1px solid var(--line)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: f.color + "33",
                color: f.color, fontSize: 26, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${f.color}`,
                flexShrink: 0,
              }}>{f.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{f.name}</span>
                  <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{f.rel}</span>
                </div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                  {f.status === "已連結" ? (
                    <><span style={{ color: "var(--sage)" }}>● </span>{f.status}　·　看{f.view}</>
                  ) : (
                    <><span style={{ color: "var(--gold)" }}>● </span>{f.status}（等候中）</>
                  )}
                </div>
              </div>
              <Icon name="settings" size={22} color="var(--ink-3)" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
        家人可以看到的內容
      </div>
      <div style={{
        background: "var(--surface)", borderRadius: "var(--r-lg)",
        border: "1px solid var(--line)", overflow: "hidden",
      }}>
        {[
          { icon: "flame", label: "今日卡路里", on: true },
          { icon: "heart", label: "健康警示（血壓、漏餐）", on: true },
          { icon: "calendar", label: "飲食日記", on: true },
          { icon: "mic", label: "AI 對話內容", on: false },
        ].map((r, i) => (
          <div key={i} style={{
            padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 14,
            borderBottom: i < 3 ? "1px solid var(--line)" : "none",
          }}>
            <Icon name={r.icon} size={22} color="var(--ink-2)" />
            <span style={{ flex: 1, fontSize: "var(--fs-base)" }}>{r.label}</span>
            <Toggle on={r.on} />
          </div>
        ))}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </SubPage>
  );
}
