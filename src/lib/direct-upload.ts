// ────────────────────────────────────────────────
// 照片直傳 Supabase（手機 → Supabase，不經過 Vercel）
// 同一張照片只傳一次（拍照問暖暖追問、AI 寫口白再送出都共用）；
// 直傳失敗（例如還沒跑 add-user-uploads.sql、網路問題）就回 null，呼叫端改用舊方式（base64 經過 API）
// ────────────────────────────────────────────────
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { AUDIO_UPLOAD_MAX_BYTES, USER_UPLOAD_BUCKET, USER_UPLOAD_MAX_BYTES, audioUploadType, userUploadPath } from "@/lib/user-uploads";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
/** 暫存區每天清掉超過一天的檔案：記住的路徑 6 小時後就重新上傳，不會拿到已經被清掉的 */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; task: Promise<string | null> }>();
const CACHE_MAX = 20;

async function upload(dataUrl: string): Promise<string | null> {
  try {
    const supabase = createSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const blob = await (await fetch(dataUrl)).blob();
    if (blob.size === 0 || blob.size > USER_UPLOAD_MAX_BYTES) return null;
    const type = ALLOWED.includes(blob.type) ? blob.type : "image/jpeg";
    const path = userUploadPath(user.id, crypto.randomUUID(), type);
    const { error } = await supabase.storage
      .from(USER_UPLOAD_BUCKET)
      .upload(path, blob, { contentType: type, upsert: false, cacheControl: "60" });
    if (error) {
      console.warn("[upload] direct upload failed, falling back:", error.message);
      return null;
    }
    return path;
  } catch (e) {
    console.warn("[upload] direct upload failed, falling back:", e);
    return null;
  }
}

/** 把照片（data URL）傳到暫存區，回路徑；失敗回 null */
export function stagePhoto(dataUrl: string): Promise<string | null> {
  const hit = cache.get(dataUrl);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.task;
  const task = upload(dataUrl).then((path) => {
    if (!path) cache.delete(dataUrl); // 失敗不要記住，下次再試
    return path;
  });
  cache.delete(dataUrl);
  cache.set(dataUrl, { at: Date.now(), task });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  return task;
}

/** 給 API 的照片欄位：傳得上去就只帶路徑，不然帶 base64（舊方式） */
export async function photoPayload(dataUrl: string): Promise<{ photoPath: string } | { imageBase64: string; mimeType: string }> {
  const path = await stagePhoto(dataUrl);
  if (path) return { photoPath: path };
  const [head, base64 = ""] = dataUrl.split(",");
  const mimeType = /data:([^;]+)/.exec(head)?.[1] ?? "image/jpeg";
  return { imageBase64: base64, mimeType };
}

/** 單張影片：{ photoPath } 或 { image: data URL } */
export async function videoPhotoPayload(dataUrl: string): Promise<{ photoPath: string } | { image: string }> {
  const path = await stagePhoto(dataUrl);
  return path ? { photoPath: path } : { image: dataUrl };
}

/** 好幾張（遊記）：全部傳上去才用路徑；有一張失敗就整包用舊方式 */
export async function stagePhotos(dataUrls: string[]): Promise<string[] | null> {
  const paths = await Promise.all(dataUrls.map((d) => stagePhoto(d)));
  return paths.every((p): p is string => Boolean(p)) ? (paths as string[]) : null;
}

/** 錄音直傳暫存區，回路徑；失敗回 null（伺服器拿到就會刪掉，所以不快取） */
export async function stageAudio(blob: Blob): Promise<string | null> {
  try {
    const type = audioUploadType(blob.type);
    if (!type || blob.size === 0 || blob.size > AUDIO_UPLOAD_MAX_BYTES) return null;
    const supabase = createSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const path = `${user.id}/${crypto.randomUUID()}.${type.ext}`;
    const { error } = await supabase.storage
      .from(USER_UPLOAD_BUCKET)
      .upload(path, blob, { contentType: type.contentType, upsert: false, cacheControl: "60" });
    if (error) {
      console.warn("[upload] direct audio upload failed, falling back:", error.message);
      return null;
    }
    return path;
  } catch (e) {
    console.warn("[upload] direct audio upload failed, falling back:", e);
    return null;
  }
}

function blobToDataUrlLocal(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** 給 API 的錄音欄位：傳得上去就只帶路徑，不然帶 data URL（舊方式） */
export async function audioPayload(blob: Blob): Promise<{ audioPath: string } | { audio: string }> {
  const path = await stageAudio(blob);
  return path ? { audioPath: path } : { audio: await blobToDataUrlLocal(blob) };
}
