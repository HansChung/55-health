"use client";

import { useState } from "react";
import { Mascot } from "@/components/mascot";
import { MascotMood } from "@/lib/types";

interface OnboardingScreenProps {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const slides: { mood: MascotMood; title: string; body: string; cta: string }[] = [
    {
      mood: "happy",
      title: "您好，我是暖暖",
      body: "我會幫您記錄每天吃了什麼，提醒您注意營養和健康。",
      cta: "繼續",
    },
    {
      mood: "excited",
      title: "拍張照就好",
      body: "吃飯前用手機拍一下，我會自動告訴您熱量和營養。",
      cta: "繼續",
    },
    {
      mood: "happy",
      title: "可以跟我聊聊",
      body: "不會打字也沒關係，按住麥克風跟我說話就可以了。",
      cta: "開始使用",
    },
  ];
  const s = slides[step];

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 32px", textAlign: "center",
      background: "linear-gradient(180deg, #FFF3DF 0%, var(--bg) 70%)",
    }}>
      <div key={step} className="pop" style={{ marginBottom: 24 }}>
        <Mascot size={180} mood={s.mood} />
      </div>
      <div key={step + "t"} className="fade-up" style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: 0, color: "var(--ink-1)", letterSpacing: "-0.5px" }}>
          {s.title}
        </h1>
      </div>
      <p key={step + "b"} className="fade-up" style={{
        fontSize: "var(--fs-lg)", color: "var(--ink-2)",
        lineHeight: 1.6, margin: "0 0 40px", maxWidth: 340,
      }}>{s.body}</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 28 : 10, height: 10, borderRadius: 5,
            background: i === step ? "var(--primary)" : "var(--line-strong)",
            transition: "width 0.3s",
          }} />
        ))}
      </div>

      <button
        className="btn-primary"
        style={{ width: "100%", maxWidth: 340 }}
        onClick={() => step < slides.length - 1 ? setStep(step + 1) : onDone()}
      >{s.cta}</button>

      {step < slides.length - 1 && (
        <button
          style={{ marginTop: 16, fontSize: "var(--fs-base)", color: "var(--ink-2)", fontWeight: 500 }}
          onClick={onDone}
        >略過</button>
      )}
    </div>
  );
}
