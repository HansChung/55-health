/**
 * 圖片工具 — 壓縮 + 縮小，避免大圖造成瀏覽器卡頓 / data URL 超大無法顯示
 */

interface CompressOptions {
  maxSide?: number;     // 長邊最大像素（預設 1280）
  quality?: number;     // JPEG 品質 0-1（預設 0.85）
}

/** 把 File 壓縮成 data URL（小巧、適合顯示和上傳）*/
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const { maxSide = 1280, quality = 0.85 } = options;

  // 先讀進來
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  // 算縮放後尺寸
  const longest = Math.max(img.width, img.height);
  const scale = longest > maxSide ? maxSide / longest : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  // 用 canvas 重新繪製
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context 取得失敗");
  ctx.drawImage(img, 0, 0, w, h);

  // 輸出 JPEG（檔案小）
  return canvas.toDataURL("image/jpeg", quality);
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
