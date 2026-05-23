import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkUserQuota } from "@/lib/ai/usage-tracker";

/**
 * 產生 OpenAI Realtime API ephemeral token
 * 前端用這個 token 直接連 WebRTC，不會暴露 master API key
 *
 * 文件：https://platform.openai.com/docs/api-reference/realtime-sessions
 */
export async function POST(req: NextRequest) {
  // 1. 認證
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  // 2. 配額檢查
  const quota = await checkUserQuota(user.id, "voice");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "本月語音對話分鐘已用完",
        quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
      },
      { status: 429 }
    );
  }

  // 3. 取得用戶設定（決定語氣）
  const { data: profile } = await supabase
    .from("profiles")
    .select("voice_tone, chronic_conditions, display_name")
    .eq("id", user.id)
    .single();

  const tone = profile?.voice_tone ?? "warm";
  const instructions = buildInstructions(tone, profile);

  // 4. 跟 OpenAI 換 ephemeral key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY 未設定" }, { status: 500 });
  }

  const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: "shimmer",
        instructions,
        input_audio_transcription: { model: "whisper-1" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "建立語音 session 失敗：" + text },
        { status: 500 }
      );
    }

    const session = await response.json();
    return NextResponse.json({
      session,
      quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildInstructions(
  tone: string,
  profile: { display_name?: string; chronic_conditions?: string[] } | null
): string {
  const name = profile?.display_name ?? "您";
  const conditions = profile?.chronic_conditions?.join("、") ?? "";

  const tonePrompts: Record<string, string> = {
    warm: "你是「暖暖」，一位溫暖體貼的健康助理。語氣親切，像家人一樣。",
    strict: "你是「暖暖」，一位專業嚴謹的營養師。提供精確的健康建議。",
    grandchild: "你是「暖暖」，扮演用戶的小孫子。撒嬌可愛的口吻，但內容專業。",
  };

  return `${tonePrompts[tone] ?? tonePrompts.warm}

用戶資訊：
- 稱呼：${name}
- 慢性病：${conditions || "無"}

請用繁體中文（台灣口語）回應，回答要簡短（30 秒內），給長輩聽得懂的具體建議。`;
}
