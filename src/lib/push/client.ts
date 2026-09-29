/** 瀏覽器端：註冊 SW + 訂閱／取消 Web Push */

import { api } from "@/lib/api-client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function ensurePushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function subscribeWebPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!("Notification" in window) || !("PushManager" in window)) {
    throw new Error("此瀏覽器不支援推播");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("尚未允許通知權限");
  }
  const reg = await ensurePushServiceWorker();
  if (!reg) throw new Error("無法註冊背景服務");

  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });
}

export async function unsubscribeWebPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return false;
  await sub.unsubscribe();
  return true;
}

/** 這個瀏覽器能不能收推播（iPhone 需先「加入主畫面」才支援） */
export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** 這台裝置是否已經訂閱推播 */
export async function hasWebPushSubscription(): Promise<boolean> {
  if (!isWebPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return Boolean(await reg?.pushManager.getSubscription());
}

/**
 * 開啟這台裝置的推播：要權限 → 訂閱 → 存到伺服器。
 * 呼叫端再自行更新 notification_settings.web_push
 */
export async function enableWebPush(): Promise<void> {
  const { configured, publicKey } = await api.getVapidPublicKey();
  if (!configured || !publicKey) throw new Error("伺服器尚未設定推播金鑰");
  const sub = await subscribeWebPush(publicKey);
  if (!sub) throw new Error("訂閱失敗");
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("訂閱資料不完整");
  }
  await api.subscribePush({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    userAgent: navigator.userAgent.slice(0, 400),
  });
}
