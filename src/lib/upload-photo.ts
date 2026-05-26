import { createSupabaseBrowser } from "./supabase/client";

/**
 * 把 data URL 上傳到 Supabase Storage（meal-photos bucket）
 * 回傳 public URL，存到 meals.photo_url
 */
export async function uploadMealPhoto(
  userId: string,
  dataUrl: string
): Promise<string | null> {
  try {
    // data URL → Blob
    const blob = await dataUrlToBlob(dataUrl);

    // 路徑：{user_id}/{timestamp}-{random}.jpg
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const supabase = createSupabaseBrowser();
    const { error } = await supabase.storage
      .from("meal-photos")
      .upload(fileName, blob, {
        contentType: "image/jpeg",
        cacheControl: "31536000", // 一年快取
      });

    if (error) {
      console.error("[uploadMealPhoto] failed:", error);
      return null;
    }

    // 拿 public URL
    const { data } = supabase.storage.from("meal-photos").getPublicUrl(fileName);
    console.log("[uploadMealPhoto] uploaded:", data.publicUrl);
    return data.publicUrl;
  } catch (e) {
    console.error("[uploadMealPhoto] threw:", e);
    return null;
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}
