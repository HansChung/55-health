import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nuannuan.app",
  appName: "暖暖",
  // 殼用的最小靜態內容（啟動畫面 / 離線 fallback）。
  // 實際內容由下方 server.url 載入線上的 nuan55.com → 前端程式碼不用打包、不用改。
  webDir: "android-shell",
  server: {
    url: "https://nuan55.com",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
