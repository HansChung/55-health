"use client";

// ────────────────────────────────────────────────
// 節日、生日祝福影片：選場合 → 給誰、你是誰 → 放照片（每張一句祝福，預設幫你寫好）→ 配樂 → 做成影片
// 照片一選好就直傳到暫存區（送出時只送路徑）；伺服器自己剪，不花算力
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { trackEvent } from "@/lib/telemetry";
import { compressImage } from "@/lib/image-utils";
import { stagePhoto } from "@/lib/direct-upload";
import { MONTAGE_MUSIC, montageMusicFile, type MontageMusicId, type TravelVideo, type TravelVideoQuota } from "@/lib/travel-video";
import { YEARLY_CAPTION_MAX } from "@/lib/travel-yearly";
import {
  GREETING_MAX_PHOTOS,
  GREETING_MIN_PHOTOS,
  GREETING_NAME_MAX,
  GREETING_OCCASIONS,
  defaultGreetingLine,
  greetingClosing,
  greetingOccasion,
  greetingSeconds,
  greetingTitle,
  type GreetingOccasion,
} from "@/lib/greeting-video";

const sectionTitle: React.CSSProperties = {
  fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", margin: "24px 0 12px",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", fontSize: "var(--fs-base)",
  borderRadius: "var(--r-md)", border: "2px solid var(--line)", background: "var(--surface)",
  color: "var(--ink-1)", boxSizing: "border-box",
};

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "10px 8px", minHeight: 52, borderRadius: "var(--r-md)", cursor: "pointer",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  };
}

interface Photo {
  id: string;
  preview: string;
  path: string | null;
  width: number;
  height: number;
  /** 長輩自己改過的字（沒改就跟著場合換預設的） */
  caption: string | null;
  failed?: boolean;
}

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

