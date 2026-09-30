"use client";

// ────────────────────────────────────────────────
// 我的聲音（專業版）：念一段固定的話錄起來 → 複製成自己的配音聲音
// 只能現場錄自己的聲音（不能上傳檔案），要勾選本人同意；可以重錄、刪除
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import {
  VOICE_CONSENT_TEXT,
  VOICE_SAMPLE_MAX_SECONDS,
  VOICE_SAMPLE_MIN_SECONDS,
  VOICE_SAMPLE_SCRIPT,
  type MyVoiceStatus,
} from "@/lib/travel-video";

type Phase = "idle" | "recording" | "review" | "uploading";

/** 瀏覽器能錄的格式（Chrome／Android：webm；Safari／iOS：mp4） */
function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}

export function MyVoiceSheet({
  status,
  onClose,
  onChanged,
}: {
  status: MyVoiceStatus | null;
  onClose: () => void;
  /** 錄好／刪除後回傳最新狀態；ready＝剛錄好，可以直接選「我的聲音」 */
  onChanged: (status: MyVoiceStatus, ready: boolean) => void;
}) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const [consent, setConsent] = useState(false);
  const [rerecord, setRerecord] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // 關掉畫面就停止錄音、釋放麥克風
  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    stopStream();
  }, []);
  useEffect(() => () => { if (recording) URL.revokeObjectURL(recording.url); }, [recording]);

  const voice = status?.voice ?? null;
  const showRecorder = Boolean(status?.allowed) && (!voice || voice.expired || rerecord);
  const canRecordAgain = (status?.remaining ?? 0) > 0;

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const startRecording = async () => {
    const mimeType = pickMimeType();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("這台手機的瀏覽器不能錄音，請更新 App 或換一支手機");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      toast.error("沒有麥克風權限，請到手機設定打開麥克風再試");
      return;
    }
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const took = (Date.now() - startedAt.current) / 1000;
      stopStream();
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      setRecording({ blob, url: URL.createObjectURL(blob), seconds: took });
      setPhase("review");
    };
    recorderRef.current = recorder;
    startedAt.current = Date.now();
    setSeconds(0);
    setRecording(null);
    recorder.start(1000);
    setPhase("recording");
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(s);
      if (s >= VOICE_SAMPLE_MAX_SECONDS) stopRecording();
    }, 250);
  };

  const upload = async () => {
    if (!recording || !consent || phase === "uploading") return;
    setPhase("uploading");
    try {
      const audio = await blobToDataUrl(recording.blob);
      const res = await api.createMyVoice({ audio, consent: true });
      trackEvent("my_voice_created", { seconds: Math.round(recording.seconds) });
      toast.success("好了！之後選「我的聲音」，口白就用你的聲音念");
      setRecording(null);
      setRerecord(false);
      onChanged(res.status, true);
    } catch (e) {
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "網路不穩，沒有送出去，請再試一次");
      setPhase("review");
    }
  };

  const remove = async () => {
    if (deleting || !window.confirm("確定要刪除你的聲音嗎？刪除後影片就不會再用你的聲音念。")) return;
    setDeleting(true);
    try {
      const res = await api.deleteMyVoice();
      trackEvent("my_voice_deleted");
      toast.success("已經刪除你的聲音");
      onChanged(res.status, false);
    } catch (e) {
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "網路不穩，請再試一次");
    } finally {
      setDeleting(false);
    }
  };

  const close = () => {
    stopRecording();
    onClose();
  };

  const tooShort = Boolean(recording && recording.seconds < VOICE_SAMPLE_MIN_SECONDS);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="我的聲音"
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: "rgba(20, 14, 10, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 400, maxHeight: "100%", overflowY: "auto",
          background: "var(--surface, #fff)", borderRadius: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)", color: "var(--ink-1)",
        }}
      >
      {/* 內層才排版：外層捲動；直接在捲動容器裡用 flex，內容太高時播放器會被壓成 0 高 */}
      <div style={{ padding: "24px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>🎙️ 我的聲音</div>
          <button onClick={close} aria-label="關閉" className="btn-ghost" style={{ padding: "8px 14px", fontSize: "var(--fs-sm)" }}>
            關閉
          </button>
        </div>

        {!status && <div role="status">讀取中…</div>}

        {status && !status.allowed && (
          <>
            <div style={{ lineHeight: 1.7 }}>
              錄一段你自己的聲音，之後出遊影片的口白就用<b>你自己的聲音</b>念給家人聽。
            </div>
            <div style={{ lineHeight: 1.7, color: "var(--ink-2)" }}>這是<b>專業版</b>功能，升級後就可以使用。</div>
            <a href="/pricing" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>看看專業版</a>
          </>
        )}

        {status?.allowed && voice && !voice.expired && !rerecord && (
          <>
            <div style={{ lineHeight: 1.7 }}>
              ✅ 已經錄好你的聲音（{formatDate(voice.created_at)}）。做影片時選「🎙️ 我的聲音」，口白就用你的聲音念。
            </div>
            {voice.demo_url && (
              <div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 6 }}>聽聽看複製出來的聲音：</div>
                <audio controls src={voice.demo_url} style={{ width: "100%" }} />
              </div>
            )}
            {!voice.activated && voice.expires_at && (
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
                {formatDate(voice.expires_at)} 前要用來做一次口白，不然就要重錄。第一次配音會比較久一點。
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setRerecord(true)}
                disabled={!canRecordAgain}
                className="btn-ghost"
                style={{ opacity: canRecordAgain ? 1 : 0.5 }}
              >
                重新錄
              </button>
              <button onClick={remove} disabled={deleting} className="btn-ghost" style={{ color: "var(--danger, #c0392b)" }}>
                {deleting ? "刪除中…" : "刪除"}
              </button>
            </div>
            {!canRecordAgain && (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>這個月重錄的次數用完了，下個月可以再錄</div>
            )}
          </>
        )}

        {showRecorder && (
          <>
            {voice?.expired && !rerecord && (
              <div role="alert" style={{ color: "var(--ink-2)", lineHeight: 1.6 }}>
                上次錄的聲音超過 7 天沒用，已經失效了，請重新錄一次。
              </div>
            )}
            {!canRecordAgain ? (
              <div style={{ lineHeight: 1.7, color: "var(--ink-2)" }}>這個月錄音的次數用完了，下個月再來錄喔。</div>
            ) : (
              <>
                <div style={{ lineHeight: 1.7 }}>
                  在安靜的地方，手機拿近一點，按「開始錄音」後<b>慢慢念下面這段話</b>（大約 20～30 秒）：
                </div>
                <div
                  style={{
                    background: "var(--primary-soft)", borderRadius: 16, padding: "14px 16px",
                    fontSize: "var(--fs-lg)", lineHeight: 1.8, fontWeight: 600,
                  }}
                >
                  {VOICE_SAMPLE_SCRIPT}
                </div>

                {phase === "recording" ? (
                  <button onClick={stopRecording} className="btn-primary" style={{ background: "var(--danger, #c0392b)" }}>
                    ⏹ 念完了，停止
                  </button>
                ) : (
                  <button onClick={startRecording} disabled={phase === "uploading"} className={recording ? "btn-ghost" : "btn-primary"}>
                    {recording ? "🔄 重錄一次" : "🔴 開始錄音"}
                  </button>
                )}
                {phase === "recording" && (
                  <div role="status" style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", textAlign: "center" }}>
                    🔴 錄音中 {seconds} 秒…念完整段再按停止（最多 {VOICE_SAMPLE_MAX_SECONDS} 秒）
                  </div>
                )}

                {recording && phase !== "recording" && (
                  <>
                    <audio controls src={recording.url} style={{ width: "100%" }} />
                    {tooShort ? (
                      <div role="alert" style={{ color: "var(--danger, #c0392b)", fontSize: "var(--fs-sm)" }}>
                        錄太短了（{Math.round(recording.seconds)} 秒），請念完整段，至少 {VOICE_SAMPLE_MIN_SECONDS} 秒
                      </div>
                    ) : (
                      <>
                        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.6, fontSize: "var(--fs-sm)" }}>
                          <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            style={{ width: 24, height: 24, flexShrink: 0, marginTop: 2 }}
                          />
                          <span>{VOICE_CONSENT_TEXT}</span>
                        </label>
                        <button
                          onClick={upload}
                          disabled={!consent || phase === "uploading"}
                          className="btn-primary"
                          style={{ opacity: !consent || phase === "uploading" ? 0.5 : 1 }}
                        >
                          {phase === "uploading" ? "複製聲音中…（約 30 秒）" : "✅ 用這段錄音"}
                        </button>
                      </>
                    )}
                  </>
                )}
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", lineHeight: 1.6 }}>
                  只能錄你本人的聲音，只會用來念你自己的影片。原始錄音不會留在暖暖；刪除後就不會再用你的聲音。
                </div>
                {rerecord && (
                  <button onClick={() => { setRerecord(false); setRecording(null); setPhase("idle"); }} className="btn-ghost">
                    不重錄了
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
      </div>
    </div>,
    document.body
  );
}
