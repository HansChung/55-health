import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nuannuan.app",
  appName: "暖暖",
  webDir: "out",
  android: {
    allowMixedContent: false,
  },
};

export default config;
