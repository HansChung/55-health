"use client";

// 跟暖暖聊聊：按一下說話、再按一下送出 → 暖暖（lk888 的 Gemini）聽懂並回答 → 手機念出來
// 一句一句來（不是即時通話），次數和「問暖暖」共用每天的題數

import { useState, useEffect, useRef } from "react";
import { TranscriptMessage, VoiceTone } from "@/lib/types";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { api, ApiError } from "@/lib/api-client";
import { trackEvent } from "@/lib/telemetry";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { audioPayload } from "@/lib/direct-upload";
import { speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import { VOICE_HISTORY_MAX, VOICE_TURN_MAX_SECONDS } from "@/lib/voice-chat";
import type { AskMessage } from "@/lib/ask";
import type { ChapterIntentHint } from "@/lib/chapter-opening";

interface VoiceScreenProps {
  onClose: () => void;
  voiceTone?: VoiceTone;
  chapterIntent?: ChapterIntentHint | null;
  /** 改用打字問暖暖 */
  onTypeInstead?: () => void;
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // fallback：手動產生合法 UUID v4（後端 z.string().uuid() 才不會擋）
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function WaveformDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--primary)",
          animation: `pop 0.8s ${i * 0.15}s ease-in-out infinite alternate`,
        }} />
      ))}
    </span>
  );
}

