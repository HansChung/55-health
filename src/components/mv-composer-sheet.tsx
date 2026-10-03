"use client";

// ────────────────────────────────────────────────
// 遊記 MV（專業版）：選國語／台語、曲風、男聲女聲 → AI 寫歌詞（可以改、可以用說的）→ 開始做
// 做歌用邁笙 Suno（每首約 0.54 算力），做好的 MV 會出現在影片清單、家人看板，也可以分享
// ────────────────────────────────────────────────

import { useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { DictationButton } from "@/components/dictation-button";
import {
  MV_LANGUAGES,
  MV_LYRICS_MAX,
  MV_STYLES,
  MV_TITLE_MAX,
  MV_VOCALS,
  sanitizeMvLyrics,
  sanitizeMvTitle,
  type MvLanguageId,
  type MvStyleId,
  type MvVocal,
  type TravelVideo,
  type TravelVideoQuota,
} from "@/lib/travel-video";

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "10px 14px", minHeight: 44, borderRadius: 999,
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `2px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-1)", cursor: "pointer",
  };
}

const label: React.CSSProperties = { fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-2)", marginBottom: 6 };

export function MvComposerSheet({
  source,
  quota,
  blockedReason,
  onClose,
  onCreated,
}: {
  /** 做好的遊記 */
  source: TravelVideo;
  quota: TravelVideoQuota | null;
  /** 有一支 MV 還在做等等，不能送出的原因 */
  blockedReason: string | null;
  onClose: () => void;
  onCreated: (video: TravelVideo, quota: TravelVideoQuota) => void;
}) {
  const toast = useToast();
  const [language, setLanguage] = useState<MvLanguageId>("mandarin");
  const [style, setStyle] = useState<MvStyleId>("folk");
  const [vocal, setVocal] = useState<MvVocal>("f");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [writing, setWriting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allowed = (quota?.limit ?? 0) > 0;
  const unlimited = (quota?.limit ?? 0) >= 9999;
  const remaining = quota ? Math.max(0, quota.limit - quota.used) : 0;
  const ready = Boolean(sanitizeMvTitle(title)) && [...sanitizeMvLyrics(lyrics)].length >= 20;
  const reason = blockedReason ?? (!unlimited && remaining === 0 ? "本月的 MV 次數用完了，下個月再來做吧" : null);

  const fail = (e: unknown, fallback: string) =>
    toast.error(e instanceof ApiError && !e.isNetwork ? e.message : fallback);

  const write = async () => {
    if (writing) return;
    setWriting(true);
    try {
      const res = await api.writeMvLyrics(source.id, { language, style });
      setTitle(res.title);
      setLyrics(res.lyrics);
      trackEvent("mv_lyrics_ai", { language, style });
    } catch (e) {
      fail(e, "AI 這次沒寫出來，請再按一次");
    } finally {
      setWriting(false);
    }
  };

  const submit = async () => {
    if (!ready || submitting || reason) return;
    setSubmitting(true);
    try {
      const res = await api.createMv(source.id, { language, style, vocal, title, lyrics });
      trackEvent("mv_create", { language, style, vocal });
      toast.success("開始做 MV 了！通常 5～10 分鐘，做好會通知你");
      onCreated(res.video, res.quota);
    } catch (e) {
      fail(e, "網路不穩，MV 沒送出去，請再試一次");
    } finally {
      setSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="做成 MV"
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: "rgba(20, 14, 10, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, maxHeight: "100%", overflowY: "auto", background: "var(--surface, #fff)", borderRadius: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", color: "var(--ink-1)" }}>
        <div style={{ padding: "22px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>🎵 把這趟寫成一首歌</div>
            <button onClick={onClose} className="btn-ghost" style={{ padding: "8px 14px", fontSize: "var(--fs-sm)" }}>關閉</button>
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
            用「{source.place || "這趟遊記"}」的照片和你寫的句子，做成一首歌和 2～3 分鐘的 MV。
          </div>

          {!allowed ? (
            <>
              <div style={{ lineHeight: 1.7 }}>遊記 MV 是<b>專業版</b>功能，升級後每個月可以做 6 首。</div>
              <a href="/pricing" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>看看專業版</a>
            </>
          ) : (
            <>
              <div>
                <div style={label}>用什麼話唱？</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {MV_LANGUAGES.map((l) => (
                    <button key={l.id} onClick={() => setLanguage(l.id)} aria-pressed={language === l.id} style={chip(language === l.id)}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={label}>曲風</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {MV_STYLES.map((m) => (
                    <button key={m.id} onClick={() => setStyle(m.id)} aria-pressed={style === m.id} style={chip(style === m.id)}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={label}>誰來唱？</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {MV_VOCALS.map((v) => (
                    <button key={v.id} onClick={() => setVocal(v.id)} aria-pressed={vocal === v.id} style={chip(vocal === v.id)}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={write} disabled={writing || submitting} className={lyrics ? "btn-ghost" : "btn-primary"} style={{ opacity: writing ? 0.6 : 1 }}>
                {writing ? "AI 寫歌詞中…（約 10 秒）" : lyrics ? "✨ 請 AI 重寫一次" : "✨ AI 寫歌詞"}
              </button>

              {(lyrics || title) && (
                <>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={label}>歌名</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle([...e.target.value].slice(0, MV_TITLE_MAX).join(""))}
                      style={{ padding: "12px 14px", fontSize: "var(--fs-base)", borderRadius: "var(--r-md)", border: "2px solid var(--line)", background: "var(--surface)", color: "var(--ink-1)" }}
                    />
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={label}>歌詞（可以直接改；[Verse]、[Chorus] 是分段，不會唱出來）</span>
                    <textarea
                      value={lyrics}
                      onChange={(e) => setLyrics([...e.target.value].slice(0, MV_LYRICS_MAX).join(""))}
                      rows={12}
                      aria-label="歌詞"
                      style={{
                        padding: "12px 14px", fontSize: "var(--fs-base)", lineHeight: 1.7, borderRadius: "var(--r-md)",
                        border: "2px solid var(--line)", background: "var(--surface)", color: "var(--ink-1)", resize: "vertical", fontFamily: "inherit",
                      }}
                    />
                    <DictationButton
                      where="mv"
                      disabled={submitting}
                      onText={(heard) => setLyrics((prev) => [...(prev ? `${prev}\n${heard.trim()}` : heard.trim())].slice(0, MV_LYRICS_MAX).join(""))}
                    />
                  </div>
                </>
              )}

              <button
                onClick={submit}
                disabled={!ready || submitting || Boolean(reason)}
                className="btn-primary"
                style={{ opacity: !ready || submitting || reason ? 0.5 : 1 }}
              >
                {submitting ? "送出中…" : "🎬 開始做 MV"}
              </button>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", textAlign: "center", lineHeight: 1.6 }}>
                {reason ??
                  (ready
                    ? `通常 5～10 分鐘，做好會通知你${unlimited ? "" : `。本月還能做 ${remaining} 首`}`
                    : "先按「AI 寫歌詞」，看過、改好再開始做")}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
