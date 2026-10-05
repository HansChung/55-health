"use client";

// ────────────────────────────────────────────────
// 家人看板：長輩做的出遊影片，家人可以按讚、留言（長輩會收到通知）
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api, type FamilyElderVideos } from "@/lib/api-client";
import { VideoComments } from "@/components/video-comments";
import { markVideoViewed } from "@/lib/mark-video-viewed";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}

/** 一開始每位長輩先顯示幾支 */
const FIRST_SHOWN = 3;

export function FamilyVideos() {
  const [elders, setElders] = useState<FamilyElderVideos[] | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.familyVideos()
      .then((res) => setElders(res.elders))
      .catch((e) => {
        console.warn("[family-videos] load failed:", e);
        setElders([]);
      });
  }, []);

  if (!elders || elders.length === 0) return null;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }} aria-label="出遊影片">
      <div>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>🎬 出遊影片</div>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>你播放過的影片，長輩那邊會顯示「看過了」</div>
      </div>
      {elders.map((e) => {
        const shown = expanded[e.elder_id] ? e.videos : e.videos.slice(0, FIRST_SHOWN);
        return (
          <div key={e.elder_id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {elders.length > 1 && <div style={{ fontWeight: 800, color: "var(--ink-2)" }}>{e.name}</div>}
            {shown.map((v) => (
              <div key={v.id} className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {v.video_url && (
                  <video
                    src={v.video_url}
                    poster={v.photo_url ?? undefined}
                    controls
                    playsInline
                    preload="none"
                    onPlay={() => markVideoViewed(v.id)}
                    style={{ width: "100%", maxHeight: 420, borderRadius: "var(--r-md)", background: "#000", display: "block" }}
                  />
                )}
                <div style={{ display: "flex", gap: 8, fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                  <span aria-hidden="true">{v.kind === "mv" ? "🎵" : v.kind === "montage" ? "📚" : "🎬"}</span>
                  <span style={{ fontWeight: 700, color: "var(--ink-1)" }}>
                    {e.name}{v.kind === "mv" && v.mv?.title ? `・MV「${v.mv.title}」` : ""}{v.place ? `・${v.place}` : ""}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: "var(--fs-xs)" }}>{formatWhen(v.created_at)}</span>
                </div>
                {v.kind === "mv" && v.mv?.lyrics && (
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>📜 看歌詞</summary>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, marginTop: 6 }}>{v.mv.lyrics}</div>
                  </details>
                )}
                {v.kind !== "mv" && v.narration_text && (
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                    <span aria-hidden="true">🗣️ </span>「{v.narration_text}」
                  </div>
                )}
                <VideoComments videoId={v.id} initial={v.comments} viewer="family" />
              </div>
            ))}
            {e.videos.length > FIRST_SHOWN && !expanded[e.elder_id] && (
              <button
                onClick={() => setExpanded((x) => ({ ...x, [e.elder_id]: true }))}
                className="btn-ghost"
              >
                看更多（共 {e.videos.length} 支）
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}
