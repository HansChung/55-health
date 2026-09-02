/**
 * Capacitor 原生環境偵測（安全：網頁永遠回 false）
 * 供 Health Connect 等僅 App 可用的功能使用。
 */
import { Capacitor } from "@capacitor/core";

/** 是否跑在 Capacitor 原生殼（Android / iOS），不是一般瀏覽器 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** 是否為 Android 原生 App（Health Connect 只在這裡開） */
export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

export function nativePlatformLabel(): "android" | "ios" | "web" {
  try {
    if (!Capacitor.isNativePlatform()) return "web";
    const p = Capacitor.getPlatform();
    if (p === "android") return "android";
    if (p === "ios") return "ios";
    return "web";
  } catch {
    return "web";
  }
}
