// ────────────────────────────────────────────────
// 陪伴機器人 — 語音問答（裝置 token 認證）
//
// POST body：
//   - Content-Type: audio/wav → 直接傳 WAV（ESP32 建議走這條，省 base64）
//   - Content-Type: application/json → { audio_base64, mime_type? }（測試方便）
//
// 流程：STT → Gemini 回答（帶語氣與健康背景）→ TTS
// 回應：
//   - 預設回 audio/wav 二進位（機器人邊收邊播），文字放 header：
//       X-User-Text / X-Reply-Text（encodeURIComponent）、X-Mood
//   - ?format=json → 回 JSON（含 audio_base64），curl 測試用
//
// 控費：計 STT 秒數進「語音分鐘」月配額（checkUserQuota），
//       單次錄音上限 2MB（約 60 秒），回答字數上限 120 字。
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireDevice, touchDevice } from "@/lib/device-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getVoiceProvider } from "@/lib/ai/voice-provider";
import { trackAiUsage, checkUserQuota } from "@/lib/ai/usage-tracker";
import { deviceDaySessionId, estimateWavSeconds, normalizeMood } from "@/lib/device-utils";

export const maxDuration = 60; // STT + LLM + TTS 串起來可能超過預設 10 秒

const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // 2MB ≈ 60 秒 16kHz 16-bit mono
const MAX_REPLY_CHARS = 120;

const TONE_PROMPTS: Record<string, string> = {
  warm: "你是「暖暖」，一位溫暖體貼的健康助理。語氣親切，像家人一樣。",
  strict: "你是「暖暖」，一位專業嚴謹的營養師。提供精確的健康建議。",
  grandchild: "你是「暖暖」，扮演用戶的小孫子。撒嬌可愛的口吻，但內容專業。",
};

