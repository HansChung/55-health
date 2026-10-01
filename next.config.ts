import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 出遊影片口白後製用 ffmpeg-static 的執行檔：不要被打包，並確保 Vercel 函式帶上它
  serverExternalPackages: ["ffmpeg-static"],
  // 遊記的最後合成會墊配樂（public/music）：會推進遊記的 route 都要帶上
  outputFileTracingIncludes: {
    "/api/ai/travel-video": ["./node_modules/ffmpeg-static/ffmpeg", "./public/music/*.m4a"],
    // 多張照片遊記：建立後在背景先開始做（配音、剪輯要用 ffmpeg）
    "/api/ai/travel-video/montage": ["./node_modules/ffmpeg-static/ffmpeg", "./public/music/*.m4a"],
    "/api/cron/montage-step": ["./node_modules/ffmpeg-static/ffmpeg", "./public/music/*.m4a"],
    "/api/webhooks/lk888/[secret]": ["./node_modules/ffmpeg-static/ffmpeg"],
    // 我的聲音：錄音轉 WAV；複製聲音的配音可能回 mp3，要轉成 WAV
    "/api/ai/voice-clone": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/ai/travel-video/narration": ["./node_modules/ffmpeg-static/ffmpeg"],
    // 語音留言：瀏覽器錄音 → m4a
    "/api/ai/travel-video/[id]/comments": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  // Capacitor build 時透過 BUILD_TARGET=mobile 切換成 static export
  ...(process.env.BUILD_TARGET === "mobile" && {
    output: "export" as const,
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;
