"use client";

// ────────────────────────────────────────────────
// 出遊影片底下的按讚＋留言（長輩自己的影片清單、家人看板、分享頁共用）
// 文字留言可以「念給我聽」（手機內建語音）；也可以錄一段話當語音留言
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { blobToDataUrl, useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { trackEvent } from "@/lib/telemetry";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import {
  EMPTY_COMMENTS,
  QUICK_REPLIES_FOR_ELDER,
  QUICK_REPLIES_FOR_FAMILY,
  VIDEO_COMMENT_MAX,
  VIDEO_REACTIONS,
  VOICE_COMMENT_MAX_SECONDS,
  VOICE_COMMENT_MIN_SECONDS,
  authorLabel,
  commentsSpeechText,
  formatVoiceSeconds,
  sanitizeComment,
  type VideoComment,
  type VideoCommentsView,
  type VideoReaction,
} from "@/lib/video-comments";

const smallButton: React.CSSProperties = {
  padding: "8px 12px", minHeight: 40, borderRadius: 999, border: "1px solid var(--line)",
  background: "var(--surface)", fontSize: "var(--fs-sm)", color: "var(--ink-1)", cursor: "pointer",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function VideoComments({
  videoId,
  initial,
  viewer,
}: {
  videoId: string;
  initial?: VideoCommentsView;
  /** owner＝長輩看自己的影片；family＝家人看長輩的影片 */
  viewer: "owner" | "family";
}) {
  const toast = useToast();
  const [view, setView] = useState<VideoCommentsView>(initial ?? EMPTY_COMMENTS);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(viewer === "family");
  // 正在念的留言（"all"＝全部）；正在播的語音留言
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorder = useVoiceRecorder(VOICE_COMMENT_MAX_SECONDS);

  const fail = (e: unknown) =>
    toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "網路不穩，請再試一次");

  // 離開畫面：停止朗讀、停止播放
  useEffect(() => () => {
    stopGuideSpeech();
    audioRef.current?.pause();
  }, []);

  const stopAll = () => {
    stopGuideSpeech();
    setSpeaking(null);
    audioRef.current?.pause();
    setPlaying(null);
  };

  /** 念給我聽：一則或全部文字留言 */
  const speak = (key: string, comments: VideoComment[]) => {
    if (speaking === key) return stopAll();
    stopAll();
    const ok = speakGuideParagraphs(commentsSpeechText(comments), {
      rate: 0.9,
      onEnd: () => setSpeaking(null),
      onError: () => setSpeaking(null),
    });
    if (ok) {
      setSpeaking(key);
      trackEvent("video_comment_speak", { viewer, all: key === "all" });
    } else {
      toast.error("這支手機不能念出來，請放大字體看看");
    }
  };

  /** 播放語音留言（同時只播一則） */
  const play = (c: VideoComment) => {
    if (!c.audio_url) return;
    if (playing === c.id) return stopAll();
    stopAll();
    const audio = (audioRef.current ??= new Audio());
    audio.src = c.audio_url;
    audio.onended = () => setPlaying(null);
    audio.onerror = () => { setPlaying(null); toast.error("語音播不出來，請稍後再試"); };
    audio.play().then(() => setPlaying(c.id)).catch(() => setPlaying(null));
  };

  const startRecording = async () => {
    stopAll();
    const err = await recorder.start();
    if (err === "unsupported") toast.error("這支手機的瀏覽器不能錄音，可以改用打字");
    else if (err === "permission") toast.error("沒有麥克風權限，請到手機設定打開麥克風");
  };

  const sendVoice = async () => {
    const rec = recorder.result;
    if (!rec || busy) return;
    if (rec.seconds < VOICE_COMMENT_MIN_SECONDS) {
      toast.error("錄音太短了，說完一句話再停止");
      return;
    }
    setBusy(true);
    try {
      const res = await api.voiceCommentOnVideo(videoId, await blobToDataUrl(rec.blob));
      setView(res.comments);
      recorder.clear();
      trackEvent("video_voice_comment", { viewer, seconds: Math.round(rec.seconds) });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const react = async (emoji: VideoReaction) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.reactToVideo(videoId, emoji);
      setView(res.comments);
      trackEvent("video_reaction", { viewer, emoji });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const send = async (raw: string) => {
    const body = sanitizeComment(raw);
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await api.commentOnVideo(videoId, body);
      setView(res.comments);
      setText("");
      trackEvent("video_comment", { viewer });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (commentId: string) => {
    if (busy || !window.confirm("要刪掉這則留言嗎？")) return;
    setBusy(true);
    try {
      const res = await api.deleteVideoComment(videoId, commentId);
      setView(res.comments);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const counts = new Map(view.reactions.map((r) => [r.emoji, r]));
  const quick = viewer === "owner" ? QUICK_REPLIES_FOR_ELDER : QUICK_REPLIES_FOR_FAMILY;
  const reactedNames = view.reactions.flatMap((r) => r.names.map((n) => `${n} ${r.emoji}`));
  const textComments = view.comments.filter((c) => c.body);
  const canSpeak = canSpeakGuide();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* 按讚 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group" aria-label="按讚">
        {VIDEO_REACTIONS.map((emoji) => {
          const r = counts.get(emoji);
          return (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              disabled={busy}
              aria-pressed={Boolean(r?.mine)}
              aria-label={`${emoji}${r ? ` ${r.count} 個` : ""}`}
              style={{
                minWidth: 52, minHeight: 44, padding: "6px 10px", borderRadius: 999,
                background: r?.mine ? "var(--primary-soft)" : "var(--surface)",
                border: `2px solid ${r?.mine ? "var(--primary)" : "var(--line)"}`,
                fontSize: 20, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              <span aria-hidden="true">{emoji}</span>
              {r && <span style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-1)" }}>{r.count}</span>}
            </button>
          );
        })}
      </div>
      {reactedNames.length > 0 && (
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.5 }}>{reactedNames.join("、")}</div>
      )}

      {/* 留言 */}
      {viewer === "owner" && !open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn-ghost"
          style={{ fontSize: "var(--fs-sm)", padding: "10px 12px" }}
        >
          💬 {view.comments.length > 0 ? `看家人的留言（${view.comments.length}）` : "留言"}
        </button>
      ) : (
        <>
          {canSpeak && textComments.length > 0 && (
            <button onClick={() => speak("all", textComments)} className="btn-ghost" style={{ fontSize: "var(--fs-sm)", padding: "10px 12px" }}>
              {speaking === "all" ? "⏹ 停止" : "🔊 全部念給我聽"}
            </button>
          )}
          {view.comments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {view.comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    alignSelf: c.author.is_me ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    background: c.author.is_me ? "var(--primary-soft)" : "var(--surface-warm, #F7F1E6)",
                    borderRadius: 14, padding: "8px 12px",
                  }}
                >
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", display: "flex", flexWrap: "wrap", columnGap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "var(--ink-2)", whiteSpace: "nowrap" }}>{authorLabel(c.author)}</span>
                    <span style={{ whiteSpace: "nowrap" }}>{formatWhen(c.created_at)}</span>
                    {c.can_delete && (
                      <button
                        onClick={() => remove(c.id)}
                        aria-label="刪除這則留言"
                        style={{ background: "none", border: "none", padding: 0, color: "var(--ink-3)", cursor: "pointer", fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }}
                      >
                        刪除
                      </button>
                    )}
                  </div>
                  {c.audio_url ? (
                    <button
                      onClick={() => play(c)}
                      aria-label={`${playing === c.id ? "停止" : "播放"}語音留言 ${formatVoiceSeconds(c.audio_seconds)}`}
                      style={{
                        marginTop: 4, padding: "10px 16px", minHeight: 48, borderRadius: 999,
                        border: "2px solid var(--primary)", background: "var(--surface)", color: "var(--ink-1)",
                        fontSize: "var(--fs-base)", fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      {playing === c.id ? "⏹ 停止" : "▶ 聽語音"}　{formatVoiceSeconds(c.audio_seconds)}
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.5, wordBreak: "break-word", flex: 1 }}>{c.body}</div>
                      {canSpeak && (
                        <button
                          onClick={() => speak(c.id, [c])}
                          aria-label={speaking === c.id ? "停止朗讀" : "念給我聽"}
                          style={{ background: "none", border: "none", padding: "0 2px", fontSize: 20, cursor: "pointer", lineHeight: 1.3 }}
                        >
                          {speaking === c.id ? "⏹" : "🔊"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {quick.map((q) => (
              <button key={q} onClick={() => send(q)} disabled={busy} style={smallButton}>
                {q}
              </button>
            ))}
          </div>

          {/* 語音留言：錄音中 → 聽聽看 → 送出 */}
          {recorder.recording ? (
            <button
              onClick={recorder.stop}
              className="btn-primary"
              style={{ background: "var(--danger, #c0392b)" }}
              aria-live="polite"
            >
              ⏹ 說完了，停止（{recorder.seconds} 秒）
            </button>
          ) : recorder.result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10, borderRadius: 14, background: "var(--surface-warm, #F7F1E6)" }}>
              <audio controls src={recorder.result.url} style={{ width: "100%" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={recorder.clear} disabled={busy} className="btn-ghost">不要了</button>
                <button onClick={sendVoice} disabled={busy} className="btn-primary" style={{ opacity: busy ? 0.5 : 1 }}>
                  {busy ? "送出中…" : "送出語音"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={startRecording} disabled={busy || recorder.starting} className="btn-ghost" style={{ fontSize: "var(--fs-base)" }}>
              🎤 錄一段話{viewer === "owner" ? "回覆" : "給他"}
            </button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, VIDEO_COMMENT_MAX))}
              placeholder={viewer === "owner" ? "回覆家人…" : "寫一句話給他…"}
              aria-label="留言"
              style={{
                flex: 1, minWidth: 0, padding: "12px 14px", fontSize: "var(--fs-base)",
                borderRadius: "var(--r-md)", border: "2px solid var(--line)", background: "var(--surface)", color: "var(--ink-1)",
              }}
            />
            <button
              type="submit"
              disabled={busy || !sanitizeComment(text)}
              className="btn-primary"
              style={{ padding: "0 18px", opacity: busy || !sanitizeComment(text) ? 0.5 : 1 }}
            >
              送出
            </button>
          </form>
        </>
      )}
    </div>
  );
}
