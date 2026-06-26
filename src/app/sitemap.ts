import type { MetadataRoute } from "next";

// 內容為靜態，標記 force-static 才能在 mobile 靜態匯出（output: export）下產生
export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nuan55.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // 只列公開、可被索引的頁面（不含登入後的 App 內容與後台）
  return ["", "/pricing", "/privacy", "/terms"].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
