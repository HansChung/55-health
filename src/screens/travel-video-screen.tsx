"use client";

// ────────────────────────────────────────────────
// 出遊回憶影片：拍一張出遊照片 → AI（MiniMax 海螺 H3）做成 10 秒小影片 → 分享給家人
// ────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { api, ApiError } from "@/lib/api-client";
import { compressImage } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { enableWebPush, hasWebPushSubscription, isWebPushSupported } from "@/lib/push/client";
import {
  TRAVEL_VIDEO_DURATION_SECONDS,
  TRAVEL_VIDEO_PLACE_MAX,
  TRAVEL_VIDEO_STYLES,
  checkVideoImageSize,
  isTravelVideoPending,
  type TravelVideo,
  type TravelVideoQuota,
  type TravelVideoStatus,
  type TravelVideoStyleId,
} from "@/lib/travel-video";

const POLL_MS = 10_000;

interface TravelVideoScreenProps {
  onBack: () => void;
}

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const hiddenInput: React.CSSProperties = {
  position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none",
};

const pickButton: React.CSSProperties = {
  position: "relative",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: 6, padding: "20px 12px", minHeight: 110,
  background: "var(--surface)", border: "2px solid var(--line)", borderRadius: "var(--r-md)",
  fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", margin: "24px 0 12px",
};

