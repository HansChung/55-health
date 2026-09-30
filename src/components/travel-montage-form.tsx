"use client";

// ────────────────────────────────────────────────
// 多張照片遊記影片的表單：選 3～5 張照片 → 每張一句話（AI 可以幫寫）→ 選聲音 → 開始做
// 影片在暖暖自己的伺服器上做（照片慢慢移動＋配音＋字幕），通常 1～3 分鐘
// ────────────────────────────────────────────────

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { compressImage } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import {
  MONTAGE_LINE_MAX,
  MONTAGE_MAX_PHOTOS,
  MONTAGE_MIN_PHOTOS,
  NARRATION_VOICES,
  TRAVEL_VIDEO_PLACE_MAX,
  sanitizeMontageLine,
  type NarrationVoiceId,
  type TravelVideo,
  type TravelVideoQuota,
} from "@/lib/travel-video";

interface MontagePhotoDraft {
  key: string;
  dataUrl: string;
  width: number;
  height: number;
}

const hiddenInput: React.CSSProperties = {
  position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none",
};

const pickButton: React.CSSProperties = {
  position: "relative",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: 6, padding: "18px 12px", minHeight: 100,
  background: "var(--surface)", border: "2px solid var(--line)", borderRadius: "var(--r-md)",
  fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", margin: "24px 0 12px",
};

const smallButton: React.CSSProperties = {
  minWidth: 44, minHeight: 44, borderRadius: 12, border: "2px solid var(--line)",
  background: "var(--surface)", fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-1)",
};

