import type { MetadataRoute } from "next";

// ────────────────────────────────────────────────
// PWA manifest — 讓長者能「加到主畫面」當 App 用
// Next.js 會自動產生 /manifest.webmanifest
// ────────────────────────────────────────────────
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "暖暖 · 55+ 飲食記錄",
    short_name: "暖暖",
    description: "給長者的飲食追蹤 App — 拍照記錄、AI 分析、語音對話",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF5EC",
    theme_color: "#FAF5EC",
    lang: "zh-TW",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
