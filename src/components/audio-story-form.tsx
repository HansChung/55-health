"use client";

// ────────────────────────────────────────────────
// 聲音故事：在 App 裡錄（最多 15 分鐘），或上傳手機裡的錄音檔（mp3、m4a…，50MB 內）
// → 取標題、配照片、決定給不給家人看 → 存進我的故事集（家人可以聽、按讚、留言）
// 錄音直接傳到 Supabase（簽名網址），不經過 Vercel
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { trackEvent } from "@/lib/telemetry";
import { compressImage } from "@/lib/image-utils";
import { stagePhoto, uploadStoryAudio } from "@/lib/direct-upload";
import { STORY_ERA_MAX, STORY_PHOTOS_MAX, STORY_TITLE_MAX, type LifeStory } from "@/lib/life-stories";
import {
  STORY_AUDIO_MAX_BYTES,
  STORY_AUDIO_MIN_SECONDS,
  STORY_AUDIO_RECORD_MAX_SECONDS,
  formatAudioDuration,
  formatRecordClock,
  storyAudioType,
} from "@/lib/story-audio";

/** 簡介最多幾個字（聲音故事的文字可以不寫） */
const INTRO_MAX = 300;

interface Picked {
  blob: Blob;
  url: string;
  seconds: number;
  fileName: string;
  /** 在 App 裡錄的，還是上傳的 */
  source: "record" | "file";
}

interface DraftPhoto {
  preview: string;
  path: string;
  width: number;
  height: number;
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "var(--fs-base)",
  lineHeight: 1.6, fontFamily: "inherit", color: "var(--ink-1)", background: "var(--surface)",
  border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
};
const label: React.CSSProperties = { fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 6 };
const bigChoice: React.CSSProperties = {
  position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: 6, padding: "18px 12px", minHeight: 110, background: "var(--surface)", border: "2px solid var(--line)",
  borderRadius: "var(--r-md)", fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
};

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

/** 上傳的錄音檔有多長（瀏覽器讀檔頭；讀不到回 0，伺服器會擋太短的） */
function fileSeconds(url: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    const done = (v: number) => { a.src = ""; resolve(Number.isFinite(v) ? v : 0); };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(0);
    setTimeout(() => done(0), 8000);
    a.src = url;
  });
}