function choiceButton(active: boolean): React.CSSProperties {
  return {
    padding: "14px 10px", minHeight: 60, borderRadius: "var(--r-md)",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
  };
}

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export function TravelMontageForm({
  blockedReason,
  onCreated,
  reloadVideos,
  knownIds,
}: {
  /** 配額用完／還有一支在做 → 不能送出的原因 */
  blockedReason: string | null;
  onCreated: (video: TravelVideo, quota: TravelVideoQuota) => void;
  /** 送出時斷線：重新整理清單，看伺服器是不是其實已經收到 */
  reloadVideos: () => Promise<TravelVideo[] | null>;
  knownIds: string[];
}) {
  const toast = useToast();
  const [photos, setPhotos] = useState<MontagePhotoDraft[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [voice, setVoice] = useState<NarrationVoiceId>("female");
  const [place, setPlace] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const friendlyError = (e: unknown, fallback: string) =>
    e instanceof ApiError && !e.isNetwork && !/^HTTP \d+$/.test(e.message) ? e.message : fallback;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MONTAGE_MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.info(`最多 ${MONTAGE_MAX_PHOTOS} 張照片`);
      return;
    }
    if (files.length > room) toast.info(`最多 ${MONTAGE_MAX_PHOTOS} 張，先放前 ${room} 張`);
    setPreparing(true);
    const added: MontagePhotoDraft[] = [];
    for (const file of files.slice(0, room)) {
      try {
        const dataUrl = await compressImage(file, { maxSide: 1280, quality: 0.8 });
        const size = await imageSize(dataUrl);
        added.push({ key: `${Date.now()}-${Math.random()}`, dataUrl, ...size });
      } catch (err) {
        console.warn("[montage] photo prepare failed:", err);
        toast.error("有一張照片讀不出來，換一張試試（建議用 JPG）");
      }
    }
    setPhotos((prev) => [...prev, ...added]);
    setLines((prev) => [...prev, ...added.map(() => "")]);
    setPreparing(false);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const swap = <T,>(arr: T[]) => {
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    };
    setPhotos(swap);
    setLines(swap);
  };

  const remove = (i: number) => {
    setPhotos((prev) => prev.filter((_, k) => k !== i));
    setLines((prev) => prev.filter((_, k) => k !== i));
  };

  const enoughPhotos = photos.length >= MONTAGE_MIN_PHOTOS;
  const cleanLines = lines.map(sanitizeMontageLine);
  const reason =
    blockedReason ??
    (!enoughPhotos
      ? `先選 ${MONTAGE_MIN_PHOTOS}～${MONTAGE_MAX_PHOTOS} 張照片`
      : cleanLines.some((l) => !l)
        ? "每張照片都要有一句話（可以按「AI 幫我寫」）"
        : null);

  const handleWrite = async () => {
    if (!enoughPhotos || writing) return;
    setWriting(true);
    try {
      const res = await api.writeTravelMontageScript({
        images: photos.map((p) => p.dataUrl),
        place: place.trim() || undefined,
      });
      setLines(res.lines);
      trackEvent("travel_montage_script_ai", { photos: photos.length });
    } catch (e) {
      toast.error(friendlyError(e, "AI 這次沒寫出來，請再按一次或自己寫寫看"));
    } finally {
      setWriting(false);
    }
  };

  const handleSubmit = async () => {
    if (reason || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.createTravelMontage({
        images: photos.map((p) => p.dataUrl),
        sizes: photos.map(({ width, height }) => ({ width, height })),
        lines: cleanLines,
        voice,
        place: place.trim() || undefined,
      });
      trackEvent("travel_montage_create", { photos: photos.length, voice });
      onCreated(res.video, res.quota);
      setPhotos([]);
      setLines([]);
      setPlace("");
      toast.success("開始做遊記影片了！通常 1～3 分鐘，做好會通知你");
    } catch (e) {
      // 斷線／逾時：伺服器可能已經收到 → 看清單多了一支製作中的遊記，就當作送出成功
      const latest = await reloadVideos();
      if (latest?.some((v) => v.kind === "montage" && v.montage_progress && !knownIds.includes(v.id))) {
        setPhotos([]);
        setLines([]);
        toast.info("遊記已經送出，正在製作中，不用再送一次");
      } else {
        toast.error(friendlyError(e, "網路不穩，遊記沒送出去，請再試一次"));
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* ① 照片 */}
      <div style={sectionTitle}>
        ① 選 {MONTAGE_MIN_PHOTOS}～{MONTAGE_MAX_PHOTOS} 張照片
        <span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（已選 {photos.length} 張）</span>
      </div>
      {photos.length < MONTAGE_MAX_PHOTOS && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={pickButton}>
            <input type="file" accept="image/*" multiple onChange={handleFiles} style={hiddenInput} disabled={preparing} />
            <span style={{ fontSize: 32 }} aria-hidden="true">🖼️</span>
            {preparing ? "處理中…" : "從相簿選"}
          </label>
          <label style={pickButton}>
            <input type="file" accept="image/*" capture="environment" onChange={handleFiles} style={hiddenInput} disabled={preparing} />
            <span style={{ fontSize: 32 }} aria-hidden="true">📷</span>
            拍一張加進來
          </label>
        </div>
      )}

      {/* ② 每張一句話 */}
      <div style={sectionTitle}>
        ② 每張照片說一句話
        <span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（影片照這個順序播）</span>
      </div>
      {photos.length === 0 ? (
        <div style={{
          padding: 16, borderRadius: "var(--r-md)", border: "1px dashed var(--line-strong)",
          fontSize: "var(--fs-sm)", color: "var(--ink-2)", textAlign: "center",
        }}>
          選好照片後，在這裡寫每張的一句話，也可以請 AI 幫你寫
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {photos.map((p, i) => (
              <div key={p.key} className="card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={p.dataUrl} alt={`第 ${i + 1} 張`} style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 12, display: "block" }} />
                  <span style={{
                    position: "absolute", left: 4, top: 4, minWidth: 26, height: 26, borderRadius: 13,
                    background: "var(--primary)", color: "#fff", fontSize: 15, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <textarea
                    value={lines[i] ?? ""}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, k) => (k === i ? [...e.target.value.replace(/\n/g, "")].slice(0, MONTAGE_LINE_MAX).join("") : l))
                      )
                    }
                    rows={2}
                    placeholder={i === 0 ? "例如：今天跟老伴來日月潭" : "這張想說什麼？"}
                    aria-label={`第 ${i + 1} 張的一句話`}
                    style={{
                      width: "100%", padding: "10px 12px", fontSize: "var(--fs-sm)", lineHeight: 1.45, boxSizing: "border-box",
                      borderRadius: 12, border: "2px solid var(--line)", background: "var(--surface)", color: "var(--ink-1)",
                      resize: "none", fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="往前移" style={{ ...smallButton, opacity: i === 0 ? 0.35 : 1 }}>▲</button>
                    <button onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="往後移" style={{ ...smallButton, opacity: i === photos.length - 1 ? 0.35 : 1 }}>▼</button>
                    <button onClick={() => remove(i)} aria-label={`拿掉第 ${i + 1} 張`} style={smallButton}>✕</button>
                    <span style={{ marginLeft: "auto", fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
                      {[...(lines[i] ?? "")].length}/{MONTAGE_LINE_MAX}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleWrite}
            disabled={!enoughPhotos || writing}
            className="btn-ghost"
            style={{ width: "100%", marginTop: 12, opacity: !enoughPhotos || writing ? 0.5 : 1 }}
          >
            {writing ? "AI 看照片寫作中…（約 15 秒）" : "✨ AI 幫我寫每一句"}
          </button>
          {!enoughPhotos && (
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 6, textAlign: "center" }}>
              再選 {MONTAGE_MIN_PHOTOS - photos.length} 張，AI 就可以幫你寫
            </div>
          )}
        </>
      )}

      {/* ③ 聲音 */}
      <div style={sectionTitle}>③ 用誰的聲音念？</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {NARRATION_VOICES.map((v) => (
          <button
            key={v.id}
            onClick={() => setVoice(v.id)}
            aria-pressed={voice === v.id}
            style={{ ...choiceButton(voice === v.id), display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
          >
            <span style={{ fontSize: 30 }} aria-hidden="true">{v.emoji}</span>
            <span style={{ whiteSpace: "nowrap" }}>{v.label}</span>
          </button>
        ))}
      </div>

      {/* ④ 地點 */}
      <label htmlFor="montage-place" style={{ ...sectionTitle, display: "block" }}>
        ④ 去了哪裡？<span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（可以不填）</span>
      </label>
      <input
        id="montage-place"
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        maxLength={TRAVEL_VIDEO_PLACE_MAX}
        placeholder="例如：鹿港老街"
        style={{
          width: "100%", padding: "16px 18px", fontSize: "var(--fs-base)",
          borderRadius: "var(--r-md)", border: "2px solid var(--line)", background: "var(--surface)",
          color: "var(--ink-1)", boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={Boolean(reason) || submitting}
        className="btn-primary"
        style={{ width: "100%", marginTop: 24, opacity: reason || submitting ? 0.5 : 1, cursor: reason || submitting ? "not-allowed" : "pointer" }}
      >
        {submitting ? "送出中…" : "📚 開始做遊記影片"}
      </button>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
        {reason ?? "照片會慢慢移動、每張念一句話、配上字幕，通常 1～3 分鐘做好"}
        <br />
        照片與文字會傳送給 AI（邁笙平台）幫忙寫字與配音；影片在暖暖的伺服器上製作
      </div>
    </div>
  );
}
