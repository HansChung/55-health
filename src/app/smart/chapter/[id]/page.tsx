import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadChapter } from "@/lib/chapter-content-server";
import { requireAdmin } from "@/lib/admin-guard";
import { ChapterOpeningScreen } from "@/screens/chapter-opening-screen";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
};

/** ?preview=1 只對已登入的管理員有效（用來預覽還沒發布的新章節） */
async function isPreview(searchParams: Props["searchParams"]): Promise<boolean> {
  const { preview } = await searchParams;
  if (preview !== "1") return false;
  return !!(await requireAdmin().catch(() => null));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const chapter = await loadChapter(id, { preview: await isPreview(searchParams) });
  if (!chapter) return { title: "章節開篇｜暖暖" };
  return {
    title: `${chapter.title}｜章節開篇｜暖暖`,
    description: chapter.quote,
  };
}

/** QR 0100：章節開篇｜風起了，調整風帆（內建章節＋後台新增的章節共用） */
export default async function ChapterOpeningPage({ params, searchParams }: Props) {
  const { id } = await params;
  const chapter = await loadChapter(id, { preview: await isPreview(searchParams) });
  if (!chapter) notFound();
  return <ChapterOpeningScreen chapter={chapter} />;
}