export function VoiceScreen({ onClose, voiceTone = "warm", chapterIntent, onTypeInstead }: VoiceScreenProps) {
  // idle：等他按；recording：在錄；thinking：送出去等暖暖；speaking：暖暖在念
  const [state, setState] = useState<"idle" | "recording" | "thinking" | "speaking" | "error">("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const recorder = useVoiceRecorder(VOICE_TURN_MAX_SECONDS);
  const historyRef = useRef<AskMessage[]>([]);
  const convSessionIdRef = useRef<string>("");           // 這次打開畫面一個 UUID（conversations.session_id）
  const closedRef = useRef(false);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // 第幾次念：被打斷的那句之後才觸發的「念完」不能改到新的狀態
  const speechIdRef = useRef(0);

  // 寫入一則對話到 DB（fire-and-forget，失敗不影響 UX）
  const logMessage = (role: "user" | "assistant", content: string) => {
    const text = content?.trim();
    if (!text) return;
    if (!convSessionIdRef.current) convSessionIdRef.current = generateUuid();
    api.logConversation({
      role,
      content: text,
      session_id: convSessionIdRef.current,
    }).catch((e) => console.warn("[voice] log conversation failed:", e));
  };

  const toneIntros: Record<VoiceTone, string> = {
    warm: "按一下開始跟我說話",
    strict: "按一下開始諮詢健康",
    grandchild: "按一下，跟小孫子說話！",
  };

  useEffect(() => {
    // 開發模式 React 會掛載兩次：重新掛載時要把旗標還原
    closedRef.current = false;
    api.askQuota().then((r) => setQuota(r.quota)).catch(() => undefined);
    return () => {
      closedRef.current = true;
      stopGuideSpeech();
    };
  }, []);

  // 有新的一句、或下面的按鈕變了（對話區高度跟著變）就捲到最下面
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript, state]);

  // 錄好了就送出
  useEffect(() => {
    const rec = recorder.result;
    if (!rec) return;
    recorder.clear();
    void sendTurn(rec.blob);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.result]);

  const sendTurn = async (blob: Blob) => {
    setState("thinking");
    try {
      const payload = await audioPayload(blob);
      const res = await api.voiceTurn({
        ...payload,
        history: historyRef.current,
        chapterTitle: chapterIntent?.label ?? null,
      });
      if (closedRef.current) return;
      setQuota(res.quota);
      const heard = res.heard || "（暖暖沒聽清楚的一句話）";
      historyRef.current = [
        ...historyRef.current,
        { role: "user" as const, text: heard },
        { role: "assistant" as const, text: res.reply },
      ].slice(-VOICE_HISTORY_MAX);
      setTranscript((t) => [...t, { role: "user", text: res.heard || "🎤 （語音）" }, { role: "ai", text: res.reply }]);
      if (res.heard) logMessage("user", res.heard);
      logMessage("assistant", res.reply);
      const speechId = ++speechIdRef.current;
      const done = () => {
        if (!closedRef.current && speechId === speechIdRef.current) setState((s) => (s === "speaking" ? "idle" : s));
      };
      const speaking = speakGuideParagraphs([res.reply], { onEnd: done, onError: done });
      setState(speaking ? "speaking" : "idle");
    } catch (err: unknown) {
      if (closedRef.current) return;
      const data = err instanceof ApiError ? (err.data as { quota?: { used: number; limit: number } } | null) : null;
      if (data?.quota) setQuota(data.quota);
      const status = (err as { status?: number })?.status;
      setErrorMsg(
        status === 401 ? "請先登入"
          : err instanceof ApiError && err.isNetwork ? "網路不太穩，請再說一次"
          : err instanceof Error && err.message ? err.message
          : "暖暖這次沒聽清楚，請再說一次"
      );
      setState("error");
    }
  };

  const handleMicPress = async () => {
    if (state === "thinking" || recorder.starting) return;
    // 在錄 → 說完了，停下來送出（送出在 recorder.result 的 effect 裡）
    if (recorder.recording) {
      recorder.stop();
      return;
    }
    // 暖暖還在念 → 先停下來，直接換他說
    speechIdRef.current++;
    stopGuideSpeech();
    setErrorMsg("");
    const err = await recorder.start();
    if (err) {
      setErrorMsg(err === "unsupported" ? "這支手機的瀏覽器不能錄音，請改用打字問暖暖" : "要先允許使用麥克風，暖暖才聽得到");
      setState("error");
      return;
    }
    if (closedRef.current) return;
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("voice_start");
    }
    setState("recording");
  };

  const stopSpeaking = () => {
    speechIdRef.current++;
    stopGuideSpeech();
    setState("idle");
  };

  const mascotMood = state === "thinking" ? "thinking" as const : state === "speaking" ? "excited" as const : "happy" as const;
  const isActive = state === "recording" || state === "thinking" || state === "speaking";
  const remaining = quota && quota.limit < 99999 ? Math.max(0, quota.limit - quota.used) : null;
  const quotaText = remaining === null ? "" : remaining > 0 ? `今天還可以說 ${remaining} 句（和問暖暖一起算）` : "今天的題數用完了，明天再來聊";

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: `
        radial-gradient(ellipse 80% 50% at 50% 0%, #FBE6D4 0%, transparent 70%),
        linear-gradient(180deg, #FFF6E6 0%, var(--bg) 100%)
      `,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 20px 12px" }}>
        <button onClick={onClose} aria-label="關閉" style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "var(--surface)", border: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="chevronD" size={24} color="var(--ink-1)" />
        </button>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ink-2)" }}>
          {isActive ? "對話中" : "跟暖暖聊天"}
        </div>
        <div style={{ width: 48 }} />
      </div>

      {chapterIntent && (
        <div style={{
          margin: "0 20px 8px", padding: "12px 14px",
          background: "var(--primary-soft)", borderRadius: 14,
          border: "1px solid var(--primary)",
        }}>
          <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--primary-deep)" }}>
            書本練習｜{chapterIntent.label}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 4, lineHeight: 1.45 }}>
            二問：{chapterIntent.tips.join(" · ")}
          </div>
        </div>
      )}

      {onTypeInstead && !isActive && (
        <button
          type="button"
          onClick={onTypeInstead}
          style={{
            alignSelf: "center", margin: "0 20px 4px", padding: "8px 16px", minHeight: 44,
            background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 999,
            fontSize: "var(--fs-sm)", color: "var(--ink-2)", cursor: "pointer",
          }}
        >
          ✍️ 想用打字？改用打字問暖暖 →
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 24px 8px" }}>
        <Mascot
          size={transcript.length ? 96 : 160}
          mood={mascotMood}
          listening={state === "recording"}
          talking={state === "speaking"}
        />
        <div style={{
          marginTop: 16, fontSize: "var(--fs-base)", fontWeight: 700,
          color: "var(--ink-1)", textAlign: "center",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {state === "idle" && (transcript.length === 0 ? toneIntros[voiceTone] : "還想問什麼？")}
          {state === "recording" && <><WaveformDots /> 我在聽…（{recorder.seconds} 秒）</>}
          {state === "thinking" && <>暖暖想一下…</>}
          {state === "speaking" && <><WaveformDots /> 暖暖正在說</>}
          {state === "error" && <>{errorMsg}</>}
        </div>
        {quotaText && (
          <div style={{ marginTop: 8, fontSize: "var(--fs-sm)", color: "var(--ink-2)", textAlign: "center" }}>
            {quotaText}
          </div>
        )}
        {state === "speaking" && (
          <button
            type="button"
            onClick={stopSpeaking}
            style={{
              marginTop: 10, padding: "8px 18px", minHeight: 44,
              background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 999,
              fontSize: "var(--fs-sm)", color: "var(--ink-1)", cursor: "pointer",
            }}
          >
            🔇 先不要念
          </button>
        )}
      </div>

      <div ref={scrollRef} className="scroll-area" style={{
        flex: 1, overflowY: "auto", padding: "8px 20px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {/* 對話少的時候貼底；多了可以往上捲（flex-end 會讓上面的訊息捲不到） */}
        <div style={{ flex: 1 }} />
        {transcript.length === 0 && state === "idle" && (
          <div style={{
            background: "var(--surface)", borderRadius: 16,
            padding: 16, fontSize: "var(--fs-sm)", color: "var(--ink-2)",
            border: "1px solid var(--line)", textAlign: "center", lineHeight: 1.55,
          }}>
            試試說：「我今天可以吃水餃嗎？」<br />
            或「幫我看看今天營養夠不夠」
          </div>
        )}
        {transcript.map((m, i) => (
          <div key={i} className="fade-up" style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%",
              background: m.role === "user" ? "var(--primary)" : "var(--surface-warm)",
              color: m.role === "user" ? "#fff" : "var(--ink-1)",
              padding: "14px 18px",
              borderRadius: m.role === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
              fontSize: "var(--fs-base)", lineHeight: 1.5,
              border: m.role === "user" ? "none" : "1px solid var(--line)",
            }}>{m.text}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px 24px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <button
          onClick={handleMicPress}
          disabled={state === "thinking" || recorder.starting}
          aria-label={state === "recording" ? "說完了，送出" : state === "thinking" ? "暖暖在想" : "開始說話"}
          style={{
            width: 100, height: 100, borderRadius: "50%",
            background: state === "recording"
              ? "linear-gradient(135deg, #C95E36, #8B3D1F)"
              : "linear-gradient(135deg, #F4B58E, #E8845A)",
            boxShadow: state === "recording"
              ? "0 4px 0 var(--primary-deep)"
              : "0 8px 0 var(--primary-deep), 0 14px 24px rgba(201, 94, 54, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", transition: "all 0.2s",
          }}>
          {state === "idle" && (
            <div style={{
              position: "absolute", inset: -6, borderRadius: "50%",
              border: "2px solid rgba(232, 132, 90, 0.3)",
              animation: "pulse-ring 2s ease-out infinite",
            }} />
          )}
          {state === "recording" ? (
            <div style={{ width: 34, height: 34, borderRadius: 6, background: "#fff" }} />
          ) : state === "thinking" ? (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              animation: "spin 0.8s linear infinite",
            }} />
          ) : (
            <Icon name="mic" size={48} color="#fff" stroke={2.5} />
          )}
        </button>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", textAlign: "center" }}>
          {state === "idle" && (transcript.length === 0 ? "按一下說話，說完再按一下" : "按一下再說一句")}
          {state === "recording" && "說完了，按一下送出"}
          {state === "thinking" && "暖暖在聽，稍等一下"}
          {state === "speaking" && "想接著說，直接按麥克風"}
          {state === "error" && "按一下再試"}
        </div>
      </div>
    </div>
  );
}
