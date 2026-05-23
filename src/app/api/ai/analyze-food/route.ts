import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { analyzeFoodImage } from "@/lib/ai/gemini";
import { trackAiUsage, checkUserQuota } from "@/lib/ai/usage-tracker";
import { z } from "zod";

const RequestSchema = z.object({
  imageBase64: z.string().min(100),
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

  // 4. 呼叫 Gemini
  try {
    const { result, usage } = await analyzeFoodImage(
      body.imageBase64,
      body.mimeType ?? "image/jpeg"
    );

    // 5. 記錄用量
    await trackAiUsage({
      userId: user.id,
      service: "gemini_vision",
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      endpoint: "/api/ai/analyze-food",
      success: true,
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
    await trackAiUsage({
      userId: user.id,
      service: "gemini_vision",
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
      endpoint: "/api/ai/analyze-food",
      success: false,
      errorMessage: msg,
    });
    return NextResponse.json({ error: "AI 分析失敗：" + msg }, { status: 500 });
  }
}
