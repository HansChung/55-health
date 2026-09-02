import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android App 以 WebView 載入線上 Next.js（含 API），
 * 不要用 static export（API routes 無法 export）。
 *
 * 測試新功能時可設：
 *   CAPACITOR_SERVER_URL=https://你的-vercel-preview.vercel.app npm run android:open
 * 預設連正式站 https://nuan55.com
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL || "https://nuan55.com";

const config: CapacitorConfig = {
  appId: "com.nuannuan.app",
  appName: "暖暖",
  webDir: "out",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
