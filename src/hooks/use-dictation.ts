"use client";

// ────────────────────────────────────────────────
// 說話變文字，兩種做法（同一頁同時只會有一個在聽）：
// ・native：瀏覽器內建語音辨識（SpeechRecognition／webkitSpeechRecognition，台灣中文），免費，說完一句自動停
// ・record：沒有內建辨識的地方（App 的 Android WebView、Firefox）→ 錄一句話（開口後安靜一下就自動停）
//   → 傳到伺服器 /api/ai/transcribe，平台的 Gemini 聽寫成文字（每句約 0.001 算力，每天有上限）
// ────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { audioPayload } from "@/lib/direct-upload";
import { DICTATION_END_SILENCE_MS, DICTATION_MAX_SECONDS, DICTATION_NO_SPEECH_MS, isSpeaking } from "@/lib/dictation";

interface RecognitionResultList {
  length: number;
  [index: number]: { isFinal: boolean; 0: { transcript: string } };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: RecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function canRecord(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";
}

function pickMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
}

export type DictationMode = "native" | "record";

/** 正在聽的那一個（整頁只讓一個欄位在聽：按了另一個麥克風，前一個就停） */
let active: { abort(): void } | null = null;

export function useDictation(where = "") {
  // 伺服器端算不出來：掛載後才決定要不要顯示按鈕（避免 hydration 不一致）
  const [mode, setMode] = useState<DictationMode | null>(null);
  const [listening, setListening] = useState(false);
  /** record 模式：錄好了，正在等伺服器聽寫 */
  const [transcribing, setTranscribing] = useState(false);
  const [interim, setInterim] = useState("");
  const stopRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMode(recognitionCtor() ? "native" : canRecord() ? "record" : null);
    return () => abortRef.current?.();
  }, []);

  const stop = useCallback(() => stopRef.current?.(), []);

  /** 瀏覽器內建辨識 */
  const listenNative = useCallback((onText: (text: string) => void, onError: (code: string) => void) => {
    const Ctor = recognitionCtor();
    if (!Ctor) return onError("unsupported");
    active?.abort();
    const rec = new Ctor();
    rec.lang = "zh-TW";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = "";
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else partial += r[0].transcript;
      }
      setInterim(partial);
      if (finalText) onText(finalText);
    };
    rec.onerror = (e) => onError(e.error);
    const handle = { abort: () => { rec.onend = null; rec.abort(); setListening(false); setInterim(""); } };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      if (active === handle) active = null;
    };
    stopRef.current = () => rec.stop();
    abortRef.current = () => handle.abort();
    active = handle;
    try {
      rec.start();
      setListening(true);
    } catch {
      onError("start-failed");
    }
  }, []);

  /** 錄一句話 → 伺服器聽寫 */
  const listenRecord = useCallback(async (onText: (text: string) => void, onError: (code: string) => void) => {
    active?.abort();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      const name = (e as { name?: string })?.name;
      return onError(name === "NotAllowedError" || name === "SecurityError" ? "not-allowed" : "audio-capture");
    }
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    let aborted = false;
    let heardVoice = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let ctx: AudioContext | null = null;
    const startedAt = Date.now();
    let lastVoiceAt = 0;

    const cleanup = () => {
      if (timer) clearInterval(timer);
      timer = null;
      stream.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => undefined);
      ctx = null;
    };
    const handle = {
      abort: () => {
        aborted = true;
        if (recorder.state === "recording") recorder.stop();
        cleanup();
        setListening(false);
        setTranscribing(false);
      },
    };

    // 開口後安靜一下就自動停；一直沒開口也停；最長 30 秒
    try {
      ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      timer = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += v * v;
        const now = Date.now();
        if (isSpeaking(Math.sqrt(sum / buf.length))) {
          heardVoice = true;
          lastVoiceAt = now;
        }
        const elapsed = now - startedAt;
        if (
          elapsed > DICTATION_MAX_SECONDS * 1000 ||
          (heardVoice && now - lastVoiceAt > DICTATION_END_SILENCE_MS) ||
          (!heardVoice && elapsed > DICTATION_NO_SPEECH_MS)
        ) {
          if (recorder.state === "recording") recorder.stop();
        }
      }, 120);
    } catch {
      // 量不到音量（很少見）：就等長輩自己按停止，或到 30 秒
      heardVoice = true;
      timer = setInterval(() => {
        if (Date.now() - startedAt > DICTATION_MAX_SECONDS * 1000 && recorder.state === "recording") recorder.stop();
      }, 500);
    }

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = async () => {
      cleanup();
      setListening(false);
      if (active === handle) active = null;
      if (aborted) return;
      if (!heardVoice) return onError("no-speech");
      setTranscribing(true);
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
        const res = await api.transcribe({ ...(await audioPayload(blob)), where });
        if (!aborted && res.text) onText(res.text);
      } catch (e) {
        if (aborted) return;
        const code = e instanceof ApiError ? ((e.data as { code?: string } | null)?.code ?? (e.status === 503 ? "disabled" : e.isNetwork ? "network" : "")) : "";
        onError(code || "failed");
      } finally {
        if (!aborted) setTranscribing(false);
      }
    };
    stopRef.current = () => { if (recorder.state === "recording") recorder.stop(); };
    abortRef.current = () => handle.abort();
    active = handle;
    recorder.start(250);
    setListening(true);
  }, [where]);

  /** 開始聽；聽到完整一句呼叫 onText；出錯呼叫 onError（錯誤代碼） */
  const listen = useCallback(
    (onText: (text: string) => void, onError: (code: string) => void) => {
      if (mode === "native") return listenNative(onText, onError);
      if (mode === "record") return void listenRecord(onText, onError);
      onError("unsupported");
    },
    [mode, listenNative, listenRecord]
  );

  return { supported: mode !== null, mode, listening, transcribing, interim, listen, stop };
}
