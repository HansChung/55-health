// ────────────────────────────────────────────────
// 後台圖片上傳（合作活動等）→ Supabase Storage「admin-media」公開 bucket
//
// 安全：
//   - 只有管理員 API 會呼叫（service role 寫入；bucket 對外只能讀）
//   - 用檔案「內容開頭的位元組」判斷真實格式，不信任檔名或瀏覽器宣稱的類型
//   - 只收 JPEG／PNG／WebP／GIF；不收 SVG（SVG 可夾帶程式碼）
// bucket 不存在時第一次上傳會自動建立，不需要另外跑 SQL。
// ────────────────────────────────────────────────

export const ADMIN_MEDIA_BUCKET = "admin-media";
/** Vercel 函式請求上限約 4.5MB；前端會先壓縮，這裡再守一道 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
/** 允許的存放資料夾（白名單，避免亂寫路徑） */
export const UPLOAD_FOLDERS = ["campaigns"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export function isUploadFolder(v: unknown): v is UploadFolder {
  return typeof v === "string" && (UPLOAD_FOLDERS as readonly string[]).includes(v);
}

/** 看檔案開頭的「魔術位元組」判斷真實圖片格式；不是支援的圖片就回 null */
export function sniffImageType(b: Uint8Array): AllowedImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return "image/png";
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) {
    return "image/gif";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "image/webp";
  return null;
}

const EXT: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** campaigns/2026/09/1757570000000-a1b2c3.jpg（檔名不含使用者輸入） */
export function buildMediaPath(
  folder: UploadFolder,
  type: AllowedImageType,
  now: number = Date.now(),
  rand: string = Math.random().toString(36).slice(2, 8)
): string {
  const d = new Date(now);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${folder}/${yyyy}/${mm}/${now}-${rand.replace(/[^a-z0-9]/gi, "")}.${EXT[type]}`;
}

/** 只用到 Storage 的這幾個方法，方便測試時替換 */
export interface StorageLike {
  storage: {
    createBucket: (
      id: string,
      opts: { public: boolean; fileSizeLimit?: number; allowedMimeTypes?: string[] }
    ) => Promise<{ error: { message: string } | null }>;
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Uint8Array | Blob,
        opts: { contentType: string; cacheControl?: string; upsert?: boolean }
      ) => Promise<{ error: { message: string } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
}

export type UploadResult =
  | { ok: true; url: string; path: string; type: AllowedImageType }
  | { ok: false; status: number; error: string };

export async function uploadAdminImage(
  supabase: StorageLike,
  bytes: Uint8Array,
  folder: UploadFolder
): Promise<UploadResult> {
  if (bytes.length === 0) return { ok: false, status: 400, error: "檔案是空的" };
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 413, error: "圖片超過 4MB，請換一張較小的圖" };
  }
  const type = sniffImageType(bytes);
  if (!type) return { ok: false, status: 415, error: "只支援 JPG、PNG、WebP、GIF 圖片" };

  const path = buildMediaPath(folder, type);
  const put = () =>
    supabase.storage.from(ADMIN_MEDIA_BUCKET).upload(path, bytes, {
      contentType: type,
      cacheControl: "31536000",
      upsert: false,
    });

  let { error } = await put();
  if (error && /bucket not found/i.test(error.message)) {
    const created = await supabase.storage.createBucket(ADMIN_MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
    });
    if (created.error && !/already exists/i.test(created.error.message)) {
      console.error("[admin-media] 建立 bucket 失敗:", created.error);
      return { ok: false, status: 500, error: "圖片空間建立失敗，請稍後再試" };
    }
    ({ error } = await put());
  }
  if (error) {
    console.error("[admin-media] 上傳失敗:", error);
    return { ok: false, status: 500, error: "上傳失敗，請稍後再試" };
  }

  const { data } = supabase.storage.from(ADMIN_MEDIA_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path, type };
}
