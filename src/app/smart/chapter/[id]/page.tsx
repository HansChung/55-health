import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChapterOpening } from "@/lib/chapter-opening";
import { applyChapterOverrides } from "@/lib/chapter-content";
import { fetchChapterOverrides } from "@/lib/chapter-content-server";
import { ChapterOpeningScreen } from "@/screens/chapter-opening-screen";

type Props = { params: Promise<{ id: string }> };

/** 程式碼預設值 + 後台覆蓋內容（DB 讀不到就用預設，永不因此壞掉） */
async function loadChapter(id: string) {
  const base = getChapterOpening(id);
  if (!base) return null;
  const overrides = await fetchChapterOverrides(id);
  return applyChapterOverrides(base, overrides);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const chapter = await loadChapter(id);
  if (!chapter) return { title: "章節開篇｜暖暖" };
  return {
    title: `${chapter.title}｜章節開篇｜暖暖`,
    description: chapter.quote,
  };
}

/** QR 0100：章節開篇｜風起了，調整風帆 */
export default async function ChapterOpeningPage({ params }: Props) {
  const { id } = await params;
  const chapter = await loadChapter(id);
  if (!chapter) notFound();
  return <ChapterOpeningScreen chapter={chapter} />;
}
