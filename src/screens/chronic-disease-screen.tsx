"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { SubPage } from "@/components/sub-page";

interface ChronicDiseaseScreenProps {
  onBack: () => void;
}

export function ChronicDiseaseScreen({ onBack }: ChronicDiseaseScreenProps) {
  const [selected, setSelected] = useState(["hypertension", "prediabetes"]);
  const meds = [
    { name: "降血壓藥", dose: "每天早上 1 顆", time: "早餐後" },
    { name: "阿斯匹靈", dose: "低劑量 100mg", time: "飯後" },
  ];

  const conditions = [
    { id: "hypertension", label: "高血壓", icon: "💢", tip: "少鹽、注意血壓" },
    { id: "diabetes", label: "糖尿病", icon: "🩸", tip: "控制醣類、規律進食" },
    { id: "prediabetes", label: "糖尿病前期", icon: "⚠️", tip: "減糖、運動" },
    { id: "cholesterol", label: "高血脂", icon: "🫀", tip: "少油、多蔬果" },
    { id: "gout", label: "痛風", icon: "🦴", tip: "少海鮮、多喝水" },
    { id: "kidney", label: "腎臟病", icon: "🫘", tip: "低鉀、低磷" },
    { id: "osteoporosis", label: "骨質疏鬆", icon: "🦴", tip: "補鈣、曬太陽" },
    { id: "none", label: "都沒有", icon: "🙂", tip: "保持健康習慣" },
  ];

  const toggle = (id: string) => {
    if (id === "none") {
      setSelected(selected.includes("none") ? [] : ["none"]);
      return;
    }
    setSelected(s => {
      const next = s.filter(x => x !== "none");
      return next.includes(id) ? next.filter(x => x !== id) : [...next, id];
    });
  };

  return (
    <SubPage
      title="健康狀況"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
      footer={
        <button className="btn-primary" style={{ width: "100%" }} onClick={onBack}>
          <Icon name="check" size={26} color="#fff" stroke={3} />
          儲存
        </button>
      }
    >
      <div style={{
        display: "flex", gap: 14, marginBottom: 22,
        padding: "14px 16px",
        background: "var(--surface-warm)",
        borderRadius: "var(--r-md)", border: "1px solid var(--line)",
      }}>
        <Mascot size={50} mood="happy" />
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, flex: 1 }}>
          告訴我您的狀況，我會幫您留意每餐的<strong style={{ color: "var(--primary-deep)" }}>鹽、糖、油</strong>，給更貼心的建議
        </div>
      </div>

      <div style={{
        fontSize: "var(--fs-sm)", fontWeight: 700,
        color: "var(--ink-2)", marginBottom: 12, letterSpacing: "0.5px",
      }}>您有哪些狀況？（可複選）</div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        marginBottom: 28,
      }}>
        {conditions.map(c => {
          const on = selected.includes(c.id);
          return (
            <button key={c.id} onClick={() => toggle(c.id)} style={{
              textAlign: "left",
              padding: "14px 14px",
              borderRadius: 16,
              background: on ? "var(--primary-soft)" : "var(--surface)",
              border: on ? "3px solid var(--primary)" : "2px solid var(--line)",
              display: "flex", flexDirection: "column", gap: 4,
              transition: "all 0.18s",
              minHeight: 96,
              position: "relative",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>{c.icon}</span>
                {on && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name="check" size={16} color="#fff" stroke={3.5} />
                  </div>
                )}
              </div>
              <div style={{
                fontSize: "var(--fs-base)", fontWeight: 700,
                color: on ? "var(--primary-deep)" : "var(--ink-1)",
              }}>{c.label}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>{c.tip}</div>
            </button>
          );
        })}
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 12,
      }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)" }}>
          常用藥物
        </div>
        <button style={{
          fontSize: "var(--fs-sm)", color: "var(--primary-deep)", fontWeight: 700,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Icon name="plus" size={18} color="var(--primary-deep)" stroke={2.5} />
          新增藥物
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {meds.map((m, i) => (
          <div key={i} style={{
            background: "var(--surface)", borderRadius: 16, padding: 16,
            border: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "var(--berry-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, flexShrink: 0,
            }}>💊</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                {m.dose}　·　{m.time}
              </div>
            </div>
            <Icon name="pencil" size={22} color="var(--ink-3)" />
          </div>
        ))}
      </div>
    </SubPage>
  );
}
