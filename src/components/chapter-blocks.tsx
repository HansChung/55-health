"use client";

// ────────────────────────────────────────────────
// 章節頁：後台新增的內容區塊（文字／圖片／影片／練習範例／連結）
// 字級、按鈕大小沿用章節頁的長輩友善設計
// ────────────────────────────────────────────────
import Link from "next/link";
import { youtubeEmbedUrl, type ChapterBlock } from "@/lib/chapter-content";
import type { ExternalAiProvider } from "@/lib/external-ai";

interface Props {
  blocks: ChapterBlock[];
  onCopy: (text: string) => void;
  onTryExternal: (provider: ExternalAiProvider, text: string) => void;
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

export function ChapterBlocks({ blocks, onCopy, onTryExternal, onTryVoice }: Props) {
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => onTryExternal("gemini", b.prompt)}
                      style={{ ...bigBtn, borderRadius: 12, border: "2px solid #5B8DEF", color: "#3D6BC7", fontWeight: 800 }}
                    >
                      用 Gemini 試
                    </button>
                    <button
                      type="button"
                      onClick={() => onTryExternal("chatgpt", b.prompt)}
                      style={{ ...bigBtn, borderRadius: 12, border: "2px solid #10A37F", color: "#0D8A6A", fontWeight: 800 }}
                    >
                      用 ChatGPT 試
                    </button>
                  </div>
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
