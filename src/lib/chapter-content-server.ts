// ────────────────────────────────────────────────
// 章節內容（伺服端讀取）
// 一般讀取用 anon key：RLS 只放行內建章節覆蓋＋已發布的新章節
// 管理員預覽草稿時才用 service role
// 讀不到（表不存在／網路問題）一律回 null → 畫面用程式碼預設值，永不因此壞掉
// ────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";
import { getChapterOpening, type ChapterOpening } from "./chapter-opening";
import {
  chapterOverridesSchema,
  applyChapterOverrides,
  customChapterBase,
  CUSTOM_CHAPTER_ID_RE,
  type ChapterOverrides,
} from "./chapter-content";

interface ChapterRow {
  overrides: ChapterOverrides;
  is_custom: boolean;
  published: boolean;
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchChapterRow(chapterId: string, opts: { privileged?: boolean } = {}): Promise<ChapterRow | null> {
  const supabase = opts.privileged ? serviceClient() : anonClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("chapter_content")
      .select("overrides, is_custom, published")
      .eq("chapter_id", chapterId)
      .maybeSingle();
    if (!data) return null;
    // 用 schema 過一次：DB 裡若有壞資料，寧可忽略也不要讓畫面炸掉
    const parsed = chapterOverridesSchema.safeParse(data.overrides ?? {});
    return {
      overrides: parsed.success ? parsed.data : {},
      is_custom: !!data.is_custom,
      published: data.published !== false,
    };
  } catch {
    return null;
  }
}

/** 相容舊呼叫：只取覆蓋內容 */
export async function fetchChapterOverrides(chapterId: string): Promise<ChapterOverrides | null> {
  const row = await fetchChapterRow(chapterId);
  return row && !row.is_custom ? row.overrides : null;
}

/**
 * 章節頁面用：內建章節＝預設值＋覆蓋；後台新增的章節＝範本＋DB 內容。
 * preview=true（僅限已驗證的管理員）時可看到未發布的草稿。
 */
export async function loadChapter(chapterId: string, opts: { preview?: boolean } = {}): Promise<ChapterOpening | null> {
  const builtin = getChapterOpening(chapterId);
  if (builtin) {
    const row = await fetchChapterRow(chapterId, { privileged: opts.preview });
    return applyChapterOverrides(builtin, row && !row.is_custom ? row.overrides : null);
  }
  if (!CUSTOM_CHAPTER_ID_RE.test(chapterId)) return null;
  const row = await fetchChapterRow(chapterId, { privileged: opts.preview });
  if (!row?.is_custom) return null;
  if (!row.published && !opts.preview) return null;
  return applyChapterOverrides(customChapterBase(chapterId), row.overrides);
}

/** 書本目錄用：已發布的新章節＋被後台改過的標題 */
export async function fetchChapterCatalog(): Promise<{
  custom: { id: string; title: string }[];
  titles: Record<string, string>;
}> {
  const empty = { custom: [], titles: {} };
  const supabase = anonClient();
  if (!supabase) return empty;
  try {
    const { data, error } = await supabase
      .from("chapter_content")
      .select("chapter_id, overrides, is_custom");
    if (error || !data) return empty;
    const custom: { id: string; title: string }[] = [];
    const titles: Record<string, string> = {};
    for (const r of data as { chapter_id: string; overrides: { title?: unknown }; is_custom: boolean }[]) {
      const t = typeof r.overrides?.title === "string" ? r.overrides.title.trim().slice(0, 120) : "";
      if (r.is_custom) {
        if (CUSTOM_CHAPTER_ID_RE.test(r.chapter_id) && !getChapterOpening(r.chapter_id)) {
          custom.push({ id: r.chapter_id, title: t || "新章節" });
        }
      } else if (t) {
        titles[r.chapter_id] = t;
      }
    }
    return { custom, titles };
  } catch {
    return empty;
  }
}
