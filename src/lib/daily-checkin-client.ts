import { api, type NotificationSettings, type ProfileData } from "@/lib/api-client";
import { enableWebPush, isWebPushSupported } from "@/lib/push/client";
import type { DailyCheckinSetting } from "@/lib/daily-checkin";

/**
 * 存平安打卡的設定。要開的話順便試著打開這台裝置的推播（到時間提醒自己用）；
 * 不允許也照樣存：通知家人不需要長輩這邊收得到推播。
 * notification_settings 是整包覆蓋 → 先讀再合併
 */
export async function saveDailyCheckin(value: DailyCheckinSetting): Promise<{ profile: ProfileData; pushOk: boolean }> {
  let pushOk = true;
  if (value.on) {
    try {
      if (!isWebPushSupported() || Notification.permission === "denied") pushOk = false;
      // 已經訂閱過也再送一次：換帳號登入、伺服器那筆被刪掉時，訂閱才會記在現在這個人身上
      else await enableWebPush();
    } catch (e) {
      console.warn("[checkin] push not enabled:", e);
      pushOk = false;
    }
  }
  const { profile } = await api.getProfile();
  const ns: NotificationSettings = { ...(profile.notification_settings ?? {}), daily_checkin: value };
  if (value.on && pushOk) ns.web_push = { on: true };
  const { profile: updated } = await api.updateProfile({ notification_settings: ns });
  return { profile: updated, pushOk };
}
