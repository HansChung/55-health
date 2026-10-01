"use client";

// ────────────────────────────────────────────────
// 說話變文字：瀏覽器內建語音辨識（SpeechRecognition／webkitSpeechRecognition，台灣中文）
// 說完一句會自動停；同一頁同時只會有一個在聽
// ────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";

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

/** 整頁只讓一個欄位在聽：按了另一個麥克風，前一個就停 */
let active: Recognition | null = null;

export function useDictation() {
  // 伺服器端算不出來：掛載後才決定要不要顯示按鈕（避免 hydration 不一致）
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
    return () => {
      if (recRef.current) {
        recRef.current.onend = null;
        recRef.current.abort();
        if (active === recRef.current) active = null;
      }
    };
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);

  /** 開始聽；聽到完整一句呼叫 onText；出錯呼叫 onError（錯誤代碼） */
  const listen = useCallback((onText: (text: string) => void, onError: (code: string) => void) => {
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
    rec.onend = () => {
      setListening(false);
      setInterim("");
      if (active === rec) active = null;
    };
    recRef.current = rec;
    active = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      onError("start-failed");
    }
  }, []);

  return { supported, listening, interim, listen, stop };
}
