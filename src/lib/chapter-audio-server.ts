// ────────────────────────────────────────────────
// 書本章節 Podcast（只在管理員 API 用；service role）：清掉沒有在用的舊音檔
// 每次上傳都是新檔名，換掉或刪掉區塊後舊檔不會自己消失（一集可能 50MB），存檔／還原時順手清
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { CHAPTER_AUDIO_BUCKET, chapterAudioFolder } from "@/lib/chapter-audio";
import type { ChapterOverrides } from "@/lib/chapter-content";

type Admin = ReturnType<typeof createSupabaseAdmin>;
/** Storage list 回來的一項（資料夾的 id 是 null） */
type Entry = { id: string | null; name: string; created_at?: string | null };

/** 存檔時：剛上傳、還沒存進章節的音檔（例如另一個分頁正在編）先留著，超過這麼久沒被用到才刪 */
export const CHAPTER_AUDIO_GRACE_MS = 6 * 60 * 60 * 1000;

/** 這一章現在用到的音檔網址 */
export function referencedAudioUrls(overrides: ChapterOverrides | null | undefined): Set<string> {
  return new Set((overrides?.blocks ?? []).filter((b) => b.type === "audio").map((b) => (b as { url: string }).url));
}

/**
 * 刪掉這一章資料夾裡、沒有被章節用到的音檔。graceMs：比這更新的先不刪（還原預設、刪整章時傳 0）。
 * 失敗只記錄，不影響存檔
 */
export async function pruneChapterAudio(admin: Admin, chapterId: string, keepUrls: Set<string>, graceMs: number): Promise<number> {
  try {
    const bucket = admin.storage.from(CHAPTER_AUDIO_BUCKET);
    const folder = chapterAudioFolder(chapterId);
    const { data: months, error } = await bucket.list(folder, { limit: 1000 });
    if (error) {
      if (!/not found/i.test(error.message)) console.warn("[chapter-audio] list failed:", error.message);
      return 0;
    }
    const cutoff = Date.now() - graceMs;
    const stale: string[] = [];
    for (const m of ((months ?? []) as Entry[]).filter((x) => !x.id)) {
      const { data: files } = await bucket.list(`${folder}/${m.name}`, { limit: 1000 });
      for (const f of (files ?? []) as Entry[]) {
        if (!f.id) continue;
        const path = `${folder}/${m.name}/${f.name}`;
        const url = bucket.getPublicUrl(path).data.publicUrl;
        const created = f.created_at ? Date.parse(f.created_at) : 0;
        if (!keepUrls.has(url) && created <= cutoff) stale.push(path);
      }
    }
    for (let i = 0; i < stale.length; i += 100) {
      const { error: rmErr } = await bucket.remove(stale.slice(i, i + 100));
      if (rmErr) console.warn("[chapter-audio] remove failed:", rmErr.message);
    }
    return stale.length;
  } catch (e) {
    console.warn("[chapter-audio] prune failed:", e);
    return 0;
  }
}
