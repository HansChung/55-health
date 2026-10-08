// ────────────────────────────────────────────────
// 照片直傳 Supabase（不經過 Vercel，省 Fast Origin Transfer）：前後端共用的常數與路徑規則
// 手機先把照片傳到私人暫存區 user-uploads/{自己的 id}/{隨機 id}.jpg，API 只帶路徑；
// 伺服器用 service role 讀。暫存區每天清掉超過一天的檔案（/api/cron/cleanup-uploads）
// ────────────────────────────────────────────────

export const USER_UPLOAD_BUCKET = "user-uploads";
/** 照片最大（手機端都先壓到 1280px，通常 200～500 KB） */
export const USER_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
/** 錄音最大（1 分鐘：webm 約 0.3 MB、Safari mp4 約 1 MB） */
export const AUDIO_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const EXT = { image: "jpg|png|webp", audio: "webm|m4a|ogg|mp3|wav" } as const;
const PATH_RE = {
  image: new RegExp(`^(${UUID})/(${UUID})\\.(${EXT.image})$`, "i"),
  audio: new RegExp(`^(${UUID})/(${UUID})\\.(${EXT.audio})$`, "i"),
};

/** 暫存區的路徑：一定要在自己的資料夾、檔名是隨機 id（API 只信這個格式） */
export function isOwnUploadPath(path: unknown, userId: string, kind: "image" | "audio" = "image"): path is string {
  if (typeof path !== "string") return false;
  const m = PATH_RE[kind].exec(path);
  return Boolean(m && m[1].toLowerCase() === userId.toLowerCase());
}

/** 瀏覽器錄音的格式（MediaRecorder 會帶 ;codecs=…，拿掉）→ 暫存區接受的格式與副檔名 */
export function audioUploadType(blobType: string): { contentType: string; ext: string } | null {
  const base = blobType.split(";")[0].trim().toLowerCase();
  const map: Record<string, { contentType: string; ext: string }> = {
    "audio/webm": { contentType: "audio/webm", ext: "webm" },
    "audio/mp4": { contentType: "audio/mp4", ext: "m4a" },
    "audio/x-m4a": { contentType: "audio/mp4", ext: "m4a" },
    "audio/aac": { contentType: "audio/aac", ext: "m4a" },
    "audio/ogg": { contentType: "audio/ogg", ext: "ogg" },
    "audio/mpeg": { contentType: "audio/mpeg", ext: "mp3" },
    "audio/wav": { contentType: "audio/wav", ext: "wav" },
  };
  return map[base] ?? null;
}

export function userUploadPath(userId: string, id: string, mimeType: string): string {
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `${userId}/${id}.${ext}`;
}
