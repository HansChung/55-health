// 瀏覽器端：上傳前把大圖縮小（長邊 1600px、JPEG 85%）
// 手機照片常有 5–12MB，縮完通常 < 1MB，上傳快、長輩手機看也省流量

export const MAX_IMAGE_DIMENSION = 1600;
/** 小於這個大小、尺寸也不超標的圖就不重新壓縮（保留原畫質） */
const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024;

/** 等比縮放到長邊不超過 max；本來就小的不放大 */
export function fitWithin(width: number, height: number, max: number = MAX_IMAGE_DIMENSION) {
  const longest = Math.max(width, height);
  if (longest <= max || longest === 0) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function prepareImageForUpload(file: File): Promise<Blob> {
  // GIF 可能是動畫，重畫會失去動態 → 原檔上傳（伺服端仍有大小限制）
  if (file.type === "image/gif") return file;
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // 解不開就交給伺服端判斷
  }
  const target = fitWithin(bitmap.width, bitmap.height);
  const shrinking = target.width !== bitmap.width;
  if (!shrinking && file.size <= SKIP_BELOW_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  // PNG 透明底轉 JPEG 會變黑 → 先鋪白底（活動卡片本來就是淺色）
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) return file;
  // 有縮尺寸就一定用縮過的（控制顯示大小）；沒縮尺寸則只在檔案變小時才換
  return shrinking || blob.size < file.size ? blob : file;
}
