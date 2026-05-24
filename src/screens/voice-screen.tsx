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
  const clientRef = useRef<RealtimeClient | null>(null);

  const toneIntros: Record<VoiceTone, string> = {
    warm: "按一下開始跟我說話",
    strict: "按一下開始諮詢健康",
    grandchild: "按一下，跟小孫子說話！",
  };

  useEffect(() => {
    return () => clientRef.current?.close();
  }, []);

  const handleMicPress = async () => {
    // 連線中不能按
    if (state === "connecting") return;

    // 已連線中（聽中 / 想中 / 說話中）→ 按下去就斷線
    if (clientRef.current) {
      clientRef.current.close();
      clientRef.current = null;
      setState("idle");
      return;
    }

    setState("connecting");

    try {
      const { session } = await api.createRealtimeSession();
      const ephemeralKey = session.client_secret.value;

      const client = new RealtimeClient({
        onConnected: () => setState("listening"),
        onUserTranscript: (text) => {
          setTranscript((t) => [...t, { role: "user", text }]);
          setState("thinking");
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
        },
        onAssistantStopSpeaking: () => setState("listening"),
        onListening: (listening) => setState(listening ? "listening" : "thinking"),
        onError: (err) => {
          setErrorMsg(err.message);
          setState("error");
        },
        onClose: () => setState("idle"),
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
        <button onClick={() => { clientRef.current?.close(); onClose(); }} style={{
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
