import type { Metadata } from "next";
import { loadSharedVideo } from "@/lib/video-share-server";
import { videoShareMeta, videoSharePath } from "@/lib/travel-video";
import { VideoShareView } from "@/components/video-share-view";

type Props = { params: Promise<{ id: string }> };

/** 分享頁：每次都看最新狀態（影片被刪掉就不再顯示） */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const shared = await loadSharedVideo(id, { withViewer: false });
  // 不給搜尋引擎收錄：長輩分享給家人的影片
  const robots = { index: false, follow: false };
  if (!shared) return { title: "影片不存在｜暖暖", robots };
  const { title, description } = videoShareMeta(shared.video);
  const image = shared.video.photo_url;
  return {
    title: `${title}｜暖暖`,
    description,
    robots,
    alternates: { canonical: videoSharePath(id) },
    openGraph: {
      type: "video.other",
      title,
      description,
      url: videoSharePath(id),
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
      ...(shared.video.video_url ? { videos: [{ url: shared.video.video_url, type: "video/mp4" }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function VideoSharePage({ params }: Props) {
  const { id } = await params;
  const shared = await loadSharedVideo(id, { withViewer: true });
  return <VideoShareView shared={shared} />;
}
