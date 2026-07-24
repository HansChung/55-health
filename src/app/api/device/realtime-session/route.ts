// ────────────────────────────────────────────────
// 陪伴機器人 — 即時語音對談 session（第二階段，裝置 token 認證）
//
// POST → 產生 OpenAI Realtime ephemeral client_secret，
// 機器人（ESP32 WebRTC / WebSocket 橋接）拿去直連 OpenAI，
// 不會暴露 master API key。邏輯對照 /api/ai/realtime-session，
// 差別只在認證方式（Supabase cookie → 裝置 token）。
// 沿用同一個「語音分鐘」月配額 + 單次上限 180 秒。
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireDevice, touchDevice } from "@/lib/device-guard";
import { checkUserQuota } from "@/lib/ai/usage-tracker";

export async function POST(req: NextRequest) {
  const device = await requireDevice(req);
  if (!device) return NextResponse.json({ error: "裝置未授權" }, { status: 401 });
  void touchDevice(device.deviceId);

  const quota = await checkUserQuota(device.userId, "voice");
  const maxSeconds = Math.min(180, Math.floor(quota.remainingSeconds ?? quota.limit * 60));
  if (!quota.allowed || maxSeconds <= 0) {
    return NextResponse.json(
      { error: "本月語音對話分鐘已用完", quota: { used: quota.used, limit: quota.limit, tier: quota.tier } },
      { status: 429 }
    );
  }

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("voice_tone, chronic_conditions, display_name")
    .eq("id", device.userId)
    .single();

  const tonePrompts: Record<string, string> = {
    warm: "你是「暖暖」，一位溫暖體貼的健康助理。語氣親切，像家人一樣。",
    strict: "你是「暖暖」，一位專業嚴謹的營養師。提供精確的健康建議。",
    grandchild: "你是「暖暖」，扮演用戶的小孫子。撒嬌可愛的口吻，但內容專業。",
  };
  const instructions = `${tonePrompts[profile?.voice_tone ?? "warm"] ?? tonePrompts.warm}

用戶資訊：
- 稱呼：${profile?.display_name ?? "您"}
- 慢性病：${profile?.chronic_conditions?.join("、") || "無"}

你現在住在用戶桌上的陪伴機器人裡。請用繁體中文（台灣口語）回應，
回答要簡短（30 秒內），給長輩聽得懂的具體建議。`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY 未設定" }, { status: 500 });

  const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model,
          instructions,
          audio: {
            output: { voice: "shimmer" },
            input: { transcription: { model: "whisper-1" } },
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[device/realtime-session] OpenAI 失敗:", response.status, text);
      return NextResponse.json({ error: "暫時無法開始語音對話，請稍後再試" }, { status: 500 });
    }

    const data = await response.json();
    const sessionId: string = data.session?.id ?? "";

    // 與 App 版相同：先記 pending 列，之後用伺服器時間戳當計費下限
    if (sessionId) {
      await admin.from("ai_usage").insert({
        user_id: device.userId,
        service: "openai_realtime",
        model,
        audio_seconds: 0,
        cost_usd: 0,
        endpoint: "/api/device/realtime-session",
        success: true,
        metadata: {
          session_id: sessionId,
          pending: true,
          started_at: new Date().toISOString(),
          max_seconds: maxSeconds,
          source: "device",
          device_id: device.deviceId,
        },
      });
    }

    return NextResponse.json({
      client_secret: data.value,
      session_id: sessionId,
      model,
      max_seconds: maxSeconds,
      quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
    });
  } catch (e) {
    console.error("[device/realtime-session] 例外:", e);
    return NextResponse.json({ error: "暫時無法開始語音對話，請稍後再試" }, { status: 500 });
  }
}
