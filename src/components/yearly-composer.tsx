"use client";

// ────────────────────────────────────────────────
// 年度回憶影片（研學團遊記也用這個畫面：tour 有給就從團體相簿挑照片，沒有年份）：選年份 → 勾照片（這一年的遊記、出遊影片、故事集照片；太多時先幫忙平均挑好）
// → 每張下面一行字（預設「3 月・阿里山」，可以改）→ 標題、配樂 → 做成影片（伺服器自己剪，不花算力）
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { trackEvent } from "@/lib/telemetry";
import {
  DEFAULT_MONTAGE_MUSIC,
  MONTAGE_MUSIC,
  montageMusicFile,
  type MontageMusicId,
  type TravelVideo,
  type TravelVideoQuota,
} from "@/lib/travel-video";
import {
  YEARLY_CAPTION_MAX,
  YEARLY_MAX_PHOTOS,
  YEARLY_MIN_PHOTOS,
  YEARLY_PHOTO_SECONDS,
  YEARLY_TITLE_MAX,
  YEARLY_TITLE_SECONDS,
  defaultYearlyTitle,
  taipeiYearMonth,
  type YearlyCandidate,
} from "@/lib/travel-yearly";

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
    padding: "10px 18px", minHeight: 48, borderRadius: 999, cursor: "pointer",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)",
  };
}

