"use client";

// ────────────────────────────────────────────────
// 影片分享頁：打開就能播放；長輩本人或看得到影片的家人（已登入）可以直接按讚、留言
// ────────────────────────────────────────────────

import { VideoComments } from "@/components/video-comments";
import { videoShareMeta } from "@/lib/travel-video";
import type { SharedVideo } from "@/lib/video-share-server";

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric" });
}

export function VideoShareView({ shared }: { shared: SharedVideo | null }) {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg, #FAF5EC)", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--ink-2)", fontWeight: 800 }}>
          <span aria-hidden="true" style={{ fontSize: 22 }}>🧡</span> 暖暖 55+
        </a>

        {!shared ? (
          <div className="card" style={{ padding: 24, textAlign: "center", lineHeight: 1.7 }}>
            <div style={{ fontSize: 44 }} aria-hidden="true">🎬</div>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>這支影片已經刪除，或連結不對</div>
            <div style={{ color: "var(--ink-2)" }}>請長輩再分享一次給你</div>
          </div>
        ) : (
          <SharedVideoCard shared={shared} />
        )}
      </div>
    </main>
  );
}

function SharedVideoCard({ shared }: { shared: SharedVideo }) {
  const v = shared.video;
  const { title } = videoShareMeta(v);
  const lines = v.kind === "montage" ? (v.montage_lines ?? []) : v.narration_text ? [v.narration_text] : [];

  return (
    <>
      <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {v.video_url && (
          <video
            src={v.video_url}
            poster={v.photo_url ?? undefined}
            controls
            playsInline
            preload="metadata"
            style={{ width: "100%", maxHeight: "70dvh", borderRadius: "var(--r-md)", background: "#000", display: "block" }}
          />
        )}
        <div>
          <h1 style={{ fontSize: "var(--fs-xl, 24px)", fontWeight: 800, margin: 0, lineHeight: 1.4 }}>
            {v.kind === "montage" ? "📚 " : "🎬 "}{title}
          </h1>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)", marginTop: 4 }}>{formatDay(v.created_at)}</div>
        </div>
        {lines.length > 0 && (
          <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", lineHeight: 1.7 }}>
            {lines.map((l, i) => <div key={i}>🗣️ 「{l}」</div>)}
          </div>
        )}
        {v.download_url && (
          <a href={v.download_url} className="btn-ghost" style={{ textAlign: "center", textDecoration: "none" }}>
            ⬇️ 存到手機
          </a>
        )}
      </div>

      {shared.viewer ? (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>
            {shared.viewer === "owner" ? "💬 家人的按讚和留言" : "💬 給他按個讚、留句話"}
          </div>
          <VideoComments videoId={v.id} initial={shared.comments ?? undefined} viewer={shared.viewer} />
        </div>
      ) : (
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10, textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)" }}>想按讚、留言給他嗎？</div>
          <div style={{ color: "var(--ink-2)", lineHeight: 1.6 }}>打開暖暖，在「家人狀況」就看得到他的影片，按讚留言他都會收到通知</div>
          <a href="/?open=caregiver" className="btn-primary" style={{ textDecoration: "none" }}>打開暖暖</a>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", lineHeight: 1.6 }}>
            還沒有連結？請長輩在暖暖的「家人共享」邀請你
          </div>
        </div>
      )}
    </>
  );
}
