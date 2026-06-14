import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota } from "@/lib/ai/usage-tracker";

/**
 * 產生 OpenAI Realtime API GA ephemeral client_secret
 * 前端用這個 token 直接連 WebRTC，不會暴露 master API key
 *
 * 文件：https://platform.openai.com/docs/api-reference/realtime-sessions/create
 * GA endpoint: POST /v1/realtime/client_secrets
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
  const maxSeconds = Math.min(180, Math.floor(quota.remainingSeconds ?? quota.limit * 60));
  if (maxSeconds <= 0) {
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

  // 4. 跟 OpenAI 換 ephemeral key（GA endpoint）
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY 未設定" }, { status: 500 });
  }

  const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model,
          instructions,
          audio: {
            output: { voice: "shimmer" },
            input: {
              transcription: { model: "whisper-1" },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[api] OpenAI 建立 session 失敗:", response.status, text);
      return NextResponse.json(
        { error: "暫時無法開始語音對話，請稍後再試" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const sessionId: string = data.session?.id ?? "";

    // 計費完整性：在建立時就記下「伺服器端開始時間」與 max_seconds，
    // 之後回報用量時用伺服器算的實際經過秒數當下限，避免 client 低報秒數繞過配額。
    if (sessionId) {
      try {
        const admin = createSupabaseAdmin();
        await admin.from("ai_usage").insert({
          user_id: user.id,
          service: "openai_realtime",
          model,
          audio_seconds: 0,
          cost_usd: 0,
          endpoint: "/api/ai/realtime-session",
          success: true,
          metadata: {
            session_id: sessionId,
            pending: true,
            started_at: new Date().toISOString(),
            max_seconds: maxSeconds,
          },
        });
      } catch (e) {
        console.error("[api] 記錄語音 session 開始時間失敗:", e);
      }
    }

    // GA 回傳格式：{ value: "ek_...", expires_at, session: {...} }
    // 把它包成前端期待的格式：{ session: { client_secret: { value }, id } }
    return NextResponse.json({
      session: {
        client_secret: { value: data.value },
        id: sessionId,
        model,
      },
      quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
      max_seconds: maxSeconds,
    });
  } catch (error: unknown) {
    console.error("[api] 建立語音 session 例外:", error);
    return NextResponse.json({ error: "暫時無法開始語音對話，請稍後再試" }, { status: 500 });
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