export function TravelVideoScreen({ onBack }: TravelVideoScreenProps) {
  const toast = useToast();
  const [videos, setVideos] = useState<TravelVideo[]>([]);
  const [quota, setQuota] = useState<TravelVideoQuota | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const [photo, setPhoto] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [style, setStyle] = useState<TravelVideoStyleId>("gentle");
  const [place, setPlace] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pushOffer, setPushOffer] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  // 記住上次看到的狀態，影片「剛做好」時跳提示
  const lastStatus = useRef<Record<string, TravelVideoStatus>>({});

  const reload = useCallback(async () => {
    try {
      const res = await api.listTravelVideos();
      for (const v of res.videos) {
        const before = lastStatus.current[v.id];
        if (before && isTravelVideoPending(before)) {
          if (v.status === "succeeded") toast.success("影片做好了！可以播放、分享給家人");
          else if (v.status === "failed") toast.info("有一支影片沒做成功，不會扣次數，換張照片再試試");
        }
        lastStatus.current[v.id] = v.status;
      }
      setVideos(res.videos);
      setQuota(res.quota);
      setEnabled(res.enabled);
    } catch (e) {
      console.warn("[travel-video] list failed:", e);
    } finally {
      setLoading(false);
      setTick((t) => t + 1);
    }
  }, [toast]);

  useEffect(() => { reload(); }, [reload]);

  // 這台裝置還沒開推播 → 提供「做好時通知我」
  useEffect(() => {
    if (!isWebPushSupported() || Notification.permission === "denied") return;
    let cancelled = false;
    Promise.all([api.getVapidPublicKey(), hasWebPushSubscription()])
      .then(([vapid, subscribed]) => {
        if (!cancelled) setPushOffer(Boolean(vapid.configured && vapid.publicKey) && !subscribed);
      })
      .catch(() => { /* 查不到就不顯示 */ });
    return () => { cancelled = true; };
  }, []);

  const hasPending = videos.some((v) => isTravelVideoPending(v.status));

  // 有影片在做 → 上一次查完後過 10 秒再查（不會疊加請求）
  useEffect(() => {
    if (!hasPending) return;
    const t = setTimeout(reload, POLL_MS);
    return () => clearTimeout(t);
  }, [hasPending, tick, reload]);

  const unlimited = (quota?.limit ?? 0) >= 9999;
  const remaining = quota ? Math.max(0, quota.limit - quota.used) : null;

  const blockedReason = !enabled
    ? "影片功能還在準備中，請稍後再來"
    : remaining === 0 && !unlimited
      ? "本月的影片次數用完了，下個月再來做吧"
      : hasPending
        ? "上一支影片還在做，做好再做下一支"
        : !photo
          ? "先選一張照片喔"
          : null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同一張可以再選一次
    if (!file) return;
    setPreparing(true);
    try {
      const dataUrl = await compressImage(file);
      const { width, height } = await imageSize(dataUrl);
      const check = checkVideoImageSize(width, height);
      if (!check.ok) {
        toast.error(
          check.reason === "too_small"
            ? "這張照片太小了，換一張清楚一點的"
            : "這張照片太長或太寬了，換一張一般比例的照片"
        );
        return;
      }
      setPhoto(dataUrl);
    } catch (err) {
      console.warn("[travel-video] photo prepare failed:", err);
      toast.error("照片讀不出來，換一張試試（建議用 JPG）");
    } finally {
      setPreparing(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo || submitting || blockedReason) return;
    setSubmitting(true);
    try {
      const res = await api.createTravelVideo({
        image: photo,
        style,
        place: place.trim() || undefined,
      });
      trackEvent("travel_video_create", { style });
      lastStatus.current[res.video.id] = res.video.status;
      setVideos((prev) => [res.video, ...prev]);
      setQuota(res.quota);
      setPhoto(null);
      setPlace("");
      toast.success("開始做影片了！通常要 5～60 分鐘，可以先去做別的事");
    } catch (e) {
      toast.error(
        e instanceof ApiError && !e.isNetwork
          ? e.message
          : "網路不穩，影片可能沒送出去，請看下面清單再決定要不要重做"
      );
      reload();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnablePush = async () => {
    setPushBusy(true);
    try {
      await enableWebPush();
      setPushOffer(false);
      trackEvent("travel_video_push_enabled");
      toast.success("已開啟通知，影片做好會提醒你");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "開啟通知沒成功，請再試一次");
      setPushBusy(false);
      return;
    }
    // 同步「提醒通知」頁的開關（notification_settings 是整包覆蓋 → 先讀再合併）；失敗不影響推播
    try {
      const { profile } = await api.getProfile();
      await api.updateProfile({
        notification_settings: { ...(profile.notification_settings ?? {}), web_push: { on: true } },
      });
    } catch (e) {
      console.warn("[travel-video] sync web_push setting failed:", e);
    }
    setPushBusy(false);
  };

  const handleShare = async (v: TravelVideo) => {
    if (!v.video_url) return;
    const text = `我用暖暖做了一支出遊回憶影片${v.place ? `（${v.place}）` : ""}，給你看看！`;
    trackEvent("travel_video_share", { style: v.style });
    try {
      if (navigator.share) {
        await navigator.share({ title: "出遊回憶影片", text, url: v.video_url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${v.video_url}`);
      toast.success("已複製影片連結，可以貼到 LINE 給家人");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // 自己取消分享
      toast.error("分享沒成功，可以改用「存到手機」再傳給家人");
    }
  };

  const handleDelete = async (v: TravelVideo) => {
    if (!confirm("確定要刪除這支影片？刪除後就找不回來了")) return;
    setDeletingId(v.id);
    try {
      await api.deleteTravelVideo(v.id);
      setVideos((prev) => prev.filter((x) => x.id !== v.id));
    } catch (e) {
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "刪除沒成功，請再試一次");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SubPage
      title="出遊回憶影片"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBEFE3 0%, transparent 100%)"
    >
      {/* 說明 + 配額 */}
      <div style={{
        background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
        borderRadius: "var(--r-lg)", padding: 16, display: "flex", gap: 12, alignItems: "center",
      }}>
        <Mascot size={60} mood="excited" />
        <div style={{ flex: 1, fontSize: "var(--fs-sm)", color: "var(--ink-1)", lineHeight: 1.5 }}>
          拍一張出遊的照片，暖暖幫你變成 <strong>{TRAVEL_VIDEO_DURATION_SECONDS} 秒小影片</strong>，傳給家人一起看！
          {quota && (
            <div style={{ marginTop: 6, fontWeight: 700, color: "var(--primary-deep)" }}>
              {unlimited ? "管理員不限次數" : `本月還可以做 ${remaining} 支（共 ${quota.limit} 支）`}
            </div>
          )}
        </div>
      </div>

      {/* ① 選照片 */}
      <div style={sectionTitle}>① 選一張照片</div>
      {preparing ? (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-2)", fontSize: "var(--fs-sm)" }}>
          照片處理中…
        </div>
      ) : photo ? (
        <div style={{ position: "relative" }}>
          <img
            src={photo}
            alt="要做成影片的照片"
            style={{
              width: "100%", maxHeight: 320, objectFit: "contain", display: "block",
              background: "var(--bg-deep)", borderRadius: "var(--r-lg)",
            }}
          />
          <button
            onClick={() => setPhoto(null)}
            className="btn-ghost"
            style={{ position: "absolute", right: 10, bottom: 10, minHeight: 48, padding: "8px 18px", fontSize: "var(--fs-sm)" }}
          >
            換一張
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* 用 label 包住 input 才能在 iOS Safari 穩定觸發 */}
          <label style={pickButton}>
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={hiddenInput} />
            <span style={{ fontSize: 36 }} aria-hidden="true">📷</span>
            現在拍一張
          </label>
          <label style={pickButton}>
            <input type="file" accept="image/*" onChange={handleFile} style={hiddenInput} />
            <span style={{ fontSize: 36 }} aria-hidden="true">🖼️</span>
            從相簿選
          </label>
        </div>
      )}

      {/* ② 選風格 */}
      <div style={sectionTitle}>② 想要什麼感覺？</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {TRAVEL_VIDEO_STYLES.map((s) => {
          const active = s.id === style;
          return (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              aria-pressed={active}
              style={{
                textAlign: "left", padding: 14, borderRadius: "var(--r-md)",
                background: active ? "var(--primary-soft)" : "var(--surface)",
                border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 30 }} aria-hidden="true">{s.emoji}</div>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)" }}>{s.label}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* ③ 地點 */}
      <label htmlFor="travel-place" style={{ ...sectionTitle, display: "block" }}>
        ③ 在哪裡拍的？<span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（可以不填）</span>
      </label>
      <input
        id="travel-place"
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        maxLength={TRAVEL_VIDEO_PLACE_MAX}
        placeholder="例如：日月潭、阿里山"
        style={{
          width: "100%", padding: "16px 18px", fontSize: "var(--fs-base)",
          borderRadius: "var(--r-md)", border: "2px solid var(--line)", background: "var(--surface)",
          color: "var(--ink-1)", boxSizing: "border-box",
        }}
      />

      {/* 送出 */}
      <button
        onClick={handleSubmit}
        disabled={Boolean(blockedReason) || submitting}
        className="btn-primary"
        style={{
          width: "100%", marginTop: 24,
          opacity: blockedReason || submitting ? 0.5 : 1,
          cursor: blockedReason || submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "送出中…" : "🎬 開始做影片"}
      </button>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
        {blockedReason ?? "通常要 5～60 分鐘，可以先去做別的事，回來打開這頁就看得到"}
        <br />
        照片會傳送給 AI 影片服務（邁笙平台／MiniMax）製作影片；AI 做的動作不一定完美，不滿意可以換張照片再做
      </div>

      {/* 做好時通知我 */}
      {pushOffer && (
        <div style={{
          marginTop: 24, padding: 16, borderRadius: "var(--r-lg)",
          background: "var(--gold-soft)", display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-1)", lineHeight: 1.5 }}>
            <span aria-hidden="true">🔔 </span>
            影片要等一陣子。<strong>開啟通知</strong>，做好時手機會跳出提醒，不用一直守著。
          </div>
          <button
            onClick={handleEnablePush}
            disabled={pushBusy}
            className="btn-ghost"
            style={{ width: "100%", boxSizing: "border-box", opacity: pushBusy ? 0.6 : 1 }}
          >
            {pushBusy ? "設定中…" : "開啟通知"}
          </button>
        </div>
      )}

      {/* 我的影片 */}
      <div style={{ ...sectionTitle, marginTop: 32 }}>我的影片</div>
      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--ink-2)", fontSize: "var(--fs-sm)" }}>載入中…</div>
      ) : videos.length === 0 ? (
        <div style={{
          background: "var(--surface)", borderRadius: "var(--r-lg)", padding: 24,
          textAlign: "center", border: "1px dashed var(--line-strong)",
          fontSize: "var(--fs-sm)", color: "var(--ink-2)",
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }} aria-hidden="true">🎞️</div>
          還沒有影片，選張出遊照片做第一支吧！
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {videos.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              deleting={deletingId === v.id}
              onShare={() => handleShare(v)}
              onDelete={() => handleDelete(v)}
            />
          ))}
        </div>
      )}
    </SubPage>
  );
}

function VideoCard({
  video: v, deleting, onShare, onDelete,
}: {
  video: TravelVideo;
  deleting: boolean;
  onShare: () => void;
  onDelete: () => void;
}) {
  const styleMeta = TRAVEL_VIDEO_STYLES.find((s) => s.id === v.style);
  const pending = isTravelVideoPending(v.status);

  return (
    <div className="card" style={{ padding: 14 }}>
      {v.status === "succeeded" && v.video_url ? (
        <video
          src={v.video_url}
          poster={v.photo_url ?? undefined}
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", maxHeight: 420, borderRadius: "var(--r-md)", background: "#000", display: "block" }}
        />
      ) : (
        <div style={{ position: "relative", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--bg-deep)" }}>
          {v.photo_url && (
            <img
              src={v.photo_url}
              alt=""
              loading="lazy"
              style={{
                width: "100%", maxHeight: 260, objectFit: "cover", display: "block",
                filter: pending ? "brightness(0.6)" : "grayscale(1) brightness(0.8)",
              }}
            />
          )}
          <div style={{
            position: v.photo_url ? "absolute" : "static", inset: 0, padding: 16,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 10, textAlign: "center", color: v.photo_url ? "#fff" : "var(--ink-1)",
            fontSize: "var(--fs-sm)", fontWeight: 700,
          }}>
            {pending ? (
              <>
                <div
                  aria-hidden="true"
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    border: "4px solid rgba(255,255,255,0.35)", borderTopColor: "#fff",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <div role="status">暖暖正在做影片…</div>
                <div style={{ fontWeight: 500, fontSize: "var(--fs-xs)" }}>通常要 5～60 分鐘，可以先去做別的事</div>
              </>
            ) : (
              <div role="status">這支沒做成功（不會扣次數）<br />換張照片再試試</div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
        <span aria-hidden="true">{styleMeta?.emoji ?? "🎬"}</span>
        <span style={{ fontWeight: 700, color: "var(--ink-1)" }}>{v.place || styleMeta?.label || "出遊影片"}</span>
        <span style={{ marginLeft: "auto", fontSize: "var(--fs-xs)" }}>{formatWhen(v.created_at)}</span>
      </div>

      {v.status === "succeeded" && v.video_url && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <button onClick={onShare} className="btn-primary" style={{ width: "100%", fontSize: "var(--fs-base)", minHeight: 56 }}>
            📤 分享給家人
          </button>
          <a
            href={v.download_url ?? v.video_url}
            className="btn-ghost"
            style={{ width: "100%", boxSizing: "border-box", textDecoration: "none" }}
          >
            ⬇️ 存到手機
          </a>
        </div>
      )}

      {!pending && (
        <button
          onClick={onDelete}
          disabled={deleting}
          style={{
            display: "block", margin: "12px auto 0", padding: "8px 16px", minHeight: 44,
            background: "transparent", border: "none", color: "var(--ink-3)",
            fontSize: "var(--fs-sm)", cursor: "pointer",
          }}
        >
          {deleting ? "刪除中…" : "🗑️ 刪除這支影片"}
        </button>
      )}
    </div>
  );
}
