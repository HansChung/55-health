"use client";

import { useState, useEffect, useRef } from "react";
import { TranscriptMessage, VoiceTone } from "@/lib/types";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { api } from "@/lib/api-client";
import { RealtimeClient } from "@/lib/realtime-client";

interface VoiceScreenProps {
  onClose: () => void;
  voiceTone?: VoiceTone;
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

export function VoiceScreen({ onClose, voiceTone = "warm" }: VoiceScreenProps) {
  const [state, setState] = useState<"connecting" | "idle" | "listening" | "thinking" | "speaking" | "error">("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxSeconds, setMaxSeconds] = useState(180);
  const [quotaText, setQuotaText] = useState("");
  const clientRef = useRef<RealtimeClient | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const maxSecondsRef = useRef(180);
  const usageReportedRef = useRef(false);
  const activeModelRef = useRef("gpt-realtime");
  const activeSessionIdRef = useRef("");
  const convSessionIdRef = useRef<string>("");           // 每次連線一個 UUID（conversations.session_id）
  const lastSavedAssistantRef = useRef<string>("");       // 避免重複存同一句 AI 回應

  // 寫入一則對話到 DB（fire-and-forget，失敗不影響 UX）
  const logMessage = (role: "user" | "assistant", content: string) => {
    const text = content?.trim();
    if (!text || !convSessionIdRef.current) return;
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

  const reportUsage = async (reason: "manual" | "time_limit" | "close" | "unload" | "error") => {
    if (usageReportedRef.current || !startedAtRef.current) return;
    const seconds = Math.min(
      maxSecondsRef.current,
      Math.max(1, Math.ceil((Date.now() - startedAtRef.current) / 1000))
    );
    usageReportedRef.current = true;
    try {
      await api.trackRealtimeUsage({
        seconds,
        model: activeModelRef.current,
        session_id: activeSessionIdRef.current || undefined,
        reason,
      });
    } catch (e) {
      console.error("[voice] usage tracking failed:", e);
    }
  };

  const stopSession = async (reason: "manual" | "time_limit" | "close" | "unload" | "error" = "manual") => {
    const client = clientRef.current;
    clientRef.current = null;
    client?.close();
    await reportUsage(reason);
    startedAtRef.current = null;
    setElapsedSeconds(0);
    setState("idle");
  };

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        void stopSession("unload");
      }
    };
  }, []);

  useEffect(() => {
    if (!clientRef.current || !startedAtRef.current) return;
    const timer = window.setInterval(() => {
      if (!startedAtRef.current) return;
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= maxSecondsRef.current) {
        setErrorMsg("這次語音已達 3 分鐘上限，暖暖先幫您暫停一下");
        void stopSession("time_limit");
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  const handleMicPress = async () => {
    // 連線中不能按
    if (state === "connecting") return;

    // 已連線中（聽中 / 想中 / 說話中）→ 按下去就斷線
    if (clientRef.current) {
      await stopSession("manual");
      return;
    }

    setState("connecting");

    try {
      const { session, quota, max_seconds } = await api.createRealtimeSession();
      const ephemeralKey = session.client_secret.value;
      const sessionMax = Math.max(1, Math.min(180, max_seconds));
      maxSecondsRef.current = sessionMax;
      setMaxSeconds(sessionMax);
      setQuotaText(`本月已用 ${quota.used}/${quota.limit} 分鐘`);
      activeModelRef.current = session.model ?? "gpt-realtime";
      activeSessionIdRef.current = session.id ?? "";
      usageReportedRef.current = false;
      // 為這次對話產一個 UUID 當 session_id（OpenAI 的 session.id 不是 UUID 格式）
      // 後端用 z.string().uuid() 驗證，fallback 也必須是合法 UUID v4
      convSessionIdRef.current = generateUuid();
      lastSavedAssistantRef.current = "";

      const client = new RealtimeClient({
        onConnected: () => {
          startedAtRef.current = Date.now();
          setElapsedSeconds(0);
          setState("listening");
        },
        onUserTranscript: (text) => {
          setTranscript((t) => [...t, { role: "user", text }]);
          setState("thinking");
          logMessage("user", text);
        },
        onAssistantStartSpeaking: () => setState("speaking"),
        onAssistantTranscript: (text, isFinal) => {
          setTranscript((t) => {
            const lastIsAi = t[t.length - 1]?.role === "ai";
            if (lastIsAi) {
              return [...t.slice(0, -1), { role: "ai", text }];
            }
            return [...t, { role: "ai", text }];
          });
          // 只在 isFinal 才存（中間 delta 不存，避免一堆短片段）
          if (isFinal && text && text !== lastSavedAssistantRef.current) {
            lastSavedAssistantRef.current = text;
            logMessage("assistant", text);
          }
        },
        onAssistantStopSpeaking: () => setState("listening"),
        onListening: (listening) => setState(listening ? "listening" : "thinking"),
        onError: (err) => {
          setErrorMsg(err.message);
          setState("error");
          void reportUsage("error");
        },
        onClose: () => {
          if (clientRef.current) setState("idle");
        },
      });

      clientRef.current = client;
      await client.connect(ephemeralKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "連線失敗";
      const status = (err as { status?: number })?.status;
      setErrorMsg(status === 429 ? "本月語音分鐘已用完" : status === 401 ? "請先登入" : msg);
      setState("error");
    }
  };

  const mascotMood = state === "thinking" ? "thinking" as const : state === "speaking" ? "excited" as const : "happy" as const;
  const isActive = state === "listening" || state === "speaking" || state === "thinking" || state === "connecting";
  const remainingSeconds = Math.max(0, maxSeconds - elapsedSeconds);
  const timerLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;

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
        <button onClick={() => { void stopSession("close").finally(onClose); }} style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "var(--surface)", border: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="chevronD" size={24} color="var(--ink-1)" />
        </button>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ink-2)" }}>
          {state === "connecting" ? "連線中…" : isActive ? "對話中" : "跟暖暖聊天"}
        </div>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 24px 8px" }}>
        <Mascot
          size={160}
          mood={mascotMood}
          listening={state === "listening"}
          talking={state === "speaking"}
        />
        <div style={{
          marginTop: 16, fontSize: "var(--fs-base)", fontWeight: 700,
          color: "var(--ink-1)", textAlign: "center",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {state === "idle" && (transcript.length === 0 ? toneIntros[voiceTone] : "點麥克風繼續")}
          {state === "connecting" && <>連線中…</>}
          {state === "listening" && <><WaveformDots /> 我在聽…</>}
          {state === "thinking" && <>暖暖想一下…</>}
          {state === "speaking" && <><WaveformDots /> 暖暖正在說</>}
          {state === "error" && <>{errorMsg}</>}
        </div>
        {(isActive || quotaText) && (
          <div style={{ marginTop: 8, fontSize: "var(--fs-sm)", color: "var(--ink-2)", textAlign: "center" }}>
            {isActive ? `本次剩 ${timerLabel}` : quotaText}
            {quotaText && isActive ? `　·　${quotaText}` : ""}
          </div>
        )}
      </div>

      <div className="scroll-area" style={{
        flex: 1, overflowY: "auto", padding: "8px 20px",
        display: "flex", flexDirection: "column", gap: 12,
        justifyContent: "flex-end",
      }}>
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
          disabled={state === "connecting"}
          style={{
            width: 100, height: 100, borderRadius: "50%",
            background: isActive
              ? "linear-gradient(135deg, #C95E36, #8B3D1F)"
              : "linear-gradient(135deg, #F4B58E, #E8845A)",
            boxShadow: isActive
              ? "0 4px 0 var(--primary-deep)"
              : "0 8px 0 var(--primary-deep), 0 14px 24px rgba(201, 94, 54, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", transition: "all 0.2s",
          }}>
          {state === "idle" && (
            <>
              <div style={{
                position: "absolute", inset: -6, borderRadius: "50%",
                border: "2px solid rgba(232, 132, 90, 0.3)",
                animation: "pulse-ring 2s ease-out infinite",
              }} />
              <Icon name="mic" size={48} color="#fff" stroke={2.5} />
            </>
          )}
          {state === "connecting" && (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              animation: "spin 0.8s linear infinite",
            }} />
          )}
          {isActive && state !== "connecting" && <Icon name="x" size={48} color="#fff" stroke={2.5} />}
          {state === "error" && <Icon name="mic" size={48} color="#fff" stroke={2.5} />}
        </button>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
          {state === "idle" && "按一下開始說話"}
          {state === "connecting" && "正在連線…"}
          {state === "listening" && "按一下停止"}
          {state === "thinking" && "稍等一下"}
          {state === "speaking" && "暖暖回應中"}
          {state === "error" && "按一下再試"}
        </div>
      </div>
    </div>
  );
}
