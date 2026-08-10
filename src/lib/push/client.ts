/** 瀏覽器端：註冊 SW + 訂閱／取消 Web Push */

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
