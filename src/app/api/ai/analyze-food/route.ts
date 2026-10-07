import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { imageFromRequest, UserUploadError } from "@/lib/ai/user-uploads-server";
import { analyzeFoodImage, resolveGeminiConfig } from "@/lib/ai/gemini";
import { trackAiUsage, checkUserQuota } from "@/lib/ai/usage-tracker";
import { z } from "zod";

// 看圖模型實測約 10～15 秒，預留空間
export const maxDuration = 60;

// 新方式：photoPath（手機已把照片直傳到 Supabase 暫存區）；舊方式：imageBase64（經過 API）
const RequestSchema = z.object({
  photoPath: z.string().max(200).optional(),
  imageBase64: z.string().min(100).optional(),
  mimeType: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // 1. 認證
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  // 2. 配額檢查
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

  // 3. 解析請求
  let body;
  try {
    const json = await req.json();
    body = RequestSchema.parse(json);
  } catch (e) {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  let image: { base64: string; mimeType: string; via: string };
  try {
    image = await imageFromRequest(createSupabaseAdmin(), user.id, body);
  } catch (e) {
    if (e instanceof UserUploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  // 4. 呼叫 Gemini
  try {
    const { result, usage } = await analyzeFoodImage(image.base64, image.mimeType);

    // 5. 記錄用量
    await trackAiUsage({
      userId: user.id,
      service: "gemini_vision",
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      endpoint: "/api/ai/analyze-food",
      success: true,
      metadata: { provider: usage.provider, via: image.via },
    });

    return NextResponse.json({
      result,
      quota: {
        used: quota.used + 1,
        limit: quota.limit,
        tier: quota.tier,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const vision = resolveGeminiConfig();
    await trackAiUsage({
      userId: user.id,
      service: "gemini_vision",
      model: vision.model,
      endpoint: "/api/ai/analyze-food",
      success: false,
      errorMessage: msg,
      metadata: { provider: vision.provider },
    });
    // 對 429 配額錯誤回友善訊息
    if (msg.includes("429") || msg.includes("quota") || msg.includes("exceeded")) {
      return NextResponse.json(
        { error: "今日 AI 辨識次數已達上限，請明天再試或升級方案" },
        { status: 429 }
      );
    }
    console.error("[api] AI 食物分析失敗:", msg);
    return NextResponse.json({ error: "照片分析失敗，換一張清楚一點的再試試" }, { status: 500 });
  }
}
