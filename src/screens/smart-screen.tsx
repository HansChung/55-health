"use client";

import { useEffect, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { RadarChart } from "@/components/radar-chart";
import { api, type SmartAssessment } from "@/lib/api-client";
import {
  QUESTIONS,
  LIKERT_LABELS,
  DIMENSIONS,
  shiVerdict,
  weakestDimension,
  type SmartScores,
} from "@/lib/smart";

interface SmartScreenProps {
  onBack: () => void;
}

type Mode = "loading" | "intro" | "quiz" | "submitting" | "result";

function toScores(a: SmartAssessment): SmartScores {
  return { S: a.score_s, M: a.score_m, A: a.score_a, R: a.score_r, T: a.score_t };
}

export function SmartScreen({ onBack }: SmartScreenProps) {
  const [mode, setMode] = useState<Mode>("loading");
  const [history, setHistory] = useState<SmartAssessment[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [delta, setDelta] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listSmartAssessments()
      .then(({ assessments }) => {
        setHistory(assessments);
        setMode(assessments.length > 0 ? "result" : "intro");
      })
      .catch(() => setMode("intro"));
  }, []);

  const latest = history[0] ?? null;
  const previous = history[1] ?? null;

  const startQuiz = () => {
    setAnswers(new Array(QUESTIONS.length).fill(0));
    setStep(0);
    setError("");
    setMode("quiz");
  };

  const answerCurrent = (value: number) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    // 自動跳下一題
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        submit(next);
      }
    }, 180);
  };

  const submit = async (finalAnswers: number[]) => {
    setMode("submitting");
    try {
      const res = await api.submitSmartAssessment(finalAnswers);
      setDelta(res.delta);
      const { assessments } = await api.listSmartAssessments();
      setHistory(assessments);
      setMode("result");
    } catch (e) {
      setError("送出失敗：" + (e as Error).message);
      setMode("quiz");
    }
  };

  // ── 載入中 ──
  if (mode === "loading") {
    return (
      <SubPage title="智慧幸福檢測" onBack={onBack}>
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-2)" }}>載入中…</div>
      </SubPage>
    );
  }

  // ── 問卷進行中 ──
  if (mode === "quiz" || mode === "submitting") {
    const q = QUESTIONS[step];
    const dim = DIMENSIONS.find((d) => d.key === q.dim)!;
    const progress = ((step + (mode === "submitting" ? 1 : 0)) / QUESTIONS.length) * 100;
    return (
      <SubPage
        title="智慧幸福檢測"
        onBack={() => (step > 0 ? setStep(step - 1) : setMode(history.length ? "result" : "intro"))}
      >
        {/* 進度條 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "var(--fs-sm)", color: dim.color, fontWeight: 700 }}>
              {dim.label}
            </span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>
              第 {step + 1} / {QUESTIONS.length} 題
            </span>
          </div>
          <div style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: dim.color, transition: "width .3s" }} />
          </div>
        </div>

        {/* 題目 */}
        <div style={{
          fontSize: "var(--fs-xl)", fontWeight: 700, lineHeight: 1.5,
          color: "var(--ink-1)", marginBottom: 32, minHeight: 100,
        }}>
          {q.text}
        </div>

        {/* 1-5 大按鈕 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LIKERT_LABELS.map((label, i) => {
            const value = i + 1;
            const selected = answers[step] === value;
            return (
              <button
                key={value}
                onClick={() => answerCurrent(value)}
                disabled={mode === "submitting"}
                style={{
                  width: "100%", padding: "18px 20px", textAlign: "left",
                  background: selected ? dim.color : "var(--surface)",
                  border: `2px solid ${selected ? dim.color : "var(--line-strong)"}`,
                  borderRadius: "var(--r-lg)",
                  fontSize: "var(--fs-base)", fontWeight: 700,
                  color: selected ? "#fff" : "var(--ink-1)",
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer",
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: selected ? "rgba(255,255,255,0.25)" : "var(--surface-warm)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 16,
                }}>{value}</span>
                {label}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: "var(--berry-soft)", borderRadius: 10, color: "var(--berry)", fontSize: "var(--fs-sm)" }}>
            {error}
          </div>
        )}
      </SubPage>
    );
  }

  // ── 介紹頁（從未檢測過）──
  if (mode === "intro" || !latest) {
    return (
      <SubPage title="智慧幸福檢測" onBack={onBack}
        footer={<button className="btn-primary" style={{ width: "100%" }} onClick={startQuiz}>開始檢測（約 3 分鐘）</button>}
      >
        <div style={{ textAlign: "center", padding: "12px 0 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🧭</div>
          <h2 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "0 0 10px" }}>
            智慧幸福指數 SHI
          </h2>
          <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
            用 15 個小問題，幫您看見人生五大面向的狀態，<br />
            找出優勢與可以加強的地方。
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DIMENSIONS.map((d) => (
            <div key={d.key} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: 16, background: "var(--surface)",
              borderRadius: "var(--r-lg)", border: "1px solid var(--line)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: d.color + "22", color: d.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 18,
              }}>{d.key}</div>
              <div>
                <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{d.label}</div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SubPage>
    );
  }

  // ── 結果頁 ──
  const scores = toScores(latest);
  const verdict = shiVerdict(latest.shi);
  const weak = weakestDimension(scores);
  const trend = [...history].reverse(); // 舊→新

  return (
    <SubPage title="智慧幸福檢測" onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
      footer={<button className="btn-primary" style={{ width: "100%" }} onClick={startQuiz}>重新檢測</button>}
    >
      {/* SHI 總分 */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700 }}>SHI 智慧幸福指數</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, margin: "4px 0" }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: verdict.color, lineHeight: 1 }}>{latest.shi}</span>
          {delta != null && delta !== 0 && (
            <span style={{ fontSize: "var(--fs-lg)", fontWeight: 800, color: delta > 0 ? "var(--sage)" : "var(--berry)" }}>
              {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`}
            </span>
          )}
        </div>
        <span style={{
          display: "inline-block", padding: "4px 16px", borderRadius: 99,
          background: verdict.color, color: "#fff", fontSize: "var(--fs-sm)", fontWeight: 700,
        }}>{verdict.label}</span>
      </div>

      {/* 雷達圖 */}
      <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 8px" }}>
        <RadarChart scores={scores} compare={previous ? toScores(previous) : null} size={300} />
      </div>
      {previous && (
        <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginBottom: 16 }}>
          實線＝本次　·　虛線＝上次
        </div>
      )}

      {/* 各構面長條 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {DIMENSIONS.map((d) => (
          <div key={d.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>{d.label}</span>
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: d.color }}>{scores[d.key]}</span>
            </div>
            <div style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${scores[d.key]}%`, height: "100%", background: d.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* 建議優先改善 */}
      <div style={{
        background: weak.color + "18", border: `1px solid ${weak.color}55`,
        borderRadius: "var(--r-lg)", padding: 16, marginBottom: 20,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <div style={{ fontSize: 24 }}>💡</div>
        <div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 2 }}>
            可以優先加強：{weak.label}
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
            這是目前分數較低的面向（{scores[weak.key]} 分）。建議下個月再檢測一次，看看進步了多少。
          </div>
        </div>
      </div>

      {/* SHI 趨勢 */}
      {trend.length >= 2 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 10 }}>
            SHI 變化趨勢
          </div>
          <Sparkline values={trend.map((a) => a.shi)} />
        </div>
      )}

      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", textAlign: "center", marginTop: 8 }}>
        上次檢測：{new Date(latest.created_at).toLocaleDateString("zh-TW")}
      </div>
    </SubPage>
  );
}

/** SHI 趨勢小折線圖 */
function Sparkline({ values }: { values: number[] }) {
  const w = 320, h = 90, pad = 14;
  const max = 100, min = 0;
  const n = values.length;
  const x = (i: number) => pad + (i / (n - 1)) * (w - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline points={line} fill="none" stroke="#E8845A" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={4} fill="#E8845A" />
          <text x={x(i)} y={y(v) - 9} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink-1, #3D2E20)">{v}</text>
        </g>
      ))}
    </svg>
  );
}
