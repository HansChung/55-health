"use client";

// ────────────────────────────────────────────────
// 動動腦：每日一題（全台同一題，算連續天數、徽章）＋練習題（不算）
// 全部是點大按鈕作答；題目可以念出來；記數字先給看 5 秒再藏起來
// 伺服器還沒準備好（503）也能玩，只是不記連續天數
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { api, ApiError, type BrainStats } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import {
  BRAIN_KINDS,
  MEMORY_SECONDS,
  dailyQuestion,
  hashSeed,
  makeQuestion,
  taipeiDay,
  type BrainKind,
  type BrainQuestion,
} from "@/lib/brain-games";

type Mode = { type: "daily" } | { type: "practice"; kind: BrainKind; seed: number };

const optionStyle = (state: "idle" | "right" | "wrong" | "dim", big: boolean): React.CSSProperties => ({
  minHeight: big ? 84 : 72, width: "100%", borderRadius: "var(--r-md)", cursor: "pointer", fontFamily: "inherit",
  fontSize: big ? 44 : "var(--fs-lg)", fontWeight: 800, color: "var(--ink-1)",
  border: `3px solid ${state === "right" ? "var(--sage)" : state === "wrong" ? "var(--berry)" : "var(--line-strong)"}`,
  background: state === "right" ? "var(--sage-soft)" : state === "wrong" ? "var(--berry-soft)" : "var(--surface)",
  opacity: state === "dim" ? 0.55 : 1,
});

