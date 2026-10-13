"use client";

// 「⬇️ 存到手機相簿」：App 直接存；iPhone 等支援分享檔案的手機先準備好、再按一次「📲 存到相簿」打開分享選單；其他直接下載

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import {
  downloadFile,
  fetchMediaFile,
  mediaFilename,
  saveMode,
  saveNative,
  shareFile,
  type SaveMode,
} from "@/lib/save-media";

export function SaveToPhoneButton({
  url,
  mime,
  name,
  where,
  className = "btn-ghost",
  style,
  compact,
}: {
  url: string;
  mime: "video/mp4" | "image/jpeg" | "image/png";
  /** 檔名（不用副檔名），例如「暖暖-日月潭遊記」 */
  name: string;
  /** 統計用 */
  where: string;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<SaveMode>("download");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<File | null>(null);
  const alive = useRef(true);
  const video = mime.startsWith("video/");

  useEffect(() => {
    setMode(saveMode());
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  // 換了別的影片／照片：準備好的檔案不能再用
  useEffect(() => setReady(null), [url]);

  const filename = mediaFilename(name, mime);

  const onClick = async () => {
    if (busy) return;
    // 第二步：檔案已經準備好，打開分享選單（使用者按下的當下）
    if (ready) {
      try {
        const done = await shareFile(ready, filename);
        if (done) {
          trackEvent("save_to_phone", { where, mode: "share", video });
          setReady(null);
        }
      } catch {
        downloadFile(ready);
        setReady(null);
      }
      return;
    }
    setBusy(true);
    try {
      if (mode === "native") {
        await saveNative(url, mime, filename);
        trackEvent("save_to_phone", { where, mode, video });
        toast.success(video ? "存好了！到相簿的「暖暖」資料夾就看得到" : "照片存好了！到相簿的「暖暖」資料夾就看得到");
        return;
      }
      const file = await fetchMediaFile(url, mime, filename);
      if (!alive.current) return;
      if (mode === "share") {
        setReady(file);
        toast.info(video ? "影片準備好了，再按一次「存到相簿」，選「儲存影片」" : "照片準備好了，再按一次「存到相簿」，選「儲存影像」");
      } else {
        downloadFile(file);
        trackEvent("save_to_phone", { where, mode, video });
        toast.success("下載好了，在「下載」資料夾裡");
      }
    } catch (e) {
      const denied = (e as { code?: string; message?: string })?.code === "PERMISSION_DENIED";
      toast.error(denied ? "要先允許暖暖使用儲存空間，才能存到相簿" : "沒存成功，請檢查網路再試一次");
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const label = busy
    ? video ? "⏳ 準備影片中…" : "⏳ 準備照片中…"
    : ready
      ? "📲 存到相簿"
      : mode === "download"
        ? "⬇️ 下載到手機"
        : "⬇️ 存到手機相簿";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className={ready ? "btn-primary" : className}
      style={{ width: compact ? undefined : "100%", ...style }}
    >
      {label}
    </button>
  );
}
