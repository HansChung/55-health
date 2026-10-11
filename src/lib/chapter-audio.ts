// ────────────────────────────────────────────────
// 書本章節的 Podcast／音檔：後台上傳到 Supabase 公開 bucket「chapter-audio」
// 檔案很大（一集常常 20～50MB），由瀏覽器直接傳到 Supabase（簽名上傳網址），不經過 Vercel
// bucket 不存在時第一次上傳會自動建立，不需要另外跑 SQL
// ────────────────────────────────────────────────

export const CHAPTER_AUDIO_BUCKET = "chapter-audio";
/** Supabase 免費方案單檔上限 50MB */
export const CHAPTER_AUDIO_MAX_BYTES = 50 * 1024 * 1024;

/** 收的格式 → 副檔名（瀏覽器給的類型常常不一樣：m4a 可能是 audio/x-m4a 或空字串） */
const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};
const EXT_TYPES: Record<string, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav" };

/** bucket 允許的類型（存檔一律用這幾種 content-type，手機瀏覽器都放得出來） */
export const CHAPTER_AUDIO_MIME_TYPES = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/wav"];

/** 檔名＋瀏覽器給的類型 → 存檔用的 { contentType, ext }；不支援就 null */
export function chapterAudioType(fileName: string, browserType: string): { contentType: string; ext: string } | null {
  const fromType = AUDIO_TYPES[browserType.toLowerCase()];
  const ext = fromType ?? /\.([a-z0-9]+)$/i.exec(fileName)?.[1]?.toLowerCase() ?? "";
  const contentType = EXT_TYPES[ext];
  return contentType ? { contentType, ext } : null;
}

/** 一章的音檔都放在這個資料夾底下（換掉、刪掉的舊音檔靠它找出來清掉） */
export function chapterAudioFolder(chapterId: string): string {
  return `chapters/${chapterId.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "misc"}`;
}

/** chapters/0105/2026-10/1760000000000-a1b2c3.mp3（檔名不含使用者輸入） */
export function buildChapterAudioPath(
  chapterId: string,
  ext: string,
  now: number = Date.now(),
  rand: string = Math.random().toString(36).slice(2, 8)
): string {
  const d = new Date(now);
  const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${chapterAudioFolder(chapterId)}/${month}/${now}-${rand.replace(/[^a-z0-9]/gi, "")}.${ext}`;
}

/** 上傳檔名當預設標題：拿掉副檔名、截到區塊標題的上限 */
export function titleFromFileName(name: string, max = 120): string {
  return [...name.replace(/\.[a-z0-9]+$/i, "").trim()].slice(0, max).join("");
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)}MB`;
}