export function GreetingComposer({
  pending,
  onCreated,
}: {
  /** 已經有一支祝福影片在做 */
  pending: boolean;
  onCreated: (video: TravelVideo, quota: TravelVideoQuota) => void;
}) {
  const [occasion, setOccasion] = useState<GreetingOccasion>("birthday");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [music, setMusic] = useState<MontageMusicId>(greetingOccasion("birthday").music);
  const [musicTouched, setMusicTouched] = useState(false);
  const [quota, setQuota] = useState<TravelVideoQuota | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<MontageMusicId | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api.greetingQuota().then((r) => setQuota(r.quota)).catch(() => undefined);
    return () => {
      previewRef.current?.pause();
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, []);

  // 上一支做完或失敗：重新拿一次次數
  const wasPending = useRef(pending);
  useEffect(() => {
    if (wasPending.current && !pending) api.greetingQuota().then((r) => setQuota(r.quota)).catch(() => undefined);
    wasPending.current = pending;
  }, [pending]);

  const pickOccasion = (id: GreetingOccasion) => {
    setOccasion(id);
    if (!musicTouched) setMusic(greetingOccasion(id).music);
  };

  const stopPreview = () => {
    previewRef.current?.pause();
    if (previewTimer.current) clearTimeout(previewTimer.current);
    setPreviewing(null);
  };
  const pickMusic = (id: MontageMusicId) => {
    setMusic(id);
    setMusicTouched(true);
    stopPreview();
    const audio = (previewRef.current ??= new Audio());
    audio.src = montageMusicFile(id);
    audio.currentTime = 0;
    audio.play().then(() => setPreviewing(id)).catch(() => { /* 瀏覽器不讓播就算了 */ });
    previewTimer.current = setTimeout(stopPreview, 12_000);
  };

  // 一選好就壓小、直傳；畫面先顯示，傳好了再記路徑
  const addFiles = async (files: File[]) => {
    const room = GREETING_MAX_PHOTOS - photos.length;
    const list = files.slice(0, room);
    if (files.length > room) setError(`最多 ${GREETING_MAX_PHOTOS} 張，先放前 ${room} 張`);
    for (const file of list) {
      const id = crypto.randomUUID();
      try {
        const dataUrl = await compressImage(file, { maxSide: 1600, quality: 0.85 });
        const size = await imageSize(dataUrl);
        setPhotos((prev) => [...prev, { id, preview: dataUrl, path: null, ...size, caption: null }]);
        const path = await stagePhoto(dataUrl);
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, path, failed: !path } : p)));
      } catch {
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, failed: true } : p)));
      }
    }
  };

  const captionOf = (p: Photo, i: number) => p.caption ?? defaultGreetingLine(occasion, i);
  const move = (i: number, d: -1 | 1) =>
    setPhotos((prev) => {
      const j = i + d;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const uploading = photos.some((p) => !p.path && !p.failed);
  const ready = photos.filter((p) => p.path);
  const remaining = quota ? (quota.limit >= 9999 ? null : Math.max(0, quota.limit - quota.used)) : null;
  const title = greetingTitle(occasion, to);
  const closing = greetingClosing(from);

  const submit = async () => {
    if (submitting || pending) return;
    setError(null);
    if (ready.length < GREETING_MIN_PHOTOS) {
      setError("先放至少一張照片");
      return;
    }
    stopPreview();
    setSubmitting(true);
    try {
      const res = await api.createGreetingVideo({
        occasion,
        to,
        from,
        music,
        photos: photos
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => p.path)
          .map(({ p, i }) => ({ photoPath: p.path!, width: p.width, height: p.height, caption: captionOf(p, i) })),
      });
      trackEvent("greeting_video_create", { occasion, photos: ready.length, music, to: Boolean(to), from: Boolean(from) });
      setQuota(res.quota);
      onCreated(res.video, res.quota);
      setPhotos([]);
    } catch (e) {
      setError(e instanceof ApiError && !e.isNetwork ? e.message : "沒送出去，請再試一次");
    }
    setSubmitting(false);
  };

  if (quota && quota.limit === 0) {
    return (
      <div className="card" style={{ marginTop: 16, textAlign: "center", color: "var(--ink-2)", lineHeight: 1.6 }}>
        你的方案還不能做祝福影片，升級後就可以做
      </div>
    );
  }

  return (
    <div>
      <div style={sectionTitle}>① 什麼場合？</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} role="radiogroup" aria-label="場合">
        {GREETING_OCCASIONS.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={occasion === o.id} onClick={() => pickOccasion(o.id)} style={chip(occasion === o.id)}>
            <span aria-hidden="true">{o.emoji}</span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>

      <label htmlFor="greeting-to" style={{ ...sectionTitle, display: "block" }}>② 要給誰？</label>
      <input id="greeting-to" value={to} maxLength={GREETING_NAME_MAX} onChange={(e) => setTo(e.target.value)} placeholder="例如：小美、乖孫、大家" style={inputStyle} />
      <label htmlFor="greeting-from" style={{ ...sectionTitle, display: "block", marginTop: 16 }}>你是誰？（片尾會寫「愛你的 ○○」）</label>
      <input id="greeting-from" value={from} maxLength={GREETING_NAME_MAX} onChange={(e) => setFrom(e.target.value)} placeholder="例如：阿嬤、外公" style={inputStyle} />

      <div style={sectionTitle}>
        ③ 放照片<span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（{GREETING_MIN_PHOTOS}～{GREETING_MAX_PHOTOS} 張，每張下面一句話）</span>
      </div>
      {photos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {photos.map((p, i) => (
            <div key={p.id} className="card" style={{ padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img src={p.preview} alt={`第 ${i + 1} 張`} style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, opacity: p.path ? 1 : 0.5 }} />
                {!p.path && (
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
                    {p.failed ? "⚠️ 沒傳上去" : "上傳中…"}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  value={captionOf(p, i)}
                  maxLength={YEARLY_CAPTION_MAX}
                  onChange={(e) => setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
                  aria-label={`第 ${i + 1} 張的祝福`}
                  style={{ ...inputStyle, padding: "10px 12px" }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button type="button" className="btn-ghost" style={{ minHeight: 40, padding: "4px 10px", flex: 1 }} onClick={() => move(i, -1)} disabled={i === 0} aria-label="往前移">⬆️</button>
                  <button type="button" className="btn-ghost" style={{ minHeight: 40, padding: "4px 10px", flex: 1 }} onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="往後移">⬇️</button>
                  <button type="button" className="btn-ghost" style={{ minHeight: 40, padding: "4px 10px", flex: 1 }} onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))} aria-label="拿掉這張">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void addFiles(files);
        }}
      />
      {photos.length < GREETING_MAX_PHOTOS && (
        <button type="button" className="btn-ghost" style={{ width: "100%", marginTop: 12, minHeight: 60 }} onClick={() => fileRef.current?.click()}>
          ➕ {photos.length ? "再放照片" : "選照片"}
        </button>
      )}

      <div style={sectionTitle}>
        ④ 配樂<span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（點一下可以試聽）</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} role="group" aria-label="配樂">
        {MONTAGE_MUSIC.map((m) => (
          <button key={m.id} type="button" onClick={() => pickMusic(m.id)} aria-pressed={music === m.id} style={chip(music === m.id)}>
            <span aria-hidden="true">{m.emoji}</span>
            <span>{m.label}</span>
            {previewing === m.id && <span aria-label="試聽中">🔊</span>}
          </button>
        ))}
      </div>
      {previewing && (
        <button type="button" onClick={stopPreview} className="btn-ghost" style={{ marginTop: 10, width: "100%", fontSize: "var(--fs-sm)" }}>
          ⏹ 停止試聽
        </button>
      )}

      <div className="card" style={{ marginTop: 20, padding: 14, background: "var(--surface-warm)", lineHeight: 1.7, fontSize: "var(--fs-sm)" }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>影片會是這樣：</div>
        <div>片頭《{title}》</div>
        <div>→ {ready.length || "幾"} 張照片，每張一句祝福</div>
        {closing && <div>→ 片尾「{closing}」</div>}
        <div style={{ color: "var(--ink-2)" }}>大約 {greetingSeconds(Math.max(1, ready.length), Boolean(closing))} 秒，做好會通知你（大約 3～10 分鐘）</div>
        {remaining !== null && <div style={{ color: "var(--ink-2)" }}>這個月還可以做 {remaining} 支</div>}
      </div>

      {error && <div role="alert" style={{ marginTop: 10, color: "var(--berry)", fontWeight: 700 }}>{error}</div>}
      <button
        type="button"
        onClick={submit}
        disabled={submitting || pending || uploading || remaining === 0 || ready.length < GREETING_MIN_PHOTOS}
        className="btn-primary"
        style={{ width: "100%", marginTop: 12, minHeight: 60, fontSize: "var(--fs-lg)" }}
      >
        {submitting ? "準備中…" : pending ? "上一支還在做…" : uploading ? "照片上傳中…" : "🎁 做成祝福影片"}
      </button>
    </div>
  );
}
