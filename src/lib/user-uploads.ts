// ────────────────────────────────────────────────
// 照片直傳 Supabase（不經過 Vercel，省 Fast Origin Transfer）：前後端共用的常數與路徑規則
// 手機先把照片傳到私人暫存區 user-uploads/{自己的 id}/{隨機 id}.jpg，API 只帶路徑；
// 伺服器用 service role 讀。暫存區每天清掉超過一天的檔案（/api/cron/cleanup-uploads）
// ────────────────────────────────────────────────

export const USER_UPLOAD_BUCKET = "user-uploads";
/** 照片最大（手機端都先壓到 1280px，通常 200～500 KB） */
export const USER_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PATH_RE = new RegExp(`^(${UUID})/(${UUID})\\.(jpg|png|webp)$`, "i");

/** 暫存區的路徑：一定要在自己的資料夾、檔名是隨機 id（API 只信這個格式） */
export function isOwnUploadPath(path: unknown, userId: string): path is string {
  if (typeof path !== "string") return false;
  const m = PATH_RE.exec(path);
  return Boolean(m && m[1].toLowerCase() === userId.toLowerCase());
}

export function userUploadPath(userId: string, id: string, mimeType: string): string {
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `${userId}/${id}.${ext}`;
}