export function YearlyComposer({
  pendingYearly,
  onCreated,
  onMakeMontage,
  tour,
}: {
  /** 已經有一支在做：先不給做第二支 */
  pendingYearly: boolean;
  onCreated: (video: TravelVideo, quota: TravelVideoQuota) => void;
  onMakeMontage?: () => void;
  /** 研學團遊記：從這一團的團體相簿挑照片 */
  tour?: { id: string; title: string };
}) {
  const [year, setYear] = useState<number | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [candidates, setCandidates] = useState<YearlyCandidate[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [music, setMusic] = useState<MontageMusicId>(DEFAULT_MONTAGE_MUSIC);
  const [quota, setQuota] = useState<TravelVideoQuota | null>(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState<MontageMusicId | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadSeq = useRef(0);

  const load = (y?: number) => {
    const seq = ++loadSeq.current;
    setCandidates(null);
    setLoadError("");
    const request = tour
      ? api.tourVideoCandidates(tour.id).then((r) => ({ ...r, year: taipeiYearMonth(new Date().toISOString()).year, years: [] as number[] }))
      : api.yearlyCandidates(y);
    request
      .then((r) => {
        if (seq !== loadSeq.current) return;
        setYear(r.year);
        setYears(r.years);
        setCandidates(r.candidates);
        setPicked(r.defaultPicks);
        setCaptions(Object.fromEntries(r.candidates.map((c) => [c.key, c.caption])));
        setQuota(r.quota);
        const serverTitle = "title" in r && typeof r.title === "string" ? r.title : "";
        if (!titleTouched) setTitle(tour ? serverTitle || tour.title : defaultYearlyTitle(r.year));
      })
      .catch((e) => {
        if (seq !== loadSeq.current) return;
        setCandidates([]);
        setLoadError(e instanceof ApiError && !e.isNetwork ? e.message : "照片載入不了，請稍後再試");
      });
  };

  useEffect(() => {
    load();
    return () => {
      previewRef.current?.pause();
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 上一支做完或失敗了：重新拿一次次數（失敗的不算，送出時先扣掉的那一支要還回來）
  const wasPending = useRef(pendingYearly);
  useEffect(() => {
    if (wasPending.current && !pendingYearly && year) {
      (tour ? api.tourVideoCandidates(tour.id) : api.yearlyCandidates(year)).then((r) => setQuota(r.quota)).catch(() => undefined);
    }
    wasPending.current = pendingYearly;
  }, [pendingYearly, year]);

  const stopPreview = () => {
    previewRef.current?.pause();
    if (previewTimer.current) clearTimeout(previewTimer.current);
    setPreviewing(null);
  };
  const pickMusic = (id: MontageMusicId) => {
    setMusic(id);
    stopPreview();
    const audio = (previewRef.current ??= new Audio());
    audio.src = montageMusicFile(id);
    audio.currentTime = 0;
    audio.play().then(() => setPreviewing(id)).catch(() => { /* 瀏覽器不讓播就算了 */ });
    previewTimer.current = setTimeout(stopPreview, 12_000);
  };

  const toggle = (key: string) => {
    setError("");
    setPicked((p) => {
      if (p.includes(key)) return p.filter((k) => k !== key);
      if (p.length >= YEARLY_MAX_PHOTOS) {
        setError(`最多 ${YEARLY_MAX_PHOTOS} 張，先取消一張再選`);
        return p;
      }
      // 照日期排好（影片照時間順序播）
      const order = new Map((candidates ?? []).map((c, i) => [c.key, i]));
      return [...p, key].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    });
  };

  const submit = async () => {
    if (!year || submitting) return;
    if (picked.length < YEARLY_MIN_PHOTOS) {
      setError(`至少選 ${YEARLY_MIN_PHOTOS} 張照片`);
      return;
    }
    setSubmitting(true);
    setError("");
    stopPreview();
    try {
      const picks = picked.map((key) => ({ key, caption: captions[key] ?? "" }));
      const res = tour
        ? await api.createTourVideo(tour.id, { title: title.trim() || tour.title, music, picks })
        : await api.createYearlyVideo({ year, title: title.trim() || defaultYearlyTitle(year), music, picks });
      trackEvent(tour ? "tour_video_create" : "travel_yearly_create", { photos: picked.length, music });
      setQuota(res.quota);
      onCreated(res.video, res.quota);
    } catch (e) {
      setError(e instanceof ApiError && !e.isNetwork ? e.message : "網路不太穩，請再按一次");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = quota ? Math.max(0, quota.limit - quota.used) : null;
  const seconds = YEARLY_TITLE_SECONDS + picked.length * YEARLY_PHOTO_SECONDS;
  const pickedSet = new Set(picked);

  return (
    <div>
      {years.length > 1 && (
        <>
          <div style={sectionTitle}>① 哪一年？</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} role="group" aria-label="年份">
            {years.map((y) => (
              <button key={y} onClick={() => { if (y !== year) load(y); }} aria-pressed={y === year} style={chip(y === year)}>
                {y} 年
              </button>
            ))}
          </div>
        </>
      )}

      <div style={sectionTitle}>
        ② 選照片
        <span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>
          （{YEARLY_MIN_PHOTOS}～{YEARLY_MAX_PHOTOS} 張，已選 {picked.length} 張）
        </span>
      </div>
      {candidates === null ? (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-2)" }}>{tour ? "找團體相簿的照片中…" : "找這一年的照片中…"}</div>
      ) : loadError ? (
        <div className="card" style={{ color: "var(--danger, #b91c1c)" }}>{loadError}</div>
      ) : candidates.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-2)", lineHeight: 1.6 }}>
          {tour ? "團體相簿還沒有照片，大家先放幾張吧。" : `${year} 年還沒有做好的遊記、出遊影片或有照片的故事。`}
          {!tour && onMakeMontage && (
            <button onClick={onMakeMontage} className="btn-primary" style={{ display: "block", width: "100%", marginTop: 12 }}>
              📚 先做一支遊記
            </button>
          )}
        </div>
      ) : (
        <>
          {candidates.length > YEARLY_MAX_PHOTOS && (
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 10, lineHeight: 1.5 }}>
              這一年有 {candidates.length} 張照片，暖暖先從整年平均挑了 {YEARLY_MAX_PHOTOS} 張，點照片可以換。
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {candidates.map((c) => {
              const on = pickedSet.has(c.key);
              const n = picked.indexOf(c.key) + 1;
              return (
                <button
                  key={c.key}
                  onClick={() => toggle(c.key)}
                  aria-pressed={on}
                  aria-label={`${c.caption}${on ? `，第 ${n} 張` : ""}`}
                  style={{
                    position: "relative", padding: 0, border: `3px solid ${on ? "var(--primary)" : "transparent"}`,
                    borderRadius: 12, overflow: "hidden", background: "var(--bg-deep)", cursor: "pointer", aspectRatio: "1",
                  }}
                >
                  <img src={c.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: on ? 1 : 0.55 }} />
                  <span style={{
                    position: "absolute", top: 4, right: 4, minWidth: 28, height: 28, borderRadius: 14, padding: "0 6px",
                    background: on ? "var(--primary)" : "rgba(255,255,255,0.85)", color: on ? "#fff" : "var(--ink-3)",
                    fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {on ? n : "＋"}
                  </span>
                  <span style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, padding: "3px 4px",
                    background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 12, lineHeight: 1.3,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {c.source === "story" ? "📖 " : ""}{captions[c.key] ?? c.caption}
                  </span>
                </button>
              );
            })}
          </div>

          {picked.length > 0 && (
            <>
              <div style={sectionTitle}>
                ③ 每張下面的字<span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（可以改，{YEARLY_CAPTION_MAX} 字內）</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {picked.map((key, i) => {
                  const c = candidates.find((x) => x.key === key);
                  if (!c) return null;
                  return (
                    <div key={key} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <img src={c.url} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                      <input
                        value={captions[key] ?? ""}
                        maxLength={YEARLY_CAPTION_MAX}
                        onChange={(e) => setCaptions((m) => ({ ...m, [key]: e.target.value }))}
                        aria-label={`第 ${i + 1} 張的字`}
                        style={{ ...inputStyle, padding: "10px 12px" }}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <label htmlFor="yearly-title" style={{ ...sectionTitle, display: "block" }}>④ 影片標題</label>
          <input
            id="yearly-title"
            value={title}
            maxLength={YEARLY_TITLE_MAX}
            onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }}
            placeholder={tour ? tour.title : year ? defaultYearlyTitle(year) : ""}
            style={inputStyle}
          />

          <div style={sectionTitle}>
            ⑤ 配樂<span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（點一下可以試聽）</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} role="group" aria-label="配樂">
            {MONTAGE_MUSIC.map((m) => (
              <button
                key={m.id}
                onClick={() => pickMusic(m.id)}
                aria-pressed={music === m.id}
                style={{ ...chip(music === m.id), borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <span aria-hidden="true">{m.emoji}</span>
                <span>{m.label}</span>
                {previewing === m.id && <span aria-label="試聽中">🔊</span>}
              </button>
            ))}
          </div>
          {previewing && (
            <button onClick={stopPreview} className="btn-ghost" style={{ marginTop: 10, width: "100%", fontSize: "var(--fs-sm)" }}>
              ⏹ 停止試聽
            </button>
          )}

          <div style={{ marginTop: 24, fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
            影片大約 {seconds} 秒，做好會通知你（大約 5～15 分鐘，可以先離開這個畫面）。
            {quota && quota.limit < 9999 && remaining !== null ? ` ${tour ? "這個月" : "今年"}還可以做 ${remaining} 支。` : ""}
          </div>
          {error && <div role="alert" style={{ marginTop: 10, color: "var(--danger, #b91c1c)", fontWeight: 700 }}>{error}</div>}
          <button
            onClick={submit}
            disabled={submitting || pendingYearly || remaining === 0 || picked.length < YEARLY_MIN_PHOTOS}
            className="btn-primary"
            style={{ width: "100%", marginTop: 12, minHeight: 60, fontSize: "var(--fs-lg)" }}
          >
            {submitting ? "準備中…" : pendingYearly ? "上一支還在做…" : tour ? "🎬 做成研學團遊記" : "📅 做成年度回憶影片"}
          </button>
        </>
      )}
    </div>
  );
}
