import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { trackAiUsage, checkUserQuota } from "@/lib/ai/usage-tracker";
import { z } from "zod";

const PROMPT = `你是台灣的專業藥師「暖暖」。請仔細看這張**藥袋或處方箋照片**，提取以下藥物資訊。

📌 重要規則：
- 用**繁體中文（台灣用語）**
- 用法用長者聽得懂的話：例如「每天早上吃 1 顆」而不是「q.d.」
- 注意事項要白話：例如「不能跟葡萄柚汁一起吃」而不是醫學術語
- 如果看不清楚或不確定某個欄位，就放 null（不要瞎猜）
- 如果照片不是藥袋，回 { "error": "這不是藥袋照片" }

回傳純 JSON 格式：
{
  "medications": [
    {
      "name": "中文藥名（一定要有）",
      "english_name": "英文名 / 學名（若有顯示）",
      "dose": "每顆劑量（例如「5 mg」）",
      "frequency": "每天吃幾次（例如「每天 2 次」）",
      "timing": "吃的時間（例如「早餐後 + 睡前」）",
      "duration": "吃幾天（例如「連續 7 天」，慢性病就寫「長期」）",
      "purpose": "治什麼（例如「高血壓」，從藥名推測）",
      "warnings": ["每條注意事項（例如「不能跟葡萄柚汁同服」）"],
      "side_effects": ["可能副作用（白話版，例如「可能會頭暈」）"]
    }
  ],
  "summary": "一句溫暖的總結，給長者聽（30 字以內）"
}

⚠️ medications 可以是多種藥（如果一張藥袋有多種）。如果只有一種就只回 1 個。`;

export interface PrescriptionAnalysisResult {
  medications: {
    name: string;
    english_name?: string | null;
    dose?: string | null;
    frequency?: string | null;
    timing?: string | null;
    duration?: string | null;
    purpose?: string | null;
    warnings?: string[] | null;
    side_effects?: string[] | null;
  }[];
  summary?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  // 配額檢查（拍藥袋共用拍照配額）
  const quota = await checkUserQuota(user.id, "photo");
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "本月拍照次數已用完，請升級方案" },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.imageBase64) {
    return NextResponse.json({ error: "缺少圖片" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY 未設定" }, { status: 500 });

  const model = "gemini-2.5-flash"; // 藥袋辨識用 flash 夠用

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const generativeModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3, // 用藥資訊要更精準
      },
    });

    const result = await generativeModel.generateContent([
      { text: PROMPT },
      { inlineData: { data: body.imageBase64, mimeType: body.mimeType || "image/jpeg" } },
    ]);

    const text = result.response.text();
    let parsed: PrescriptionAnalysisResult & { error?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Gemini 回傳格式錯誤");
    }

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const usage = result.response.usageMetadata;
    await trackAiUsage({
      userId: user.id,
      service: "gemini_vision",
      model,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      endpoint: "/api/ai/analyze-prescription",
      success: true,
    });

    return NextResponse.json({ result: parsed });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await trackAiUsage({
      userId: user.id,
      service: "gemini_vision",
      model,
      endpoint: "/api/ai/analyze-prescription",
      success: false,
      errorMessage: msg,
    });
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json({ error: "今日 AI 額度已滿，請明天再試" }, { status: 429 });
    }
    return NextResponse.json({ error: "辨識失敗：" + msg.substring(0, 150) }, { status: 500 });
  }
}
