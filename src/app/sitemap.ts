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
    "/smart/chapter/0102",
    "/smart/chapter/0103",
    "/smart/chapter/0104",
    "/smart/chapter/0105",
    "/smart/chapter/0106",
    "/smart/chapter/0107",
    "/smart/chapter/0108",
    "/smart/chapter/0200",
    "/smart/chapter/0201",
    "/smart/chapter/0202",
    "/smart/chapter/0203",
    "/smart/chapter/0204",
    "/smart/chapter/0205",
    "/smart/chapter/0206",
    "/smart/chapter/0207",
    "/smart/chapter/0208",
    "/smart/chapter/0209",
    "/smart/chapter/0210",
    "/smart/chapter/0211",
    "/smart/chapter/0300",
    "/smart/chapter/0301",
    "/smart/chapter/0302",
    "/smart/chapter/0303",
    "/smart/chapter/0304",
    "/smart/chapter/0305",
    "/smart/chapter/0306",
    "/smart/chapter/0307",
    "/smart/chapter/0308",
    "/smart/chapter/0309",
    "/smart/chapter/0310",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : path.startsWith("/smart") ? 0.7 : 0.6,
  }));
}
