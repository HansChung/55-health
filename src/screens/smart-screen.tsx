"use client";

import { useEffect, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { RadarChart } from "@/components/radar-chart";
import { api, type SmartAssessment } from "@/lib/api-client";
import { trackEvent } from "@/lib/telemetry";
import {
  LIKERT_LABELS,
  DIMENSIONS,
  buildQuizPlan,
  buildSmartInsights,
  type SmartDimension,
  type SmartInsights,
  type SmartScores,
  type SmartQuestion,
  type QuizPlan,
  type DimensionTip,
} from "@/lib/smart";

interface SmartScreenProps {
  onBack: () => void;
}

type Mode = "loading" | "intro" | "quiz" | "submitting" | "result";

function toScores(a: SmartAssessment): SmartScores {
  return { S: a.score_s, M: a.score_m, A: a.score_a, R: a.score_r, T: a.score_t };
}

function formatDelta(d: number | null | undefined): string | null {
  if (d == null || d === 0) return null;
  return d > 0 ? `▲ +${d}` : `▼ ${d}`;
}

export function SmartScreen({ onBack }: SmartScreenProps) {
  const [mode, setMode] = useState<Mode>("loading");
  const [history, setHistory] = useState<SmartAssessment[]>([]);
  const [quizPlan, setQuizPlan] = useState<QuizPlan | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<SmartQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [delta, setDelta] = useState<number | null>(null);
  const [insights, setInsights] = useState<SmartInsights | null>(null);
  const [selectedDim, setSelectedDim] = useState<SmartDimension | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listSmartAssessments()
      .then(({ assessments, insights: serverInsights, nextQuiz }) => {
        setHistory(assessments);
        setQuizPlan(
          nextQuiz ??
            buildQuizPlan({
              previousScores: assessments[0] ? toScores(assessments[0]) : null,
            })
        );
        if (assessments.length > 0) {
          const latest = assessments[0];
          const prev = assessments[1] ? toScores(assessments[1]) : null;
          const resolved =
            serverInsights ?? buildSmartInsights(toScores(latest), prev, null);
          setInsights(resolved);
          setSelectedDim(resolved.focus.key);
          if (prev) setDelta(latest.shi - (assessments[1]?.shi ?? latest.shi));
          setMode("result");
        } else {
          setMode("intro");
        }
      })
      .catch(() => {
        setQuizPlan(buildQuizPlan({ previousScores: null }));
        setMode("intro");
      });
  }, []);

  const latest = history[0] ?? null;
  const previous = history[1] ?? null;

  const startQuiz = (plan?: QuizPlan | null) => {
    const p =
      plan ??
      quizPlan ??
      buildQuizPlan({
        previousScores: latest ? toScores(latest) : null,
      });
    setQuizPlan(p);
    setQuizQuestions(p.questions);
    setAnswers(new Array(p.questions.length).fill(0));
    setStep(0);
    setError("");
    setMode("quiz");
  };

  const answerCurrent = (value: number) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    setTimeout(() => {
      if (step < quizQuestions.length - 1) {
        setStep(step + 1);
      } else {
        submit(next);
      }
    }, 180);
  };

  const submit = async (finalAnswers: number[]) => {
    if (!quizPlan || quizQuestions.length === 0) return;
    setMode("submitting");
    try {
      const responses = quizQuestions.map((q, i) => ({
        id: q.id,
        value: finalAnswers[i],
      }));
      const res = await api.submitSmartAssessment({
        mode: quizPlan.mode,
        responses,
      });
      trackEvent("smart_submit", {
        shi: res.assessment.shi,
        mode: quizPlan.mode,
        questions: quizQuestions.length,
      });
      setDelta(res.delta);
      setInsights(res.insights);
      setSelectedDim(res.insights.focus.key);
      const { assessments, insights: listed, nextQuiz } = await api.listSmartAssessments();
      setHistory(assessments);
      if (listed) setInsights(listed);
      if (nextQuiz) setQuizPlan(nextQuiz);
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
    const q = quizQuestions[step];
    if (!q) {
      return (
        <SubPage title="智慧幸福檢測" onBack={onBack}>
          <div style={{ padding: 40, textAlign: "center" }}>題目載入中…</div>
        </SubPage>
      );
    }
    const dim = DIMENSIONS.find((d) => d.key === q.dim)!;
    const total = quizQuestions.length;
    const progress = ((step + (mode === "submitting" ? 1 : 0)) / total) * 100;
    const isQuick = quizPlan?.mode === "quick";
    return (
      <SubPage
        title={isQuick ? "智慧複測" : "智慧幸福檢測"}
        onBack={() => (step > 0 ? setStep(step - 1) : setMode(history.length ? "result" : "intro"))}
      >
        {isQuick && quizPlan && (
          <div style={{
            marginBottom: 16, padding: "10px 14px",
            background: "var(--surface-warm, #FBF3E8)",
            borderRadius: 12, fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5,
          }}>
            {quizPlan.subtitle}
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "var(--fs-sm)", color: dim.color, fontWeight: 700 }}>
              {dim.label}
            </span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>
              第 {step + 1} / {total} 題
            </span>
          </div>
          <div style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: dim.color, transition: "width .3s" }} />
          </div>
        </div>

        <div style={{
          fontSize: "var(--fs-xl)", fontWeight: 700, lineHeight: 1.5,
          color: "var(--ink-1)", marginBottom: 32, minHeight: 100,
        }}>
          {q.text}
        </div>

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
    const plan = quizPlan ?? buildQuizPlan({ previousScores: null });
    return (
      <SubPage title="智慧幸福檢測" onBack={onBack}
        footer={
          <button className="btn-primary" style={{ width: "100%" }} onClick={() => startQuiz(plan)}>
            {plan.title}（約 {plan.estimatedMinutes} 分鐘）
          </button>
        }
      >
        <div style={{ textAlign: "center", padding: "12px 0 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🧭</div>
          <h2 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "0 0 10px" }}>
            智慧幸福指數 SHI
          </h2>
          <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
            第一次用 15 個小問題建立基準；之後改成智慧複測，<br />
            針對較弱面向多關心，不用每次都答一樣的題。
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
  const resolved = insights ?? buildSmartInsights(scores, previous ? toScores(previous) : null, null);
  const verdict = resolved.verdict;
  const trend = [...history].reverse();
  const selectedTip: DimensionTip =
    resolved.dimensionTips.find((t) => t.key === (selectedDim ?? resolved.focus.key)) ??
    resolved.dimensionTips.find((t) => t.key === resolved.focus.key)!;
  const retestPlan = quizPlan ?? buildQuizPlan({ previousScores: scores });
  const retestLabel =
    retestPlan.mode === "quick"
      ? `智慧複測（約 ${retestPlan.questions.length} 題）`
      : "重新檢測";

  return (
    <SubPage title="智慧幸福檢測" onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn-primary" style={{ width: "100%" }} onClick={() => startQuiz(retestPlan)}>
            {retestLabel}
          </button>
          {retestPlan.mode === "quick" && (
            <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-3)", lineHeight: 1.4 }}>
              {retestPlan.subtitle}
            </div>
          )}
        </div>
      }
    >
      {/* SHI 總分 */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700 }}>SHI 智慧幸福指數</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, margin: "4px 0" }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: verdict.color, lineHeight: 1 }}>{latest.shi}</span>
          {delta != null && delta !== 0 && (
            <span style={{ fontSize: "var(--fs-lg)", fontWeight: 800, color: delta > 0 ? "var(--sage)" : "var(--berry)" }}>
              {formatDelta(delta)}
            </span>
          )}
        </div>
        <span style={{
          display: "inline-block", padding: "4px 16px", borderRadius: 99,
          background: verdict.color, color: "#fff", fontSize: "var(--fs-sm)", fontWeight: 700,
        }}>{verdict.label}</span>
      </div>

      {/* 雷達圖 */}
      <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 4px" }}>
        <RadarChart
          scores={scores}
          compare={previous ? toScores(previous) : null}
          size={300}
          highlight={resolved.focus.key}
          selected={selectedDim ?? resolved.focus.key}
          onSelectDimension={setSelectedDim}
          animate
        />
      </div>
      <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginBottom: 16 }}>
        點選構面可看建議
      </div>

      <InsightCards
        insights={resolved}
        selectedTip={selectedTip}
        onSelectDim={setSelectedDim}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {resolved.dimensionTips.map((d) => {
          const dLabel = formatDelta(d.delta);
          const isSel = d.key === (selectedDim ?? resolved.focus.key);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setSelectedDim(d.key)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: isSel ? d.color + "14" : "transparent",
                border: isSel ? `1px solid ${d.color}55` : "1px solid transparent",
                borderRadius: 12, padding: "8px 10px", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>{d.label}</span>
                <span style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: d.color }}>
                  {d.score}
                  {dLabel && (
                    <span style={{
                      marginLeft: 8,
                      color: (d.delta ?? 0) > 0 ? "var(--sage)" : "var(--berry)",
                      fontWeight: 700,
                    }}>{dLabel}</span>
                  )}
                </span>
              </div>
              <div style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${d.score}%`, height: "100%", background: d.color }} />
              </div>
            </button>
          );
        })}
      </div>

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

function InsightCards({
  insights,
  selectedTip,
  onSelectDim,
}: {
  insights: SmartInsights;
  selectedTip: DimensionTip;
  onSelectDim: (k: SmartDimension) => void;
}) {
  const strengthDelta = formatDelta(
    insights.deltas ? insights.deltas[insights.strength.key] : null
  );
  const focusDelta = formatDelta(
    insights.deltas ? insights.deltas[insights.focus.key] : null
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
      <div style={{
        background: insights.strength.color + "18",
        border: `1px solid ${insights.strength.color}55`,
        borderRadius: "var(--r-lg)", padding: 16,
      }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: insights.strength.color, marginBottom: 4 }}>
          您的優勢：{insights.strength.label}
          {strengthDelta && <span style={{ marginLeft: 8 }}>{strengthDelta}</span>}
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55 }}>
          {insights.strengthNote}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelectDim(insights.focus.key)}
        style={{
          background: insights.focus.color + "18",
          border: `1px solid ${insights.focus.color}55`,
          borderRadius: "var(--r-lg)", padding: 16,
          textAlign: "left", cursor: "pointer",
        }}
      >
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: insights.focus.color, marginBottom: 4 }}>
          可以優先加強：{insights.focus.label}
          {focusDelta && <span style={{ marginLeft: 8 }}>{focusDelta}</span>}
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55 }}>
          {insights.personalizedNote}
        </div>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 8, fontWeight: 700 }}>
          {insights.dimensionTips.find((t) => t.key === insights.focus.key)?.ctaLabel}
        </div>
      </button>

      <div style={{
        background: "var(--surface)",
        border: `1px solid ${selectedTip.color}66`,
        borderRadius: "var(--r-lg)", padding: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: selectedTip.color }}>
            {selectedTip.label}
          </div>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: selectedTip.color }}>
            {selectedTip.score} 分
            {formatDelta(selectedTip.delta) && (
              <span style={{
                marginLeft: 8,
                color: (selectedTip.delta ?? 0) > 0 ? "var(--sage)" : "var(--berry)",
              }}>
                {formatDelta(selectedTip.delta)}
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 6 }}>
          {selectedTip.desc}
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-1)", lineHeight: 1.55, fontWeight: 600 }}>
          {selectedTip.tip}
        </div>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 8, fontWeight: 700 }}>
          {selectedTip.ctaLabel}
        </div>
      </div>
    </div>
  );
}

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
