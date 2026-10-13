// ────────────────────────────────────────────────
// 我的故事集：聲音故事（前後端共用）
// 在 App 裡錄（Chrome 錄 webm、iPhone 錄 mp4），或上傳手機裡的錄音檔（mp3、m4a…）
// ────────────────────────────────────────────────

export const STORY_AUDIO_BUCKET = "story-audio";
/** Supabase 免費方案單檔上限 50MB */
export const STORY_AUDIO_MAX_BYTES = 50 * 1024 * 1024;
/** App 裡一次最多錄幾秒（15 分鐘；更長的請用手機錄音 App 錄好再上傳） */
export const STORY_AUDIO_RECORD_MAX_SECONDS = 15 * 60;
/** 太短的不算（不小心按到） */
export const STORY_AUDIO_MIN_SECONDS = 3;

export interface StoryAudioType {
  /** 存檔用的 content-type */
  contentType: string;
  ext: string;
  /** App 裡錄的 webm／ogg：存故事時轉成 m4a（iPhone 放不出 webm） */
  convert: boolean;
}

const BY_TYPE: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};
const BY_EXT: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  webm: "audio/webm",
  ogg: "audio/ogg",
};

/** 檔名＋瀏覽器給的類型（可能帶 ;codecs=opus 或是空字串）→ 存檔格式；不支援就 null */
export function storyAudioType(fileName: string, browserType: string): StoryAudioType | null {
  const base = browserType.split(";")[0].trim().toLowerCase();
  let ext = BY_TYPE[base] ?? /\.([a-z0-9]+)$/i.exec(fileName)?.[1]?.toLowerCase() ?? "";
  if (ext === "mp4") ext = "m4a";
  const contentType = BY_EXT[ext];
  if (!contentType) return null;
  return { contentType, ext, convert: ext === "webm" || ext === "ogg" };
}

/** 暫存位置：{user}/pending/{uuid}.{ext} */
export function pendingStoryAudioPath(userId: string, ext: string, id: string = crypto.randomUUID()): string {
  return `${userId}/pending/${id}.${ext}`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** 存故事時送來的路徑一定要是自己的暫存檔 */
export function isOwnPendingStoryAudio(path: unknown, userId: string): path is string {
  if (typeof path !== "string") return false;
  return new RegExp(`^${userId}/pending/${UUID}\\.(mp3|m4a|aac|wav|webm|ogg)$`, "i").test(path);
}

/** 存好的位置：{user}/{story}/audio.{ext} */
export function storyAudioPath(userId: string, storyId: string, ext: string): string {
  return `${userId}/${storyId}/audio.${ext}`;
}

/** 3 分 12 秒、45 秒、1 小時 2 分 */
export function formatAudioDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} 秒`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h} 小時${m ? ` ${m} 分` : ""}`;
  return `${m} 分${r ? ` ${r} 秒` : ""}`;
}

/** 錄音計時：02:35 */
export function formatRecordClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** ffmpeg 讀檔頭印的「Duration: 00:03:12.34」→ 秒數；N/A 或沒有就 null */
export function durationFromProbe(stderr: string): number | null {
  const m = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(stderr);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

/** ffmpeg 最後一行進度「time=00:03:12.34」→ 秒數（webm 錄音常常沒有 Duration） */
export function ffmpegOutputSeconds(stderr: string): number | null {
  const all = [...stderr.matchAll(/time=(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/g)];
  const last = all[all.length - 1];
  if (!last) return null;
  return Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]);
}
