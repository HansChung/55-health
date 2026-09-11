// 公開：書本目錄補充資料（已發布的新章節＋後台改過的標題）
// 草稿不會出現（RLS 擋掉）；讀不到就回空，目錄照樣顯示內建章節
import { NextResponse } from "next/server";
import { fetchChapterCatalog } from "@/lib/chapter-content-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await fetchChapterCatalog();
  return NextResponse.json(catalog, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
