import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 出遊影片口白後製用 ffmpeg-static 的執行檔：不要被打包，並確保 Vercel 函式帶上它
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/ai/travel-video": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/webhooks/lk888/[secret]": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  // Capacitor build 時透過 BUILD_TARGET=mobile 切換成 static export
  ...(process.env.BUILD_TARGET === "mobile" && {
    output: "export" as const,
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;
