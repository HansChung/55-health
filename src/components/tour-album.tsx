"use client";

// ────────────────────────────────────────────────
// 研學團共享相簿（研學團內頁）：同一團的人一起放照片，點開看大圖；自己的可以刪
// 「🎬 做成研學團遊記」：從相簿挑照片做成一支影片（和年度回憶影片同一個畫面），放在自己的出遊回憶影片
// 不是這一團的人：伺服器回 404，這一塊就不顯示
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { compressImage } from "@/lib/image-utils";
import { stagePhoto } from "@/lib/direct-upload";
import { YearlyComposer } from "@/components/yearly-composer";
import { TOUR_ALBUM_BATCH, type TourAlbumPhoto, type TourAlbumView } from "@/lib/tour-album";

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 80, background: "var(--bg)", overflowY: "auto",
  padding: "16px 16px 40px",
};

export function TourAlbum({
  tourId,
  tourTitle,
  started,
  onOpenVideos,
}: {
  tourId: string;
  tourTitle: string;
  /** 出發了才顯示「做成遊記」 */
  started: boolean;
  /** 做好之後去「出遊回憶影片」看 */
  onOpenVideos?: () => void;
}) {
  const toast = useToast();
  const [album, setAlbum] = useState<TourAlbumView | null>(null);
  const [hidden, setHidden] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [viewing, setViewing] = useState<TourAlbumPhoto | null>(null);
  const [composing, setComposing] = useState(false);
  const [pendingVideo, setPendingVideo] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    api.tourAlbum(tourId)
      .then((r) => { if (alive) setAlbum(r.album); })
      .catch(() => { if (alive) setHidden(true); }); // 不是這一團的人、還沒跑 SQL：不顯示
    return () => { alive = false; };
  }, [tourId]);

  if (hidden || !album) return null;

  const upload = async (files: File[]) => {
    const room = Math.min(TOUR_ALBUM_BATCH, album.my_remaining);
    if (room <= 0) {
      toast.info("你在這一團放的照片已經滿了，可以先刪幾張");
      return;
    }
    const list = files.slice(0, room);
    if (files.length > room) toast.info(`一次最多放 ${room} 張，先放前 ${room} 張`);
    setUploading({ done: 0, total: list.length });
    let ok = 0;
    for (const [i, file] of list.entries()) {
      try {
        const dataUrl = await compressImage(file, { maxSide: 1600, quality: 0.85 });
        const [path, size] = await Promise.all([stagePhoto(dataUrl), imageSize(dataUrl)]);
        if (!path) throw new Error("upload failed");
        const res = await api.addTourAlbumPhoto(tourId, { photoPath: path, ...size });
        setAlbum(res.album);
        ok++;
      } catch (e) {
        toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "有一張照片放不上去，請再試一次");
        if (e instanceof ApiError && (e.status === 403 || e.status === 429)) break;
      }
      setUploading({ done: i + 1, total: list.length });
    }
    setUploading(null);
    if (ok) {
      trackEvent("tour_album_upload", { photos: ok });
      toast.success(`放好了 ${ok} 張，同團的人都看得到`);
    }
  };

  const remove = async (p: TourAlbumPhoto) => {
    if (!confirm(p.mine ? "刪掉這張照片？" : `刪掉 ${p.uploader} 放的這張照片？（管理員）`)) return;
    try {
      const res = await api.deleteTourAlbumPhoto(tourId, p.id);
      setAlbum(res.album);
      setViewing(null);
    } catch (e) {
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "沒刪成功，請再試一次");
    }
  };

  return (
    <section style={{ marginTop: 24 }} aria-label="團體相簿">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>📸 團體相簿</div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>{album.photos.length} 張</div>
      </div>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "6px 0 12px", lineHeight: 1.5 }}>
        同一團的人都看得到，一起把今天的照片放進來
      </div>

      {album.photos.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {album.photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setViewing(p)}
              aria-label={`${p.uploader} 放的照片`}
              style={{ padding: 0, border: "none", borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: "var(--bg-deep)", position: "relative", cursor: "pointer" }}
            >
              <img src={p.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{
                position: "absolute", left: 0, right: 0, bottom: 0, padding: "2px 4px", fontSize: 11, color: "#fff",
                background: "rgba(0,0,0,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {p.mine ? "我" : p.uploader}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-2)", lineHeight: 1.6 }}>
          {album.can_upload ? "還沒有照片，放第一張吧！" : "出發當天就可以開始放照片"}
        </div>
      )}

      {album.can_upload && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length) void upload(files);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={Boolean(uploading) || album.my_remaining <= 0}
            className="btn-ghost"
            style={{ width: "100%", marginTop: 12 }}
          >
            {uploading ? `放上去中… ${uploading.done}／${uploading.total}` : album.my_remaining <= 0 ? "你放的照片已經滿了" : "➕ 放照片進相簿"}
          </button>
        </>
      )}

      {started && album.photos.length >= 3 && (
        <button onClick={() => setComposing(true)} className="btn-primary" style={{ width: "100%", marginTop: 10 }}>
          🎬 做成研學團遊記影片
        </button>
      )}

      {viewing && typeof document !== "undefined" && createPortal(
        <div role="dialog" aria-modal="true" aria-label="照片" onClick={() => setViewing(null)} style={{
          position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.88)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, gap: 12,
        }}>
          <img src={viewing.url} alt="" style={{ maxWidth: "100%", maxHeight: "75dvh", objectFit: "contain", borderRadius: 8 }} />
          <div style={{ color: "#fff", fontSize: "var(--fs-base)" }}>{viewing.mine ? "我放的" : `${viewing.uploader} 放的`}</div>
          <div style={{ display: "flex", gap: 10 }} onClick={(e) => e.stopPropagation()}>
            {viewing.can_delete && (
              <button onClick={() => remove(viewing)} className="btn-ghost" style={{ background: "#fff" }}>🗑️ 刪掉</button>
            )}
            <button onClick={() => setViewing(null)} className="btn-ghost" style={{ background: "#fff" }}>關閉</button>
          </div>
        </div>,
        document.body
      )}

      {composing && typeof document !== "undefined" && createPortal(
        <div role="dialog" aria-modal="true" aria-label="做成研學團遊記影片" style={overlay}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <button onClick={() => setComposing(false)} aria-label="關閉" className="btn-ghost" style={{ minWidth: 48 }}>✕</button>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>🎬 研學團遊記影片</div>
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
            從團體相簿挑照片，做成有字幕、有配樂的影片，會放在你的「出遊回憶影片」裡。
          </div>
          <YearlyComposer
            tour={{ id: tourId, title: tourTitle }}
            pendingYearly={pendingVideo}
            onCreated={() => {
              setPendingVideo(true);
              setComposing(false);
              toast.success("開始做了！做好會通知你，到「出遊回憶影片」就看得到");
              trackEvent("tour_video_created");
            }}
          />
          {onOpenVideos && (
            <button onClick={() => { setComposing(false); onOpenVideos(); }} className="btn-ghost" style={{ width: "100%", marginTop: 14 }}>
              🎬 看我的出遊回憶影片
            </button>
          )}
        </div>,
        document.body
      )}
    </section>
  );
}
