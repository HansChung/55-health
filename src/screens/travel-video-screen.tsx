"use client";

// ────────────────────────────────────────────────
// 出遊回憶影片：拍一張出遊照片 → AI（MiniMax 海螺 H3）做成小影片 → 分享給家人
// 可選口白＋字幕：AI 配音念一句遊記（女聲／男聲），字幕照原句燒進影片
// ────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { videoPhotoPayload } from "@/lib/direct-upload";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { api, ApiError } from "@/lib/api-client";
import { compressImage } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { enableWebPush, hasWebPushSubscription, isWebPushSupported } from "@/lib/push/client";
import { TravelMontageForm } from "@/components/travel-montage-form";
import { VideoComments } from "@/components/video-comments";
import { MvComposerSheet } from "@/components/mv-composer-sheet";
import { DictationButton } from "@/components/dictation-button";
import { appendDictation } from "@/lib/dictation";
import { publicAppOrigin } from "@/lib/study-tours";
import { NarrationVoicePicker, myVoiceReady } from "@/components/narration-voice-picker";
import { MyVoiceSheet } from "@/components/my-voice-sheet";
import {
  DEFAULT_NARRATION_ACCENT,
  MY_VOICE,
  NARRATION_MAX_CHARS,
  TRAVEL_VIDEO_DURATION_SECONDS,
  TRAVEL_VIDEO_PLACE_MAX,
  TRAVEL_VIDEO_STYLES,
  checkVideoImageSize,
  isTravelVideoPending,
  montageProgressLabel,
  mvProgressLabel,
  sanitizeNarration,
  videoSharePath,
  type MyVoiceStatus,
  type NarrationAccentId,
  type NarrationVoiceChoice,
  type TravelNarration,
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

function choiceButton(active: boolean): React.CSSProperties {
  return {
    padding: "14px 10px", minHeight: 60, borderRadius: "var(--r-md)",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
  };
}

const sectionTitle: React.CSSProperties = {
  fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", margin: "24px 0 12px",
};

export function TravelVideoScreen({ onBack }: TravelVideoScreenProps) {
  const toast = useToast();
  const [videos, setVideos] = useState<TravelVideo[]>([]);
  const [quota, setQuota] = useState<TravelVideoQuota | null>(null);
  const [montageQuota, setMontageQuota] = useState<TravelVideoQuota | null>(null);
  // 遊記 MV（專業版）：額度、正在幫哪一支遊記做 MV
  const [mvQuota, setMvQuota] = useState<TravelVideoQuota | null>(null);
  const [mvFor, setMvFor] = useState<TravelVideo | null>(null);
  // 一張照片（AI 影片平台做動畫）／多張照片遊記（自己伺服器做）
  const [mode, setMode] = useState<"single" | "montage" | "mv">("single");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const [photo, setPhoto] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [style, setStyle] = useState<TravelVideoStyleId>("gentle");
  const [place, setPlace] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<"narration" | "video" | null>(null);

  // 口白＋字幕
  const [withNarration, setWithNarration] = useState(false);
  const [voice, setVoice] = useState<NarrationVoiceChoice>("female");
  const [accent, setAccent] = useState<NarrationAccentId>(DEFAULT_NARRATION_ACCENT);
  // 遊記表單的聲音／口音（放這層：錄好「我的聲音」時可以直接幫它選好）
  const [montageVoice, setMontageVoice] = useState<NarrationVoiceChoice>("female");
  const [montageAccent, setMontageAccent] = useState<NarrationAccentId>(DEFAULT_NARRATION_ACCENT);
  // 我的聲音（專業版）：null＝還在查；sheetFor＝從哪個表單打開錄音畫面
  const [myVoice, setMyVoice] = useState<MyVoiceStatus | null>(null);
  const [sheetFor, setSheetFor] = useState<"single" | "montage" | null>(null);
  const [script, setScript] = useState("");
  const [writing, setWriting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<TravelNarration | null>(null);
  // 改了字、換聲音或口音，試聽就要重來（我的聲音沒有口音）
  const previewMatches = Boolean(
    preview &&
      preview.voice === voice &&
      (voice === MY_VOICE || preview.accent === accent) &&
      preview.text === sanitizeNarration(script)
  );
  const submittingRef = useRef(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pushOffer, setPushOffer] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  // 記住上次看到的狀態，影片「剛做好」時跳提示
  const lastStatus = useRef<Record<string, TravelVideoStatus>>({});

  const reload = useCallback(async (): Promise<TravelVideo[] | null> => {
    try {
      const res = await api.listTravelVideos();
      for (const v of res.videos) {
        const before = lastStatus.current[v.id];
        if (before && isTravelVideoPending(before)) {
          const montage = v.kind === "montage";
          if (v.status === "succeeded") {
            toast.success(
              v.kind === "mv"
                ? "MV 做好了！可以播放、分享給家人"
                : montage
                  ? "遊記影片做好了！可以播放、分享給家人"
                  : "影片做好了！可以播放、分享給家人"
            );
          }
          else if (v.status === "failed") {
            toast.info(
              v.kind === "mv"
                ? "有一支 MV 沒做成功，不會扣次數，請再做一次"
                : montage
                  ? "有一支遊記沒做成功，不會扣次數，請再做一次"
                  : "有一支影片沒做成功，不會扣次數，換張照片再試試"
            );
          }
        }
        lastStatus.current[v.id] = v.status;
      }
      setVideos(res.videos);
      setQuota(res.quota);
      setMontageQuota(res.montage_quota ?? null);
      setMvQuota(res.mv_quota ?? null);
      setEnabled(res.enabled);
      return res.videos;
    } catch (e) {
      console.warn("[travel-video] list failed:", e);
      return null;
    } finally {
      setLoading(false);
      setTick((t) => t + 1);
    }
  }, [toast]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    let cancelled = false;
    api.getMyVoice()
      .then((res) => { if (!cancelled) setMyVoice(res.status); })
      .catch(() => { if (!cancelled) setMyVoice({ allowed: false, voice: null, remaining: 0 }); });
    return () => { cancelled = true; };
  }, []);

  const handleMyVoiceChanged = (status: MyVoiceStatus, ready: boolean) => {
    setMyVoice(status);
    // 聲音換了（重錄／刪除）：用舊聲音做的試聽不能再拿去做影片
    setPreview((p) => (p?.voice === MY_VOICE ? null : p));
    if (ready) {
      // 剛錄好：直接幫打開錄音畫面的那個表單選「我的聲音」
      if (sheetFor === "montage") setMontageVoice(MY_VOICE);
      else setVoice(MY_VOICE);
      setSheetFor(null);
    }
    // 刪掉了：選著「我的聲音」的表單改回阿嬤
    if (!myVoiceReady(status)) {
      setVoice((v) => (v === MY_VOICE ? "female" : v));
      setMontageVoice((v) => (v === MY_VOICE ? "female" : v));
    }
  };

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
  // 單張影片和遊記各自一次一支（遊記在做時，一樣可以做單張影片）
  const singlePending = videos.some((v) => v.kind === "single" && isTravelVideoPending(v.status));
  const montagePending = videos.some((v) => v.kind === "montage" && isTravelVideoPending(v.status));
  const montageUnlimited = (montageQuota?.limit ?? 0) >= 9999;
  const montageRemaining = montageQuota ? Math.max(0, montageQuota.limit - montageQuota.used) : null;
  const montageBlocked = !enabled
    ? "遊記影片還在準備中，請稍後再來"
    : montageQuota && montageQuota.limit === 0
      ? "升級方案就可以做遊記影片喔"
      : montageRemaining === 0 && !montageUnlimited
        ? "本月的遊記影片次數用完了，下個月再來做吧"
        : montagePending
          ? "上一支遊記還在做，做好再做下一支"
          : null;

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
      : singlePending
        ? "上一支影片還在做，做好再做下一支"
        : !photo
          ? "先選一張照片喔"
          : withNarration && !sanitizeNarration(script)
            ? "先寫一句口白，或選「不用口白」"
            : null;

  const friendlyError = (e: unknown, fallback: string) =>
    e instanceof ApiError && !e.isNetwork && !/^HTTP \d+$/.test(e.message) ? e.message : fallback;

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

  const handleWriteScript = async () => {
    if (!photo || writing) return;
    setWriting(true);
    try {
      // 照片直傳 Supabase 一次，寫口白、送出做影片都用同一個路徑
      const res = await api.writeTravelNarration({ ...(await videoPhotoPayload(photo)), style, place: place.trim() || undefined });
      setScript(res.text);
      trackEvent("travel_video_script_ai");
    } catch (e) {
      toast.error(friendlyError(e, "AI 這次沒寫出來，請自己寫一句或再按一次"));
    } finally {
      setWriting(false);
    }
  };

  /** 產生口白配音（試聽或送出前）；失敗會丟錯 */
  const requestNarration = async (): Promise<TravelNarration> => {
    const res = await api.createTravelNarration({ text: script, voice, accent: voice === MY_VOICE ? undefined : accent });
    setPreview(res.narration);
    return res.narration;
  };

  const handlePreview = async () => {
    if (!sanitizeNarration(script) || previewing) return;
    setPreviewing(true);
    try {
      await requestNarration();
      trackEvent("travel_video_narration_preview", { voice, accent: voice === MY_VOICE ? null : accent });
    } catch (e) {
      toast.error(friendlyError(e, "配音暫時沒成功，請再試一次"));
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    // 用 ref 擋連點：state 要等下一次 render 才更新，快速點兩下會送出兩次
    if (!photo || submittingRef.current || blockedReason) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      let narration: TravelNarration | null = null;
      if (withNarration) {
        setSubmitPhase("narration");
        narration = previewMatches && preview ? preview : await requestNarration();
      }
      setSubmitPhase("video");
      const res = await api.createTravelVideo({
        ...(await videoPhotoPayload(photo)),
        style,
        place: place.trim() || undefined,
        narration: narration
          ? {
              id: narration.id,
              voice: narration.voice,
              accent: narration.voice === MY_VOICE ? undefined : narration.accent,
              text: narration.text,
            }
          : undefined,
      });
      trackEvent("travel_video_create", { style, narration: Boolean(narration), voice: narration?.voice });
      lastStatus.current[res.video.id] = res.video.status;
      setVideos((prev) => [res.video, ...prev]);
      setQuota(res.quota);
      setPhoto(null);
      setPlace("");
      setScript("");
      setPreview(null);
      toast.success("開始做影片了！通常要 5～60 分鐘，可以先去做別的事");
    } catch (e) {
      // 斷線／逾時時伺服器可能已經建好任務 → 先看清單，多了一支製作中的就當作送出成功，避免重送重複付費
      const known = new Set(videos.map((v) => v.id));
      const latest = await reload();
      if (latest?.some((v) => isTravelVideoPending(v.status) && !known.has(v.id))) {
        setPhoto(null);
        setPlace("");
        toast.info("影片已經送出，正在製作中，不用再送一次");
        return;
      }
      toast.error(friendlyError(e, "網路不穩，影片沒送出去，請再試一次"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setSubmitPhase(null);
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
    const kindLabel = v.kind === "montage" ? "遊記影片" : "出遊回憶影片";
    const text = `我用暖暖做了一支${kindLabel}${v.place ? `（${v.place}）` : ""}，給你看看！`;
    // 分享頁（LINE 會顯示縮圖和標題，打開就能播放；家人還能按讚留言）。App 裡 origin 是 localhost → 用正式網址
    const url = `${publicAppOrigin(process.env.NEXT_PUBLIC_APP_URL, window.location.origin)}${videoSharePath(v.id)}`;
    trackEvent("travel_video_share", { style: v.style, kind: v.kind });
    try {
      if (navigator.share) {
        await navigator.share({ title: kindLabel, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("已複製影片連結，可以貼到 LINE 給家人");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // 自己取消分享
      toast.error("分享沒成功，可以改用「存到手機」再傳給家人");
    }
  };

  const [altBusyId, setAltBusyId] = useState<string | null>(null);
  const handleAltVersion = async (v: TravelVideo) => {
    if (altBusyId) return;
    setAltBusyId(v.id);
    try {
      const { video } = await api.createMvAltVersion(v.id);
      lastStatus.current[video.id] = video.status;
      setVideos((prev) => [
        video,
        ...prev.map((x) => (x.id === v.id && x.mv ? { ...x, mv: { ...x.mv, alt_available: false } } : x)),
      ]);
      toast.success("開始做另一個版本了！原本那支會留著，做好會通知你");
    } catch (e) {
      toast.error(friendlyError(e, "另一個版本沒做成，請再試一次"));
    } finally {
      setAltBusyId(null);
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
          {mode === "single" ? (
            <>拍一張出遊的照片，暖暖幫你變成 <strong>{TRAVEL_VIDEO_DURATION_SECONDS} 秒小影片</strong>，傳給家人一起看！</>
          ) : mode === "montage" ? (
            <>選幾張出遊照片，暖暖做成<strong>有配音、有字幕的遊記影片</strong>，照片會慢慢移動！</>
          ) : (
            <>把做好的遊記寫成<strong>一首歌</strong>（國語、台語都可以），配上遊記的照片做成 2～3 分鐘的 MV！</>
          )}
          {mode === "single" && quota && (
            <div style={{ marginTop: 6, fontWeight: 700, color: "var(--primary-deep)" }}>
              {unlimited ? "管理員不限次數" : `本月還可以做 ${remaining} 支（共 ${quota.limit} 支）`}
            </div>
          )}
          {mode === "mv" && mvQuota && (
            <div style={{ marginTop: 6, fontWeight: 700, color: "var(--primary-deep)" }}>
              {mvQuota.limit === 0
                ? "專業版功能（每月 6 首）"
                : mvQuota.limit >= 9999
                  ? "管理員不限次數"
                  : `本月還可以做 ${Math.max(0, mvQuota.limit - mvQuota.used)} 首（共 ${mvQuota.limit} 首）`}
            </div>
          )}
          {mode === "montage" && montageQuota && montageQuota.limit > 0 && (
            <div style={{ marginTop: 6, fontWeight: 700, color: "var(--primary-deep)" }}>
              {montageUnlimited ? "管理員不限次數" : `本月還可以做 ${montageRemaining} 支遊記（共 ${montageQuota.limit} 支）`}
            </div>
          )}
        </div>
      </div>

      {/* 一張／多張 */}
      <div role="tablist" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
        {([
          { id: "single", emoji: "🎬", label: "一張照片", desc: "照片動起來" },
          { id: "montage", emoji: "📚", label: "多張照片", desc: "做成遊記" },
          { id: "mv", emoji: "🎵", label: "做 MV", desc: "遊記寫成歌" },
        ] as const).map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            style={{
              ...choiceButton(mode === m.id),
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "12px 4px",
            }}
          >
            <span style={{ fontSize: 28 }} aria-hidden="true">{m.emoji}</span>
            {/* 手機上三格並排：字小一號、不斷行 */}
            <span style={{ fontSize: "var(--fs-sm)", whiteSpace: "nowrap" }}>{m.label}</span>
            <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--ink-2)" }}>{m.desc}</span>
          </button>
        ))}
      </div>

      {mode === "mv" ? (
        <MvPicker
          montages={videos.filter((v) => v.kind === "montage" && v.status === "succeeded" && v.video_url)}
          onPick={(v) => setMvFor(v)}
          onMakeMontage={() => setMode("montage")}
        />
      ) : mode === "montage" ? (
        <TravelMontageForm
          blockedReason={montageBlocked}
          knownIds={videos.map((v) => v.id)}
          reloadVideos={reload}
          onCreated={(video, q) => {
            lastStatus.current[video.id] = video.status;
            setVideos((prev) => [video, ...prev]);
            setMontageQuota(q);
          }}
          voice={montageVoice}
          accent={montageAccent}
          onVoice={setMontageVoice}
          onAccent={setMontageAccent}
          myVoice={myVoice}
          onSetupMyVoice={() => setSheetFor("montage")}
        />
      ) : (
      <>
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

      {/* ④ 口白＋字幕 */}
      <div style={sectionTitle}>
        ④ 加上口白和字幕？<span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>（可以不要）</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { on: false, emoji: "🔇", label: "不用口白" },
          { on: true, emoji: "🗣️", label: "要口白" },
        ].map((o) => (
          <button
            key={o.label}
            onClick={() => setWithNarration(o.on)}
            aria-pressed={withNarration === o.on}
            style={choiceButton(withNarration === o.on)}
          >
            <span style={{ fontSize: 26 }} aria-hidden="true">{o.emoji}</span> {o.label}
          </button>
        ))}
      </div>

      {withNarration && (
        <div className="card" style={{ marginTop: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)" }}>用誰的聲音？</div>
          <NarrationVoicePicker
            voice={voice}
            accent={accent}
            onVoice={setVoice}
            onAccent={setAccent}
            myVoice={myVoice}
            onSetupMyVoice={() => setSheetFor("single")}
          />

          <label htmlFor="travel-narration" style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)" }}>
            想說什麼？<span style={{ fontWeight: 500, color: "var(--ink-3)" }}>（{[...script].length}/{NARRATION_MAX_CHARS} 字，字幕會照這句顯示）</span>
          </label>
          <textarea
            id="travel-narration"
            value={script}
            onChange={(e) => setScript(e.target.value.slice(0, NARRATION_MAX_CHARS))}
            rows={3}
            placeholder="例如：今天跟老伴來日月潭，湖水好漂亮"
            style={{
              width: "100%", padding: "14px 16px", fontSize: "var(--fs-base)", lineHeight: 1.5,
              borderRadius: "var(--r-md)", border: "2px solid var(--line)", background: "var(--surface)",
              color: "var(--ink-1)", boxSizing: "border-box", resize: "none", fontFamily: "inherit",
            }}
          />
          <DictationButton
            where="narration"
            disabled={writing}
            onText={(heard) => setScript((prev) => appendDictation(prev, heard, NARRATION_MAX_CHARS))}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              onClick={handleWriteScript}
              disabled={!photo || writing}
              className="btn-ghost"
              style={{ fontSize: "var(--fs-sm)", padding: "12px 8px", opacity: !photo || writing ? 0.5 : 1 }}
            >
              {writing ? "AI 寫作中…" : "✨ AI 幫我寫"}
            </button>
            <button
              onClick={handlePreview}
              disabled={!sanitizeNarration(script) || previewing}
              className="btn-ghost"
              style={{ fontSize: "var(--fs-sm)", padding: "12px 8px", opacity: !sanitizeNarration(script) || previewing ? 0.5 : 1 }}
            >
              {previewing ? "配音中…" : "▶️ 試聽口白"}
            </button>
          </div>
          {!photo && (
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>先選照片，AI 才能幫你寫</div>
          )}
          {previewMatches && preview && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <audio controls autoPlay src={preview.url} style={{ width: "100%" }} />
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>
                影片會做成 {preview.video_seconds} 秒，剛好念完這句
              </div>
            </div>
          )}
        </div>
      )}

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
        {submitPhase === "narration" ? "準備口白中…" : submitting ? "送出中…" : "🎬 開始做影片"}
      </button>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
        {blockedReason ?? "通常要 5～60 分鐘，可以先去做別的事，回來打開這頁就看得到"}
        <br />
        照片會傳送給 AI 影片服務（邁笙平台／MiniMax）製作影片；AI 做的動作不一定完美，不滿意可以換張照片再做
      </div>
      </>
      )}

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
              onMakeMv={() => setMvFor(v)}
              onAltVersion={() => handleAltVersion(v)}
              altBusy={altBusyId === v.id}
              altBlocked={videos.some((x) => x.kind === "mv" && isTravelVideoPending(x.status))}
            />
          ))}
        </div>
      )}

      {mvFor && (
        <MvComposerSheet
          source={mvFor}
          quota={mvQuota}
          blockedReason={
            videos.some((x) => x.kind === "mv" && isTravelVideoPending(x.status)) ? "上一支 MV 還在做，做好再做下一支" : null
          }
          onClose={() => setMvFor(null)}
          onCreated={(video, q) => {
            lastStatus.current[video.id] = video.status;
            setVideos((prev) => [video, ...prev]);
            setMvQuota(q);
            setMvFor(null);
          }}
        />
      )}

      {sheetFor && (
        <MyVoiceSheet status={myVoice} onClose={() => setSheetFor(null)} onChanged={handleMyVoiceChanged} />
      )}
    </SubPage>
  );
}

