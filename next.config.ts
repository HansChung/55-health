import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Capacitor build 時透過 BUILD_TARGET=mobile 切換成 static export
  ...(process.env.BUILD_TARGET === "mobile" && {
    output: "export" as const,
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;
