import { api } from "@/lib/api-client";

const sent = new Set<string>();

/** 家人按下播放 → 讓長輩看到「看過了」（這一頁每支只送一次；送不出去就算了，下次播放再送） */
export function markVideoViewed(videoId: string): void {
  if (sent.has(videoId)) return;
  sent.add(videoId);
  api.markVideoViewed(videoId).catch(() => sent.delete(videoId));
}
