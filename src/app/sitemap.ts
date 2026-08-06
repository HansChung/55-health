import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nuan55.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // 只列公開、可被索引的頁面（不含登入後的 App 內容與後台）
  return [
    "",
    "/pricing",
    "/privacy",
    "/terms",
    "/smart/guide",
    "/smart/radar",
    "/smart/spark",
    "/smart/chapter3",
    "/smart/chapter/0100",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : path.startsWith("/smart") ? 0.7 : 0.6,
  }));
}
