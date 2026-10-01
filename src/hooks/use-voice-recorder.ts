"use client";

// ────────────────────────────────────────────────
// 錄一段話（瀏覽器 MediaRecorder）：開始 → 停止（或到上限自動停）→ 拿到錄音
// Chrome／Android 錄 webm、Safari／iOS 錄 mp4，伺服器再統一轉檔
// ────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceRecording {
  blob: Blob;
  url: string;
  seconds: number;
}

export type RecorderError = "unsupported" | "permission";

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder(maxSeconds: number) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<VoiceRecording | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  const release = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  /** 開始錄音；失敗回錯誤原因（不支援／沒有麥克風權限） */
  const start = useCallback(async (): Promise<RecorderError | null> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return "unsupported";
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      return "permission";
    }
    const mimeType = pickMimeType();
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const took = (Date.now() - startedAt.current) / 1000;
      release();
      setRecording(false);
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      setResult({ blob, url: URL.createObjectURL(blob), seconds: took });
    };
    recorderRef.current = recorder;
    startedAt.current = Date.now();
    setSeconds(0);
    setResult(null);
    recorder.start(1000);
    setRecording(true);
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(s);
      if (s >= maxSeconds) stop();
    }, 250);
    return null;
  }, [maxSeconds, stop]);

  /** 不要這段錄音（或送出後清掉） */
  const clear = useCallback(() => setResult(null), []);

  // 換掉錄音就釋放舊的；離開畫面就停止錄音、關麥克風
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    release();
  }, []);

  return { recording, seconds, result, start, stop, clear };
}
