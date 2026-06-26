import type { MetadataRoute } from "next";

// 內容為靜態，標記 force-static 才能在 mobile 靜態匯出（output: export）下產生
export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nuan55.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 後台與 API 不需要被搜尋引擎索引
      disallow: ["/admin", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
