import { api, type NotificationSettings, type ProfileData } from "@/lib/api-client";
import { enableWebPush, hasWebPushSubscription, isWebPushSupported } from "@/lib/push/client";
import type { DailyWeatherSetting } from "@/lib/daily-weather";

/** 這台裝置收得到、伺服器也設好了，才問縣市／顯示開關 */
export async function dailyWeatherAvailable(): Promise<boolean> {
  if (!isWebPushSupported() || Notification.permission === "denied") return false;
  const { available } = await api.dailyWeatherStatus();
  return available;
}

/**
 * 存每天早上天氣的設定；要開的話先確定這台裝置收得到推播（會跳出「允許通知」，不允許就丟錯、不存）。
 * notification_settings 是整包覆蓋 → 先讀再合併
 */
export async function saveDailyWeather(value: DailyWeatherSetting): Promise<ProfileData> {
  if (value.on && !(await hasWebPushSubscription())) await enableWebPush();
  const { profile } = await api.getProfile();
  const ns: NotificationSettings = { ...(profile.notification_settings ?? {}), daily_weather: value };
  if (value.on) ns.web_push = { on: true };
  const { profile: updated } = await api.updateProfile({ notification_settings: ns });
  return updated;
}
