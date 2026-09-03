// ────────────────────────────────────────────────
// 章節覆蓋內容（伺服端讀取）
// 用 anon key 讀取公開內容（RLS 允許所有人 select）
// 讀不到（表不存在／網路問題）就回 null → 畫面用程式碼預設值，永不因此壞掉
// ────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";
import { chapterOverridesSchema, type ChapterOverrides } from "./chapter-content";

export async function fetchChapterOverrides(chapterId: string): Promise<ChapterOverrides | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("chapter_content")
      .select("overrides")
      .eq("chapter_id", chapterId)
      .maybeSingle();
    if (!data?.overrides) return null;
    // 用 schema 過一次：DB 裡若有壞資料，寧可忽略也不要讓畫面炸掉
    const parsed = chapterOverridesSchema.safeParse(data.overrides);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
