"use client";

// 「開啟通知」提示：這台裝置支援推播、伺服器有設金鑰、但還沒訂閱 → offer=true
// enable()：要權限、訂閱、存到伺服器，並同步「提醒通知」頁的開關
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { enableWebPush, hasWebPushSubscription, isWebPushSupported } from "@/lib/push/client";

export function usePushOffer() {
  const [offer, setOffer] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isWebPushSupported() || Notification.permission === "denied") return;
    let cancelled = false;
    Promise.all([api.getVapidPublicKey(), hasWebPushSubscription()])
      .then(([vapid, subscribed]) => {
        if (!cancelled) setOffer(Boolean(vapid.configured && vapid.publicKey) && !subscribed);
      })
      .catch(() => { /* 查不到就不顯示 */ });
    return () => { cancelled = true; };
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      await enableWebPush();
      setOffer(false);
    } catch (e) {
      setBusy(false);
      throw e;
    }
    // notification_settings 是整包覆蓋 → 先讀再合併；失敗不影響推播
    try {
      const { profile } = await api.getProfile();
      await api.updateProfile({
        notification_settings: { ...(profile.notification_settings ?? {}), web_push: { on: true } },
      });
    } catch (e) {
      console.warn("[push] sync web_push setting failed:", e);
    }
    setBusy(false);
    return true;
  }, []);

  return { offer, busy, enable };
}
