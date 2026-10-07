// ────────────────────────────────────────────────
// 遊記影片：AI 一次看完 3～5 張照片，每張寫一句（串成一段小遊記，長輩可以再改）
// POST { images: dataURL[], place? } → { lines: string[] }
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { readUserImage, UserUploadError } from "@/lib/ai/user-uploads-server";
import { checkUserQuota, countMonthlyEndpointUsage, trackAiUsage } from "@/lib/ai/usage-tracker";
import { getGeminiModel, isGeminiConfigured, parseModelJson, resolveGeminiConfig } from "@/lib/ai/gemini";
import {
  MONTAGE_MAX_PHOTOS,
  MONTAGE_MAX_TOTAL_CHARS,
  MONTAGE_MIN_PHOTOS,
  buildMontageScriptPrompt,
  sanitizeMontageLine,
  sanitizePlace,
} from "@/lib/travel-video";

const ENDPOINT = "/api/ai/travel-video/montage/script";

export const maxDuration = 60;

const IMAGE_DATA_URL = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;

// 新方式：photoPaths（照片已直傳 Supabase 暫存區）；舊方式：images（data URL 經過 API）
const PostSchema = z
  .object({
    photoPaths: z.array(z.string().max(200)).min(MONTAGE_MIN_PHOTOS).max(MONTAGE_MAX_PHOTOS).optional(),
    images: z.array(z.string().max(1_400_000).regex(IMAGE_DATA_URL)).min(MONTAGE_MIN_PHOTOS).max(MONTAGE_MAX_PHOTOS).optional(),
    place: z.string().max(100).optional(),
  })
  .refine((b) => Boolean(b.photoPaths || b.images), "photos required")
  // 和建立遊記同一個上限：整包超過 Vercel 4.5MB 會在進來之前就被擋掉
  .refine((b) => (b.images ?? []).reduce((n, s) => n + s.length, 0) <= MONTAGE_MAX_TOTAL_CHARS, "too large");

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "AI 暫時忙線，請自己寫寫看" }, { status: 503 });
  }
  const quota = await checkUserQuota(user.id, "montage");
  if (quota.limit === 0) return NextResponse.json({ error: "升級方案就可以做遊記影片喔" }, { status: 429 });
  // AI 寫稿不扣遊記次數，但每月有上限（避免一直按）
  const cap = quota.limit >= 9999 ? Number.POSITIVE_INFINITY : Math.max(5, quota.limit * 3);
  if ((await countMonthlyEndpointUsage(user.id, ENDPOINT)) >= cap) {
    return NextResponse.json({ error: "本月 AI 寫稿的次數用完了，請自己寫寫看" }, { status: 429 });
  }

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: `請先選 ${MONTAGE_MIN_PHOTOS}～${MONTAGE_MAX_PHOTOS} 張照片` }, { status: 400 });
  }

  let images: { data: string; mimeType: string }[];
  if (body.photoPaths) {
    try {
      const admin = createSupabaseAdmin();
      const read = await Promise.all(body.photoPaths.map((p) => readUserImage(admin, user.id, p)));
      images = read.map((img) => ({ data: img.base64, mimeType: img.mimeType }));
    } catch (e) {
      if (e instanceof UserUploadError) return NextResponse.json({ error: e.message }, { status: 400 });
      throw e;
    }
  } else {
    images = body.images!.map((img) => ({ data: img.match(IMAGE_DATA_URL)![1], mimeType: "image/jpeg" }));
  }

  const config = resolveGeminiConfig();
  const count = images.length;
  let tracked = false;
  try {
    const { model } = getGeminiModel({ responseMimeType: "application/json", temperature: 0.8 });
    const result = await model.generateContent([
      { text: buildMontageScriptPrompt(count, sanitizePlace(body.place)) },
      ...images.map((img) => ({ inlineData: img })),
    ]);
    const raw = parseModelJson<{ lines?: unknown }>(result.response.text()).lines;
    const lines = (Array.isArray(raw) ? raw : []).map((l) => sanitizeMontageLine(typeof l === "string" ? l : "")).slice(0, count);
    const usage = result.response.usageMetadata;
    const ok = lines.length === count && lines.every(Boolean);
    await trackAiUsage({
      userId: user.id,
      service: "gemini_text", // 不算進「拍照辨識」次數
      model: config.model,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      endpoint: ENDPOINT,
      success: ok,
      metadata: { provider: config.provider, photos: count },
    });
    tracked = true;
    if (!ok) throw new Error(`expected ${count} lines, got ${lines.filter(Boolean).length}`);
    return NextResponse.json({ lines });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] 遊記稿生成失敗:", msg);
    if (!tracked) {
      await trackAiUsage({
        userId: user.id,
        service: "gemini_text",
        model: config.model,
        endpoint: ENDPOINT,
        success: false,
        errorMessage: msg,
        metadata: { provider: config.provider },
      });
    }
    return NextResponse.json({ error: "AI 這次沒寫出來，請再按一次或自己寫寫看" }, { status: 502 });
  }
}
