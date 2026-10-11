"use client";

// ────────────────────────────────────────────────
// 章節頁：後台新增的內容區塊（文字／圖片／影片／練習範例／連結／Podcast 音檔）
// 字級、按鈕大小沿用章節頁的長輩友善設計
// ────────────────────────────────────────────────
import { useRef, useState } from "react";
import Link from "next/link";
import { youtubeEmbedUrl, type ChapterBlock } from "@/lib/chapter-content";

interface Props {
  blocks: ChapterBlock[];
  onCopy: (text: string) => void;
  /** 打字問暖暖（範例帶到暖暖的打字對話） */
  onTryAsk: (text: string) => void;
  onTryVoice: () => void;
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-lg)",
  padding: "16px 18px",
  marginBottom: 14,
};

const bigBtn: React.CSSProperties = {
  width: "100%", padding: "14px", borderRadius: "var(--r-pill)",
  fontWeight: 700, fontSize: "var(--fs-sm)", cursor: "pointer",
  background: "var(--surface)", border: "2px solid var(--line-strong)", color: "var(--ink-1)",
};

const captionStyle: React.CSSProperties = {
  margin: "8px 2px 0", fontSize: "var(--fs-xs)", color: "var(--ink-3)", lineHeight: 1.5,
};

export function ChapterBlocks({ blocks, onCopy, onTryAsk, onTryVoice }: Props) {
  if (!blocks.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      {blocks.map((b) => {
        switch (b.type) {
          case "text":
            return (
              <div key={b.id} style={cardStyle}>
                {b.title && (
                  <div style={{ fontWeight: 800, fontSize: "var(--fs-base)", marginBottom: 6 }}>{b.title}</div>
                )}
                <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.75, color: "var(--ink-1)", whiteSpace: "pre-wrap" }}>
                  {b.body}
                </div>
              </div>
            );

          case "image":
            return (
              <figure key={b.id} style={{ margin: "0 0 14px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.url}
                  alt={b.caption ?? ""}
                  loading="lazy"
                  style={{ width: "100%", display: "block", borderRadius: "var(--r-lg)", background: "var(--line)" }}
                />
                {b.caption && <figcaption style={captionStyle}>{b.caption}</figcaption>}
              </figure>
            );

          case "video": {
            const embed = youtubeEmbedUrl(b.url);
            if (!embed) return null;
            return (
              <figure key={b.id} style={{ margin: "0 0 14px" }}>
                <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: "var(--r-lg)", overflow: "hidden", background: "#000" }}>
                  <iframe
                    src={embed}
                    title={b.caption || "章節影片"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  />
                </div>
                {b.caption && <figcaption style={captionStyle}>{b.caption}</figcaption>}
              </figure>
            );
          }

          case "example":
            return (
              <div key={b.id} style={{ ...cardStyle, background: "var(--surface-warm, #FFF8EE)" }}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--primary-deep)", marginBottom: 6 }}>
                  💬 練習範例{b.title ? `｜${b.title}` : ""}
                </div>
                <div style={{
                  fontSize: "var(--fs-base)", lineHeight: 1.7, whiteSpace: "pre-wrap",
                  padding: "12px 14px", borderRadius: 12, background: "var(--surface)",
                  border: "1px dashed var(--line-strong)", marginBottom: 10,
                }}>
                  {b.prompt}
                </div>
                {b.note && <p style={{ ...captionStyle, margin: "0 2px 10px" }}>{b.note}</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button type="button" style={bigBtn} onClick={() => onCopy(b.prompt)}>複製這句話</button>
                  <button
                    type="button"
                    onClick={() => onTryAsk(b.prompt)}
                    style={{ ...bigBtn, borderRadius: 12, border: "2px solid var(--primary)", color: "var(--primary-deep)", fontWeight: 800 }}
                  >
                    ✍️ 打字問暖暖 →
                  </button>
                  <button
                    type="button"
                    onClick={onTryVoice}
                    style={{ ...bigBtn, background: "var(--primary-soft)", border: "2px solid var(--primary)", color: "var(--primary-deep)" }}
                  >
                    在暖暖用語音試 →
                  </button>
                </div>
              </div>
            );

          case "audio":
            return <AudioBlock key={b.id} url={b.url} title={b.title} caption={b.caption} />;

          case "link": {
            const style: React.CSSProperties = {
              ...bigBtn, display: "block", textAlign: "center", textDecoration: "none",
              marginBottom: 14, border: "2px solid var(--primary)", color: "var(--primary-deep)",
            };
            const internal = b.url.startsWith("/");
            return internal ? (
              <Link key={b.id} href={b.url} style={style}>{b.label} →</Link>
            ) : (
              <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer" style={style}>
                {b.label} ↗
              </a>
            );
          }
        }
      })}
    </div>
  );
}

/** 聽起來太快可以放慢一點（長輩常用 0.8 倍） */
const SPEEDS = [0.8, 1, 1.25] as const;

function AudioBlock({ url, title, caption }: { url: string; title?: string; caption?: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [speed, setSpeed] = useState<number>(1);
  const pick = (v: number) => {
    setSpeed(v);
    if (ref.current) ref.current.playbackRate = v;
  };
  return (
    <div style={{ ...cardStyle, background: "var(--surface-warm, #FFF8EE)" }}>
      <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--primary-deep)", marginBottom: 6 }}>🎧 Podcast</div>
      {title && <div style={{ fontWeight: 800, fontSize: "var(--fs-base)", marginBottom: 10 }}>{title}</div>}
      <audio
        ref={ref}
        className="no-print"
        controls
        preload="none"
        src={url}
        onPlay={(e) => { e.currentTarget.playbackRate = speed; }}
        style={{ width: "100%", display: "block" }}
      >
        這支手機不能播放，請換一個瀏覽器試試。
      </audio>
      <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>播放速度</span>
        {SPEEDS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => pick(v)}
            aria-pressed={speed === v}
            style={{
              padding: "8px 14px", minHeight: 44, borderRadius: 999, fontWeight: 700, fontSize: "var(--fs-sm)",
              background: speed === v ? "var(--primary-soft)" : "var(--surface)",
              border: `2px solid ${speed === v ? "var(--primary)" : "var(--line)"}`, color: "var(--ink-1)", cursor: "pointer",
            }}
          >
            {v === 1 ? "正常" : v < 1 ? "慢一點" : "快一點"}
          </button>
        ))}
      </div>
      {caption && <p style={{ ...captionStyle, whiteSpace: "pre-wrap" }}>{caption}</p>}
    </div>
  );
}
