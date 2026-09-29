import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resolveGeminiConfig } from "@/lib/ai/gemini";
import { askAboutPhoto } from "@/lib/ai/photo-ask";
import { trackAiUsage, checkUserQuota } from "@/lib/ai/usage-tracker";
import {
  DEFAULT_PHOTO_QUESTION,
  PHOTO_ASK_PLACE_MAX,
  PHOTO_ASK_QUESTION_MAX,
  sanitizeAskText,
} from "@/lib/photo-ask";

// 看圖模型實測約 10～15 秒，預留空間
export const maxDuration = 60;

const ENDPOINT = "/api/ai/photo-ask";

const RequestSchema = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  question: z.string().max(200).optional(),
  place: z.string().max(200).optional(),
});

/** 拍照問暖暖：看照片回答長輩的問題（和拍照記餐共用每月拍照次數） */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const quota = await checkUserQuota(user.id, "photo");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "本月拍照次數已用完",
        quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
        upgradeUrl: "/upgrade",
      },
      { status: 429 }
    );
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }
  const question = sanitizeAskText(body.question, PHOTO_ASK_QUESTION_MAX) || DEFAULT_PHOTO_QUESTION;
  const place = sanitizeAskText(body.place, PHOTO_ASK_PLACE_MAX) || undefined;

  try {
    const { result, usage } = await askAboutPhoto(body.imageBase64, body.mimeType ?? "image/jpeg", { question, place });
    await trackAiUsage({
      userId: user.id,
      service: "gemini_vision",
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      endpoint: ENDPOINT,
      success: true,
      metadata: { provider: usage.provider, category: result.category },
    });
    return NextResponse.json({
      result,
      quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const vision = resolveGeminiConfig();
    await trackAiUsage({
      userId: user.id,
      service: "gemini_vision",
      model: vision.model,
      endpoint: ENDPOINT,
      success: false,
      errorMessage: msg,
      metadata: { provider: vision.provider },
    });
    if (msg.includes("429") || msg.includes("quota") || msg.includes("exceeded")) {
      return NextResponse.json({ error: "今日 AI 辨識次數已達上限，請明天再試或升級方案" }, { status: 429 });
    }
    console.error("[api] 拍照問暖暖失敗:", msg);
    return NextResponse.json({ error: "暖暖這次沒看清楚，換一張清楚一點的再問問看" }, { status: 500 });
  }
}