function VideoCard({
  video: v, deleting, onShare, onDelete, onMakeMv, onAltVersion, altBusy, altBlocked,
}: {
  video: TravelVideo;
  deleting: boolean;
  onShare: () => void;
  onDelete: () => void;
  /** 做好的遊記：做成 MV（打開做 MV 的畫面） */
  onMakeMv?: () => void;
  /** 做好的 MV：用同一次做歌的另一首，另外做一支（不扣次數） */
  onAltVersion?: () => void;
  altBusy?: boolean;
  /** 有 MV 還在做（一次只能做一支） */
  altBlocked?: boolean;
}) {
  const styleMeta = TRAVEL_VIDEO_STYLES.find((s) => s.id === v.style);
  const pending = isTravelVideoPending(v.status);
  const montage = v.kind === "montage";
  const mv = v.kind === "mv";
  const [showLyrics, setShowLyrics] = useState(false);

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
                <div role="status">
                  {mv && v.mv_progress
                    ? mvProgressLabel(v.mv_progress)
                    : montage && v.montage_progress
                      ? montageProgressLabel(v.montage_progress)
                      : "暖暖正在做影片…"}
                </div>
                <div style={{ fontWeight: 500, fontSize: "var(--fs-xs)" }}>
                  {mv
                    ? "通常 5～10 分鐘，可以先去做別的事，做好會通知你"
                    : montage
                      ? "通常 1～3 分鐘，停在這頁會做得比較快"
                      : "通常要 5～60 分鐘，可以先去做別的事"}
                </div>
              </>
            ) : (
              <div role="status">
                {mv ? "這支 MV 沒做成功（不會扣次數）" : montage ? "這支遊記沒做成功（不會扣次數）" : "這支沒做成功（不會扣次數）"}
                <br />
                {mv || montage ? "請再做一次" : "換張照片再試試"}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
        <span aria-hidden="true">{mv ? "🎵" : montage ? "📚" : styleMeta?.emoji ?? "🎬"}</span>
        <span style={{ fontWeight: 700, color: "var(--ink-1)" }}>
          {mv
            ? `MV：${v.mv?.title ?? ""}${v.place ? `（${v.place}）` : ""}`
            : v.place || (montage ? `遊記影片（${v.montage_lines?.length ?? 0} 張）` : styleMeta?.label || "出遊影片")}
          {mv && v.mv?.is_variant && (
            <span style={{
              marginLeft: 6, padding: "1px 8px", borderRadius: 999, whiteSpace: "nowrap",
              background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
              fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--primary-deep)",
            }}>
              另一個版本
            </span>
          )}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "var(--fs-xs)" }}>{formatWhen(v.created_at)}</span>
      </div>
      {mv && v.mv ? (
        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => setShowLyrics((x) => !x)}
            className="btn-ghost"
            style={{ fontSize: "var(--fs-sm)", padding: "8px 12px" }}
            aria-expanded={showLyrics}
          >
            {showLyrics ? "收起歌詞" : "📜 看歌詞"}
          </button>
          {showLyrics && (
            <div style={{ whiteSpace: "pre-wrap", fontSize: "var(--fs-base)", lineHeight: 1.8, marginTop: 8, color: "var(--ink-1)" }}>
              {v.mv.lyrics}
            </div>
          )}
        </div>
      ) : montage && v.montage_lines ? (
        <ol style={{ margin: "6px 0 0", paddingLeft: 26, listStyle: "decimal", fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
          {v.montage_lines.map((line, i) => <li key={i}>{line}</li>)}
        </ol>
      ) : v.narration_text && (
        <div style={{ marginTop: 6, fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
          <span aria-hidden="true">🗣️ </span>「{v.narration_text}」
        </div>
      )}

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
          {montage && onMakeMv && (
            <button onClick={onMakeMv} className="btn-ghost" style={{ width: "100%", fontSize: "var(--fs-base)" }}>
              🎵 把這趟寫成一首歌（MV）
            </button>
          )}
          {mv && v.mv?.alt_available && onAltVersion && (
            <div>
              <button
                onClick={onAltVersion}
                disabled={altBusy || altBlocked}
                className="btn-ghost"
                style={{ width: "100%", fontSize: "var(--fs-base)" }}
              >
                {altBusy ? "準備中…" : "🔄 換另一個版本（不扣次數）"}
              </button>
              <div style={{ marginTop: 4, fontSize: "var(--fs-xs)", color: "var(--ink-3)", textAlign: "center" }}>
                {altBlocked ? "上一支 MV 還在做，做好再換" : "同一首歌詞的另一種唱法，原本這支會留著"}
              </div>
            </div>
          )}
          {/* 家人的按讚、留言（家人在「家人狀況」看得到做好的影片） */}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <VideoComments videoId={v.id} initial={v.comments} viewer="owner" />
          </div>
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

/** 「做 MV」分頁：挑一支做好的遊記；還沒有遊記就先帶去做 */
function MvPicker({
  montages,
  onPick,
  onMakeMontage,
}: {
  montages: TravelVideo[];
  onPick: (v: TravelVideo) => void;
  onMakeMontage: () => void;
}) {
  if (montages.length === 0) {
    return (
      <div className="card" style={{ marginTop: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12, textAlign: "center" }}>
        <div style={{ fontSize: 40 }} aria-hidden="true">📚</div>
        <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)" }}>先做一支遊記</div>
        <div style={{ color: "var(--ink-2)", lineHeight: 1.6 }}>
          MV 會用遊記的照片和你寫的句子來寫歌。先選 3～5 張出遊照片做一支遊記，做好就能回來做 MV。
        </div>
        <button onClick={onMakeMontage} className="btn-primary">📚 去做遊記</button>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={sectionTitle}>選一支遊記來寫成歌</div>
      {montages.map((v) => (
        <button
          key={v.id}
          onClick={() => onPick(v)}
          className="card"
          style={{
            display: "flex", gap: 12, alignItems: "center", padding: 12, textAlign: "left",
            border: "2px solid var(--line)", cursor: "pointer", background: "var(--surface)", width: "100%",
          }}
        >
          {v.photo_url && (
            <img src={v.photo_url} alt="" loading="lazy" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, flexShrink: 0 }} />
          )}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 800, color: "var(--ink-1)" }}>📚 {v.place || "遊記影片"}</span>
            <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>
              {formatWhen(v.created_at)}
              {v.montage_lines?.length ? `・${v.montage_lines.length} 張照片` : ""}
            </span>
          </span>
          <span style={{ fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--primary-deep)", whiteSpace: "nowrap" }}>🎵 做成歌</span>
        </button>
      ))}
    </div>
  );
}