export function AudioStoryForm({ onSaved, onCancel }: { onSaved: (story: LifeStory) => void; onCancel: () => void }) {
  const toast = useToast();
  const recorder = useVoiceRecorder(STORY_AUDIO_RECORD_MAX_SECONDS);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [title, setTitle] = useState("");
  const [era, setEra] = useState("");
  const [intro, setIntro] = useState("");
  const [share, setShare] = useState(true);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  // 已經傳上去的錄音：存檔失敗再按一次就沿用，不用重傳（也不會多用掉每天的次數）
  const uploaded = useRef<{ picked: Picked; path: string } | null>(null);

  // 錄好了 → 變成要存的錄音
  useEffect(() => {
    const r = recorder.result;
    if (!r) return;
    const ext = r.blob.type.includes("mp4") ? "m4a" : r.blob.type.includes("ogg") ? "ogg" : "webm";
    setPicked({ blob: r.blob, url: r.url, seconds: r.seconds, fileName: `recording.${ext}`, source: "record" });
  }, [recorder.result]);

  // 換掉上傳的檔案就釋放舊的預覽
  useEffect(() => () => { if (picked?.source === "file") URL.revokeObjectURL(picked.url); }, [picked]);

  const startRecording = async () => {
    setPicked(null);
    const err = await recorder.start();
    if (err === "unsupported") toast.info("這支手機不能在 App 裡錄音，可以用手機的「錄音」App 錄好，再按「上傳錄音檔」");
    else if (err === "permission") toast.info("要允許暖暖使用麥克風才能錄音（到手機設定裡打開）");
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!storyAudioType(file.name, file.type)) {
      toast.error("只能放 mp3、m4a、aac、wav 錄音檔");
      return;
    }
    if (file.size > STORY_AUDIO_MAX_BYTES) {
      toast.error("錄音檔超過 50MB，請錄短一點，或分成幾段故事");
      return;
    }
    recorder.clear();
    const url = URL.createObjectURL(file);
    const seconds = await fileSeconds(url);
    setPicked({ blob: file, url, seconds, fileName: file.name, source: "file" });
    if (!title) setTitle([...file.name.replace(/\.[a-z0-9]+$/i, "")].slice(0, STORY_TITLE_MAX).join(""));
  };

  const addPhoto = async (file: File | undefined) => {
    if (!file || photos.length >= STORY_PHOTOS_MAX) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImage(file, { maxSide: 1280, quality: 0.85 });
      const [path, size] = await Promise.all([stagePhoto(dataUrl), imageSize(dataUrl)]);
      if (!path) throw new Error("upload failed");
      setPhotos((p) => [...p, { preview: dataUrl, path, ...size }].slice(0, STORY_PHOTOS_MAX));
    } catch {
      toast.error("照片傳不上去，請換一張或再試一次");
    }
    setPhotoBusy(false);
  };

  const save = async () => {
    if (!picked || saving) return;
    if (!title.trim()) {
      toast.info("幫這段故事取個標題吧");
      return;
    }
    if (picked.source === "record" && picked.seconds < STORY_AUDIO_MIN_SECONDS) {
      toast.info("錄音太短了，請多說一點");
      return;
    }
    setSaving("上傳錄音中…");
    try {
      const audioPath =
        uploaded.current?.picked === picked ? uploaded.current.path : await uploadStoryAudio(picked.blob, picked.fileName);
      uploaded.current = { picked, path: audioPath };
      setSaving(picked.source === "record" ? "整理錄音中，大約半分鐘…" : "存檔中…");
      const res = await api.createStory({
        title,
        era,
        body: intro,
        shareWithFamily: share,
        photoPaths: photos.map((p) => p.path),
        photoSizes: photos.map(({ width, height }) => ({ width, height })),
        audioPath,
        audioSeconds: picked.seconds,
      });
      trackEvent("story_audio_saved", { source: picked.source, seconds: Math.round(picked.seconds), photos: photos.length, share });
      toast.success(share ? "存好了！家人也聽得到這段故事" : "存好了！這段只有你聽得到");
      onSaved(res.story);
    } catch (e) {
      // 伺服器已經找不到那個暫存檔（搬走了或過期）：下次重新上傳
      if (e instanceof ApiError && /找不到剛剛的錄音/.test(e.message)) uploaded.current = null;
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "沒有存成功，請再試一次（錄音還在，不用重錄）");
    }
    setSaving(null);
  };

  const recording = recorder.recording || recorder.starting;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: "var(--ink-2)", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
        用<strong>自己的聲音</strong>說一段故事，像自己的廣播節目。可以在這裡錄，也可以上傳手機裡錄好的檔案。
      </div>

      {recording ? (
        <div className="card" role="status" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 2, color: "var(--berry)" }}>
            🔴 {formatRecordClock(recorder.seconds)}
          </div>
          <div style={{ color: "var(--ink-2)", fontSize: "var(--fs-sm)", marginTop: 4 }}>
            最多 {formatRecordClock(STORY_AUDIO_RECORD_MAX_SECONDS)}｜手機離嘴巴一個手掌遠，慢慢說
          </div>
          <button type="button" className="btn-primary" onClick={recorder.stop} disabled={!recorder.recording} style={{ width: "100%", marginTop: 14, minHeight: 56 }}>
            ⏹ 錄好了
          </button>
        </div>
      ) : picked ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            🎧 {picked.source === "record" ? "剛剛錄的" : "選好的錄音"}
            {picked.seconds > 0 ? `（${formatAudioDuration(picked.seconds)}）` : ""}
          </div>
          <audio controls src={picked.url} style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn-ghost" onClick={startRecording} disabled={Boolean(saving)}>🎙 重錄</button>
            <label className="btn-ghost" style={{ position: "relative" }}>
              <input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
              📁 換一個檔案
            </label>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button type="button" onClick={startRecording} style={bigChoice}>
            <span style={{ fontSize: 34 }} aria-hidden="true">🎙</span>
            現在錄
          </button>
          <label style={bigChoice}>
            <input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
            <span style={{ fontSize: 34 }} aria-hidden="true">📁</span>
            上傳錄音檔
          </label>
        </div>
      )}

      {picked && !recording && (
        <>
          <div>
            <div style={label}>標題</div>
            <input value={title} onChange={(e) => setTitle([...e.target.value].slice(0, STORY_TITLE_MAX).join(""))} placeholder="例如：我第一次搭火車到台北" style={inputStyle} aria-label="故事標題" />
          </div>
          <div>
            <div style={label}>年代或那時幾歲（可不填）</div>
            <input value={era} onChange={(e) => setEra([...e.target.value].slice(0, STORY_ERA_MAX).join(""))} placeholder="例如：民國 62 年、我 20 歲那年" style={inputStyle} aria-label="年代" />
          </div>
          <div>
            <div style={label}>一兩句介紹（可不填）</div>
            <textarea value={intro} onChange={(e) => setIntro([...e.target.value].slice(0, INTRO_MAX).join(""))} rows={3} placeholder="例如：講我跟阿公怎麼在市場認識的" style={{ ...inputStyle, resize: "vertical" }} aria-label="介紹" />
          </div>

          <div>
            <div style={label}>配幾張照片（最多 {STORY_PHOTOS_MAX} 張，可不放）</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {photos.map((p, i) => (
                <div key={p.path} style={{ position: "relative" }}>
                  <img src={p.preview} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12 }} />
                  <button
                    type="button"
                    onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                    aria-label="拿掉這張照片"
                    style={{ position: "absolute", top: -8, right: -8, width: 32, height: 32, borderRadius: 999, border: "none", background: "var(--ink-1)", color: "#fff", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {photos.length < STORY_PHOTOS_MAX && (
                <label style={{
                  width: 96, height: 96, borderRadius: 12, border: "2px dashed var(--line-strong)", display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer",
                  color: "var(--ink-2)", fontSize: "var(--fs-xs)", position: "relative",
                }}>
                  <input type="file" accept="image/*" onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
                  <span style={{ fontSize: 28 }} aria-hidden="true">🖼️</span>
                  {photoBusy ? "傳送中…" : "加照片"}
                </label>
              )}
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--fs-base)", padding: "8px 0" }}>
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} style={{ width: 24, height: 24 }} />
            給家人聽（他們可以按讚、留言）
          </label>

          <button type="button" className="btn-primary" onClick={save} disabled={Boolean(saving) || photoBusy} style={{ width: "100%", minHeight: 56 }}>
            {saving ?? "💾 存進我的故事集"}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onCancel}
        disabled={Boolean(saving)}
        style={{ alignSelf: "center", padding: "8px 14px", minHeight: 44, borderRadius: 999, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--ink-1)", fontSize: "var(--fs-sm)", cursor: "pointer" }}
      >
        先不要
      </button>
    </div>
  );
}