export function BrainGameScreen({ onBack }: { onBack: () => void }) {
  const toast = useToast();
  const [stats, setStats] = useState<BrainStats | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [mode, setMode] = useState<Mode>({ type: "daily" });
  const [chosen, setChosen] = useState<number | null>(null);
  const [hiding, setHiding] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const question: BrainQuestion = mode.type === "daily" ? dailyQuestion(taipeiDay()) : makeQuestion(mode.kind, mode.seed);
  const kindMeta = BRAIN_KINDS.find((k) => k.id === question.kind)!;
  const dailyDone = mode.type === "daily" && Boolean(stats?.today.played);

  useEffect(() => {
    api.brainStats()
      .then((r) => setStats(r.stats))
      .catch((e) => { if (e instanceof ApiError && e.status === 503) setUnavailable(true); });
    return () => {
      stopGuideSpeech();
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  // 記數字：換題時先給看幾秒
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!question.memorize || chosen !== null || dailyDone) {
      setHiding(0);
      return;
    }
    setHiding(MEMORY_SECONDS);
    timer.current = setInterval(() => {
      setHiding((s) => {
        if (s <= 1 && timer.current) clearInterval(timer.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
  }, [mode, dailyDone]);

  const answer = async (i: number) => {
    if (chosen !== null || hiding > 0) return;
    setChosen(i);
    stopGuideSpeech();
    const correct = i === question.answer;
    trackEvent("brain_answer", { kind: question.kind, daily: mode.type === "daily", correct });
    if (mode.type !== "daily" || unavailable) return;
    try {
      const r = await api.brainAnswer({ kind: question.kind, correct });
      setStats(r.stats);
      if (r.first && r.stats.streak > 1) toast.success(`連續 ${r.stats.streak} 天動動腦 🔥`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) setUnavailable(true);
      else toast.error("沒記到今天的分數，請再試一次");
    }
  };

  const practice = (kind?: BrainKind) => {
    stopGuideSpeech();
    const k = kind ?? BRAIN_KINDS[Math.floor(Math.random() * BRAIN_KINDS.length)].id;
    setChosen(null);
    setMode({ type: "practice", kind: k, seed: hashSeed(`${Date.now()}:${Math.random()}`) });
  };

  const speak = () => {
    const ok = speakGuideParagraphs([question.prompt, ...(question.kind === "odd" ? [] : question.options)], { rate: 0.9 });
    if (!ok) toast.info("這支手機不支援朗讀");
  };

  const answered = chosen !== null;
  const right = answered && chosen === question.answer;
  const big = question.kind === "odd";

  return (
    <SubPage title="動動腦" onBack={onBack}>
      {/* 連續天數 */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--surface-warm)", border: "1px solid var(--gold-soft)", borderRadius: "var(--r-lg)", padding: 14 }}>
        <Mascot size={52} mood={right ? "excited" : "happy"} />
        <div style={{ flex: 1, fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
          {unavailable ? (
            "可以玩，但現在還記不了連續天數"
          ) : stats ? (
            <>
              {stats.streak > 0 ? <>已經連續 <strong>{stats.streak}</strong> 天動動腦 🔥</> : "每天一題，動動腦、不怕忘"}
              <span style={{ color: "var(--ink-3)" }}>　累積 {stats.days} 天</span>
            </>
          ) : "每天一題，動動腦、不怕忘"}
        </div>
      </div>

      {/* 題目 */}
      <div className="card" style={{ marginTop: 16, padding: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)", background: "var(--primary-soft)", borderRadius: 999, padding: "4px 12px", whiteSpace: "nowrap" }}>
            {mode.type === "daily" ? "今天的題目" : "練習"}・{kindMeta.emoji} {kindMeta.label}
          </span>
          {canSpeakGuide() && !dailyDone && hiding === 0 && (
            <button type="button" onClick={speak} className="btn-ghost" style={{ minHeight: 44, padding: "4px 12px", whiteSpace: "nowrap" }} aria-label="念題目">🔊 念題目</button>
          )}
        </div>

        {dailyDone && !answered ? (
          <div style={{ textAlign: "center", padding: "12px 0", lineHeight: 1.7 }}>
            <div style={{ fontSize: 44 }} aria-hidden="true">{stats?.today.correct ? "🎉" : "💪"}</div>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>今天的題目做完了</div>
            <div style={{ color: "var(--ink-2)" }}>{stats?.today.correct ? "答對了，明天再來！" : "沒關係，明天再試試看"}</div>
          </div>
        ) : hiding > 0 && question.memorize ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)" }}>記住這個號碼（{hiding} 秒）</div>
            <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: 8, margin: "12px 0", fontVariantNumeric: "tabular-nums" }}>{question.memorize}</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, lineHeight: 1.6, marginBottom: 16 }}>{question.prompt}</div>
            <div style={{ display: "grid", gridTemplateColumns: big ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
              {question.options.map((o, i) => {
                const state = !answered ? "idle" : i === question.answer ? "right" : i === chosen ? "wrong" : "dim";
                return (
                  <button key={i} type="button" onClick={() => answer(i)} style={optionStyle(state, big)} aria-label={big ? `第 ${i + 1} 個` : o}>
                    {o}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {answered && (
          <div role="status" style={{ marginTop: 16, padding: 14, borderRadius: "var(--r-md)", background: right ? "var(--sage-soft)" : "var(--berry-soft)", lineHeight: 1.7 }}>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>{right ? "🎉 答對了！" : "差一點點！"}</div>
            <div>{question.explain}</div>
          </div>
        )}
      </div>

      {(answered || dailyDone) && (
        <button type="button" className="btn-primary" style={{ width: "100%", marginTop: 16, minHeight: 64 }} onClick={() => practice()}>
          🧩 再練一題（不算分）
        </button>
      )}

      <div style={{ fontWeight: 800, margin: "24px 0 10px" }}>想練哪一種？</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {BRAIN_KINDS.map((k) => (
          <button key={k.id} type="button" className="btn-ghost" style={{ minHeight: 60 }} onClick={() => practice(k.id)}>
            {k.emoji} {k.label}
          </button>
        ))}
        {mode.type === "practice" && (
          <button type="button" className="btn-ghost" style={{ minHeight: 60 }} onClick={() => { setChosen(null); setMode({ type: "daily" }); }}>
            📅 回到今天的題目
          </button>
        )}
      </div>
    </SubPage>
  );
}
