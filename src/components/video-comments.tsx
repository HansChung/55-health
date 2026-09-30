"use client";

// ────────────────────────────────────────────────
// 出遊影片底下的按讚＋留言（長輩自己的影片清單、家人看板共用）
// ────────────────────────────────────────────────

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import {
  EMPTY_COMMENTS,
  QUICK_REPLIES_FOR_ELDER,
  QUICK_REPLIES_FOR_FAMILY,
  VIDEO_COMMENT_MAX,
  VIDEO_REACTIONS,
  authorLabel,
  sanitizeComment,
  type VideoCommentsView,
  type VideoReaction,
} from "@/lib/video-comments";

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

  const fail = (e: unknown) =>
    toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "網路不穩，請再試一次");

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
                  <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.5, wordBreak: "break-word" }}>{c.body}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {quick.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={busy}
                style={{
                  padding: "8px 12px", minHeight: 40, borderRadius: 999, border: "1px solid var(--line)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)", color: "var(--ink-1)", cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>
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
