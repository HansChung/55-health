import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChapterOpening } from "@/lib/chapter-opening";
import { ChapterOpeningScreen } from "@/screens/chapter-opening-screen";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const chapter = getChapterOpening(id);
  if (!chapter) return { title: "章節開篇｜暖暖" };
  return {
    title: `${chapter.title}｜章節開篇｜暖暖`,
    description: chapter.quote,
  };
}

/** QR 0100：章節開篇｜風起了，調整風帆 */
export default async function ChapterOpeningPage({ params }: Props) {
  const { id } = await params;
  const chapter = getChapterOpening(id);
  if (!chapter) notFound();
  return <ChapterOpeningScreen chapter={chapter} />;
}
