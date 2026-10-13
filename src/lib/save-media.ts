// ────────────────────────────────────────────────
// 存到手機相簿
// ・暖暖 App（Android）：原生外掛 GallerySaver 直接放進相簿的「暖暖」資料夾
// ・iPhone／支援分享檔案的手機瀏覽器：先把檔案下載好，再用系統分享選單（選「儲存影片／儲存影像」就進相簿）。
//   分享選單一定要在使用者按下的當下打開（下載太久就會被擋），所以分兩步：準備好 → 再按一次
// ・其他（電腦、不支援分享檔案）：直接下載（Android 的「下載」資料夾相簿也看得到）
// ────────────────────────────────────────────────

import { Capacitor, registerPlugin } from "@capacitor/core";

interface GallerySaverPlugin {
  save(options: { url: string; mime: string; filename: string }): Promise<{ uri: string }>;
}
const GallerySaver = registerPlugin<GallerySaverPlugin>("GallerySaver");

export type SaveMode = "native" | "share" | "download";

/** 手機、平板（iPadOS 會假裝是 Mac：看有沒有觸控） */
export function isMobileDevice(ua: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod|Android/i.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
}

/** 這台裝置用哪一種方式存（畫面上的說明文字跟著變）；電腦就算支援分享檔案也直接下載 */
export function saveMode(): SaveMode {
  if (typeof window === "undefined") return "download";
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") return "native";
  if (!isMobileDevice(navigator.userAgent, navigator.maxTouchPoints ?? 0)) return "download";
  try {
    const probe = new File([new Blob(["x"], { type: "image/jpeg" })], "x.jpg", { type: "image/jpeg" });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] })) return "share";
  } catch {
    // 不支援 File 建構子之類的舊瀏覽器：直接下載
  }
  return "download";
}

/** 檔名：去掉不能用的字，加上副檔名 */
export function mediaFilename(base: string, mime: string): string {
  const ext = mime.startsWith("video/") ? "mp4" : mime === "image/png" ? "png" : "jpg";
  const name = base.replace(/[\\/:*?"<>|\n\r]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "暖暖";
  return `${name}.${ext}`;
}

/** App：直接存進相簿 */
export async function saveNative(url: string, mime: string, filename: string): Promise<void> {
  await GallerySaver.save({ url, mime, filename });
}

/** 網頁：先把檔案抓下來（分享選單要用；下載也用它，才能指定檔名） */
export async function fetchMediaFile(url: string, mime: string, filename: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || mime });
}

/**
 * 網頁：打開分享選單（要在使用者按下的當下呼叫）。
 * shared＝分享了；cancelled＝自己取消；retry＝被瀏覽器擋（不是在按下的當下、已經有一個在開）→ 請長輩再按一次，
 * 不要改成下載（iPhone 下載會進「檔案」不是相簿）
 */
export async function shareFile(file: File, title: string): Promise<"shared" | "cancelled" | "retry"> {
  try {
    await navigator.share({ files: [file], title });
    return "shared";
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === "AbortError") return "cancelled";
    if (name === "NotAllowedError" || name === "InvalidStateError") return "retry";
    throw e;
  }
}

/** 網頁：直接下載 */
export function downloadFile(file: File): void {
  const href = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = href;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}