export async function POST(req: NextRequest) {
  // 1. 裝置認證
  const device = await requireDevice(req);
  if (!device) return NextResponse.json({ error: "裝置未授權" }, { status: 401 });
  void touchDevice(device.deviceId);

  // 2. 語音配額（與 App 語音對話共用同一個月配額）
  const quota = await checkUserQuota(device.userId, "voice");
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "本月語音分鐘已用完", quota: { used: quota.used, limit: quota.limit } },
      { status: 429 }
    );
  }

  // 3. 取音訊（raw binary 或 JSON base64）
  let audio: Buffer;
  let mimeType: string;
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (!body?.audio_base64) {
        return NextResponse.json({ error: "缺少 audio_base64" }, { status: 400 });
      }
      audio = Buffer.from(body.audio_base64, "base64");
      mimeType = body.mime_type || "audio/wav";
    } else {
      audio = Buffer.from(await req.arrayBuffer());
      mimeType = contentType.split(";")[0] || "audio/wav";
    }
  } catch {
    return NextResponse.json({ error: "音訊資料讀取失敗" }, { status: 400 });
  }

  if (audio.length < 1000) return NextResponse.json({ error: "音訊太短" }, { status: 400 });
  if (audio.length > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "音訊太長（單次最多約 60 秒）" }, { status: 400 });
  }

  const headerSeconds = Number(req.headers.get("x-audio-seconds") ?? 0);
  const audioSeconds = headerSeconds > 0 ? Math.min(headerSeconds, 60) : estimateWavSeconds(audio);

  const provider = getVoiceProvider();
  const supabase = createSupabaseAdmin();

  try {
    // 4. STT
    const stt = await provider.transcribe(audio, mimeType);
    await trackAiUsage({
      userId: device.userId,
      service: "openai_realtime", // 秒數計入語音月配額
      model: stt.model,
      audioInputSeconds: audioSeconds,
      endpoint: "/api/device/ask",
      metadata: { source: "device", device_id: device.deviceId, kind: "stt", provider: provider.name },
    });

    if (!stt.text) {
      return await respond(req, {
        userText: "",
        replyText: "我沒有聽清楚，可以再說一次嗎？",
        mood: "care",
        provider,
        device,
        quota,
        skipLog: true,
      });
    }

    // 5. 取用戶背景 → Gemini 回答
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, voice_tone, chronic_conditions, age")
      .eq("id", device.userId)
      .single();

    const tone = TONE_PROMPTS[profile?.voice_tone ?? "warm"] ?? TONE_PROMPTS.warm;
    const prompt = `${tone}

用戶資訊：
- 稱呼：${profile?.display_name ?? "您"}（${profile?.age ?? "?"} 歲）
- 慢性病：${profile?.chronic_conditions?.join("、") || "無"}

用戶對桌上的陪伴機器人說了：「${stt.text}」

請用繁體中文（台灣口語）回答，內容會用語音唸出來，所以：
- 最多 ${MAX_REPLY_CHARS} 字、不要條列、不要 emoji、不要 markdown
- 給長輩聽得懂的具體建議；若在聊天就溫暖陪聊
- 若提到嚴重症狀（胸痛、跌倒、呼吸困難…），提醒盡快聯絡家人或就醫

回覆純 JSON（不要其他文字）：
{ "reply": "要唸出來的回答", "mood": "happy | care | alert | thinking 其中之一（care=關心、alert=需要注意）" }`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY 未設定");
    const llmModel = "gemini-2.5-flash-lite";
    const genAI = new GoogleGenerativeAI(apiKey);
    const m = genAI.getGenerativeModel({
      model: llmModel,
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    });
    const result = await m.generateContent(prompt);
    const usageMeta = result.response.usageMetadata;

    let replyText = "我在這裡陪您，想聊什麼都可以喔。";
    let mood = normalizeMood("happy");
    try {
      const parsed = JSON.parse(result.response.text());
      if (parsed.reply) replyText = String(parsed.reply).substring(0, MAX_REPLY_CHARS);
      mood = normalizeMood(parsed.mood);
    } catch {
      // JSON 壞掉就用預設句，不讓機器人沉默
    }

    await trackAiUsage({
      userId: device.userId,
      service: "gemini_text",
      model: llmModel,
      inputTokens: usageMeta?.promptTokenCount ?? 0,
      outputTokens: usageMeta?.candidatesTokenCount ?? 0,
      endpoint: "/api/device/ask",
      metadata: { source: "device", device_id: device.deviceId },
    });

    // 6. 對話存 DB（同一台裝置同一天 = 同一個 session，後台好看）
    const sessionId = deviceDaySessionId(device.deviceId);
    await supabase.from("conversations").insert([
      { user_id: device.userId, role: "user", content: stt.text, session_id: sessionId },
      { user_id: device.userId, role: "assistant", content: replyText, session_id: sessionId },
    ]);

    // 7. TTS → 回音訊
    return await respond(req, {
      userText: stt.text,
      replyText,
      mood,
      provider,
      device,
      quota,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[device/ask] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** 合成語音並回應（預設 binary WAV + header；?format=json 回 JSON） */
async function respond(
  req: NextRequest,
  opts: {
    userText: string;
    replyText: string;
    mood: string;
    provider: ReturnType<typeof getVoiceProvider>;
    device: { deviceId: string; userId: string };
    quota: { used: number; limit: number };
    skipLog?: boolean;
  }
) {
  const tts = await opts.provider.synthesize(opts.replyText);
  await trackAiUsage({
    userId: opts.device.userId,
    service: "openai_realtime",
    model: tts.model,
    outputTokens: opts.replyText.length, // TTS 以字元數計價（pricing.ts）
    endpoint: "/api/device/ask",
    metadata: { source: "device", device_id: opts.device.deviceId, kind: "tts", provider: opts.provider.name },
  });

  if (req.nextUrl.searchParams.get("format") === "json") {
    return NextResponse.json({
      user_text: opts.userText,
      reply_text: opts.replyText,
      mood: opts.mood,
      audio_base64: tts.audio.toString("base64"),
      mime_type: tts.mimeType,
      quota: opts.quota,
    });
  }

  return new NextResponse(new Uint8Array(tts.audio), {
    status: 200,
    headers: {
      "Content-Type": tts.mimeType,
      "Content-Length": String(tts.audio.length),
      "X-User-Text": encodeURIComponent(opts.userText),
      "X-Reply-Text": encodeURIComponent(opts.replyText),
      "X-Mood": opts.mood,
      "X-Quota-Used": String(opts.quota.used),
      "X-Quota-Limit": String(opts.quota.limit),
    },
  });
}
