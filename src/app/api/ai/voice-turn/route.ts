// ────────────────────────────────────────────────
// 跟暖暖聊聊（語音對話）：說一句、回一句
// POST { audioPath | audio, history?, chapterTitle? } → { heard, reply, quota }
// 錄音轉 mp3 → lk888 的 Gemini 一次聽懂並回答；回答由手機念出來（瀏覽器語音，免費）
// 次數和「問暖暖」共用每天的題數（同一個 endpoint 計數）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { toWav, wavDurationSeconds, wavRms, wavToMp3 } from "@/lib/ai/audio-convert";
import { takeUserAudio, UserUploadError } from "@/lib/ai/user-uploads-server";
import { answerVoiceTurn } from "@/lib/ai/voice-chat";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { finishReservedUsage, releaseReservedUsage, reserveDailySlot, trackAiUsage } from "@/lib/ai/usage-tracker";
import { ASK_CHAPTER_TITLE_MAX, ASK_MESSAGE_MAX, askDailyLimit, taipeiDayStartIso } from "@/lib/ask";
import { VOICE_HISTORY_MAX, VOICE_TURN_MAX_SECONDS, VOICE_TURN_MIN_SECONDS, voiceHistory } from "@/lib/voice-chat";

/** 轉檔＋模型，通常 3～5 秒 */
export const maxDuration = 60;

/** 和打字問暖暖共用題數 */
const ENDPOINT = "/api/ai/chat";

const AUDIO_DATA_URL = /^data:audio\/[a-z0-9.+-]+(?:;[a-z0-9=._+-]+)*;base64,([A-Za-z0-9+/]+={0,2})$/i;
/** 1 分鐘：webm／opus 約 0.3MB、Safari mp4 約 1MB；base64 再多 1/3 */
const MAX_AUDIO_CHARS = 3_000_000;
/** 比這更小聲就當作沒錄到聲音 */
const MIN_RMS = 0.003;

const History = z
  .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(ASK_MESSAGE_MAX * 2) }))
  .max(VOICE_HISTORY_MAX * 5)
  .default([]);
const Common = { history: History, chapterTitle: z.string().max(ASK_CHAPTER_TITLE_MAX * 2).nullish() };
const Schema = z.union([
  z.object({ audioPath: z.string().max(200), ...Common }),
  z.object({ audio: z.string().max(MAX_AUDIO_CHARS).regex(AUDIO_DATA_URL), ...Common }),
]);

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const body = parsed.data;
  if (!isGeminiConfigured()) {
    console.error("[api] 語音對話：LK888_API_KEY / GEMINI_API_KEY 未設定");
    return NextResponse.json({ error: "暖暖暫時休息中，請稍後再試" }, { status: 503 });
  }

  // 先拿錄音（直傳的拿到就刪），檢查長度、音量，轉成 mp3
  let raw: Buffer;
  if ("audioPath" in body) {
    try {
      raw = await takeUserAudio(createSupabaseAdmin(), user.id, body.audioPath);
    } catch (e) {
      if (e instanceof UserUploadError) return NextResponse.json({ error: e.message }, { status: 400 });
      console.error("[api] voice turn audio:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
  } else {
    raw = Buffer.from(body.audio.match(AUDIO_DATA_URL)![1], "base64");
  }
  let mp3: Buffer;
  try {
    const wav = await toWav(raw, { maxSeconds: VOICE_TURN_MAX_SECONDS });
    if (wavDurationSeconds(wav) < VOICE_TURN_MIN_SECONDS) {
      return NextResponse.json({ error: "太短了，按一下說完一句話，再按一下送出" }, { status: 400 });
    }
    if (wavRms(wav) < MIN_RMS) return NextResponse.json({ error: "沒聽到聲音，請靠近手機再說一次" }, { status: 400 });
    mp3 = await wavToMp3(wav);
  } catch (e) {
    console.warn("[api] voice turn convert failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "錄音讀不出來，請再說一次" }, { status: 400 });
  }

  const { profile, tier } = await loadAsker(user.id, user.email);
  const limit = askDailyLimit(tier);
  // 先佔一格（同時送出好幾句也不會超過每天的題數）；管理員不限，不用佔
  let slot: { id: string | null; used: number } = { id: null, used: 0 };
  if (tier !== "admin") {
    try {
      slot = await reserveDailySlot({ userId: user.id, service: "gemini_text", endpoint: ENDPOINT, sinceIso: taipeiDayStartIso(), limit });
    } catch (e) {
      console.error("[api] voice turn quota:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!slot.id) {
      return NextResponse.json(
        {
          error: `今天的 ${limit} 句聊完了（和問暖暖一起算），明天再來找暖暖聊天吧`,
          quota: { used: limit, limit },
          ...(tier === "free" || tier === "basic" ? { upgradeUrl: "/pricing" } : {}),
        },
        { status: 429 }
      );
    }
  }

  const chapterTitle = body.chapterTitle ? [...body.chapterTitle.trim()].slice(0, ASK_CHAPTER_TITLE_MAX).join("") : null;
  const history = voiceHistory(body.history);
  try {
    const { heard, reply, usage } = await answerVoiceTurn(mp3, history, {
      displayName: profile?.display_name,
      age: profile?.age,
      conditions: profile?.chronic_conditions,
      tone: profile?.voice_tone,
      mode: "chat",
      chapterTitle,
      guide: null,
    });
    const metadata = { provider: usage.provider, mode: "voice", turns: history.length + 1 };
    if (slot.id) {
      await finishReservedUsage(slot.id, { model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, metadata });
    } else {
      await trackAiUsage({
        userId: user.id,
        service: "gemini_text",
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        endpoint: ENDPOINT,
        success: true,
        metadata,
      });
    }
    return NextResponse.json({ heard, reply, quota: { used: slot.id ? slot.used : 0, limit } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] 語音對話失敗:", msg);
    if (slot.id) await releaseReservedUsage(slot.id); // 沒回成功不算題數
    await trackAiUsage({
      userId: user.id,
      service: "gemini_text",
      model: "unknown",
      endpoint: ENDPOINT,
      success: false,
      errorMessage: msg.slice(0, 500),
      metadata: { mode: "voice" },
    }).catch(() => undefined);
    return NextResponse.json({ error: "暖暖這次沒聽清楚，請再說一次" }, { status: 502 });
  }
}
