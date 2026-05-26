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

  console.log("[compressImage] file:", file.name, file.type, Math.round(file.size / 1024), "KB");

  // 偵測常見不支援格式
  const isHeic = file.type === "image/heic" || file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
  if (isHeic) {
    throw new Error("瀏覽器不支援 iPhone 的 HEIC 格式。請到 iPhone 設定 → 相機 → 格式 → 改為「相容性最高」（拍出 JPG），或先轉檔。");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("檔案類型不是圖片：" + (file.type || "未知"));
  }

  // 先讀進來
  let dataUrl: string;
  try {
    dataUrl = await readAsDataURL(file);
  } catch (e) {
    throw new Error("讀取檔案失敗，可能檔案損壞");
  }

  // 載入圖片到 <img>
  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch (e) {
    throw new Error("圖片格式不支援，請改用 JPG 或 PNG");
  }

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

  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch (e) {
    throw new Error("Canvas 輸出失敗：" + (e as Error).message);
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader 錯誤"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load 失敗"));
    img.src = src;
  });
}
