// ────────────────────────────────────────────────
// 照片直傳：伺服器讀暫存區的照片（下載、驗證格式），或直接在 Supabase 裡複製到正式位置
// （複製是 Supabase 內部動作，照片不經過我們的函式）
// ────────────────────────────────────────────────
import { createSupabaseAdmin } from "../supabase/server";
import { sniffImageType } from "../admin-media";
import { AUDIO_UPLOAD_MAX_BYTES, USER_UPLOAD_BUCKET, USER_UPLOAD_MAX_BYTES, isOwnUploadPath } from "../user-uploads";

type Admin = ReturnType<typeof createSupabaseAdmin>;

/** 照片路徑不對、找不到、格式不對：回給長輩看的錯誤（400） */
export class UserUploadError extends Error {}

export type UploadedImageType = "image/jpeg" | "image/png" | "image/webp";

export async function readUserImage(
  admin: Admin,
  userId: string,
  path: unknown
): Promise<{ buffer: Buffer; base64: string; mimeType: UploadedImageType }> {
  if (!isOwnUploadPath(path, userId)) throw new UserUploadError("照片位置不對，請重新選一次照片");
  const { data, error } = await admin.storage.from(USER_UPLOAD_BUCKET).download(path);
  if (error || !data) throw new UserUploadError("找不到剛剛上傳的照片，請重新選一次");
  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.length === 0 || buffer.length > USER_UPLOAD_MAX_BYTES) throw new UserUploadError("照片太大了，請換一張");
  const type = sniffImageType(buffer);
  if (type !== "image/jpeg" && type !== "image/png" && type !== "image/webp") {
    throw new UserUploadError("看不懂這張照片的格式，請換一張（JPG 最好）");
  }
  return { buffer, base64: buffer.toString("base64"), mimeType: type };
}

/** 暫存區 → 正式位置（例如 travel-videos/{user}/{影片}/photo.jpg）；不經過函式 */
export async function copyUserUpload(
  admin: Admin,
  userId: string,
  path: unknown,
  destBucket: string,
  destPath: string
): Promise<void> {
  if (!isOwnUploadPath(path, userId)) throw new UserUploadError("照片位置不對，請重新選一次照片");
  const { error } = await admin.storage.from(USER_UPLOAD_BUCKET).copy(path, destPath, { destinationBucket: destBucket });
  if (error) {
    if (/not.?found/i.test(error.message)) throw new UserUploadError("找不到剛剛上傳的照片，請重新選一次");
    throw new Error(`copy upload failed: ${error.message}`);
  }
}

/** 超過一天的暫存照片清掉（每天的 cron 叫）：一批一批清，清完或時間快到就停 */
export async function cleanupStaleUserUploads(admin: Admin, opts: { batch?: number; budgetMs?: number } = {}): Promise<number> {
  const batch = opts.batch ?? 1000;
  const deadline = Date.now() + (opts.budgetMs ?? 45_000);
  let removed = 0;
  while (Date.now() < deadline) {
    const { data, error } = await admin.rpc("stale_user_uploads", { max_rows: batch });
    if (error) throw new Error(`list stale uploads failed: ${error.message}`);
    const names = ((data ?? []) as unknown[]).filter((n): n is string => typeof n === "string");
    for (let i = 0; i < names.length; i += 100) {
      const { error: rmErr } = await admin.storage.from(USER_UPLOAD_BUCKET).remove(names.slice(i, i + 100));
      if (rmErr) throw new Error(`remove stale uploads failed: ${rmErr.message}`);
    }
    removed += names.length;
    if (names.length < batch) break;
  }
  return removed;
}

/** 舊方式（base64 經過 API）最多收多大：Vercel 本來就擋 4.5 MB 以上的請求 */
const MAX_BODY_BASE64 = 6_000_000;

/**
 * API 收到的照片：新方式帶 photoPath（照片在暫存區），舊方式帶 imageBase64。
 * 回 base64 給看圖模型（Gemini inlineData 只吃 base64）
 */
export async function imageFromRequest(
  admin: Admin,
  userId: string,
  body: { photoPath?: unknown; imageBase64?: unknown; mimeType?: unknown }
): Promise<{ base64: string; mimeType: string; via: "storage" | "body" }> {
  if (body.photoPath != null && body.photoPath !== "") {
    const img = await readUserImage(admin, userId, body.photoPath);
    return { base64: img.base64, mimeType: img.mimeType, via: "storage" };
  }
  if (typeof body.imageBase64 === "string" && body.imageBase64.length >= 100 && body.imageBase64.length <= MAX_BODY_BASE64) {
    const mime = typeof body.mimeType === "string" && ["image/jpeg", "image/png", "image/webp"].includes(body.mimeType)
      ? body.mimeType
      : "image/jpeg";
    return { base64: body.imageBase64, mimeType: mime, via: "body" };
  }
  throw new UserUploadError("缺少照片，請重新選一次");
}

/**
 * 錄音（語音留言、我的聲音）：從暫存區拿，**拿到就刪**——原始錄音不保留
 * （我的聲音承諾不存原始錄音；語音留言會另外轉成 m4a 存在影片底下）
 */
export async function takeUserAudio(admin: Admin, userId: string, path: unknown): Promise<Buffer> {
  if (!isOwnUploadPath(path, userId, "audio")) throw new UserUploadError("錄音位置不對，請再錄一次");
  const bucket = admin.storage.from(USER_UPLOAD_BUCKET);
  const { data, error } = await bucket.download(path);
  await bucket.remove([path]).catch(() => undefined);
  if (error || !data) throw new UserUploadError("找不到剛剛的錄音，請再錄一次");
  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.length === 0 || buffer.length > AUDIO_UPLOAD_MAX_BYTES) throw new UserUploadError("錄音太長了，請錄短一點");
  return buffer;
}
