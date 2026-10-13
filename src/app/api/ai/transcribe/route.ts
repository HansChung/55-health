// ────────────────────────────────────────────────
// 說話變文字（伺服器聽寫）：App 的 Android WebView、Firefox 沒有瀏覽器內建語音辨識時用
// POST { audioPath | audio, where? } → { text, quota }
// 錄音拿到就刪（直傳暫存區）、不保存；轉 mp3 → 平台的 Gemini 聽寫，每句約 0.001 算力
// 每天幾句照後台「方案與次數」（dictation_daily）；沒聽到聲音、太短的不算次數
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { toWav, wavDurationSeconds, wavRms, wavToMp3 } from "@/lib/ai/audio-convert";
import { takeUserAudio, UserUploadError } from "@/lib/ai/user-uploads-server";
import { transcribeSpeech } from "@/lib/ai/transcribe";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { finishReservedUsage, releaseReservedUsage, reserveDailySlot, trackAiUsage } from "@/lib/ai/usage-tracker";
import { blockedResponse } from "@/lib/plan-access-server";
import { taipeiDayStartIso } from "@/lib/ask";
import { DICTATION_MAX_SECONDS } from "@/lib/dictation";

export const maxDuration = 60;

const ENDPOINT = "/api/ai/transcribe";
const AUDIO_DATA_URL = /^data:audio\/[a-z0-9.+-]+(?:;[a-z0-9=._+-]+)*;base64,([A-Za-z0-9+/]+={0,2})$/i;
/** 30 秒：webm／opus 約 0.15MB、Safari mp4 約 0.5MB；base64 再多 1/3 */
const MAX_AUDIO_CHARS = 1_500_000;
const MIN_SECONDS = 0.5;
const MIN_RMS = 0.003;

const Common = { where: z.string().max(40).optional() };
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

  // 先拿錄音（直傳的拿到就刪；不管後面怎麼回，暫存區都不會留著錄音）
  let raw: Buffer;
  if ("audioPath" in body) {
    try {
      raw = await takeUserAudio(createSupabaseAdmin(), user.id, body.audioPath);
    } catch (e) {
      if (e instanceof UserUploadError) return NextResponse.json({ error: e.message }, { status: 400 });
      console.error("[api] transcribe audio:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
  } else {
    raw = Buffer.from(body.audio.match(AUDIO_DATA_URL)![1], "base64");
  }
  if (!isGeminiConfigured()) return NextResponse.json({ error: "用說的功能暫時休息中，請先用打字" }, { status: 503 });

  const { tier, access } = await loadAsker(user.id, user.email);
  const blocked = blockedResponse(access, "dictation");
  if (blocked) return blocked;

  // 太短、沒聲音：不算次數，也不用叫 AI
  let mp3: Buffer;
  try {
    const wav = await toWav(raw, { maxSeconds: DICTATION_MAX_SECONDS });
    if (wavDurationSeconds(wav) < MIN_SECONDS || wavRms(wav) < MIN_RMS) {
      return NextResponse.json({ error: "沒有聽到聲音，請靠近手機再說一次", code: "no-speech" }, { status: 400 });
    }
    mp3 = await wavToMp3(wav);
  } catch (e) {
    console.warn("[api] transcribe convert failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "錄音讀不出來，請再說一次" }, { status: 400 });
  }

  const limit = access.limit("dictation_daily");
  let slot: { id: string | null; used: number } = { id: null, used: 0 };
  if (tier !== "admin") {
    try {
      slot = await reserveDailySlot({ userId: user.id, service: "gemini_text", endpoint: ENDPOINT, sinceIso: taipeiDayStartIso(), limit });
    } catch (e) {
      console.error("[api] transcribe quota:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!slot.id) {
      return NextResponse.json(
        { error: `今天用說的 ${limit} 句用完了，明天再來，或先用打字`, code: "quota", quota: { used: limit, limit } },
        { status: 429 }
      );
    }
  }

  try {
    const { text, usage } = await transcribeSpeech(mp3);
    if (!text) {
      // 模型說沒聽到人聲：不算次數
      if (slot.id) await releaseReservedUsage(slot.id);
      return NextResponse.json({ error: "沒有聽清楚，請再說一次", code: "no-speech" }, { status: 400 });
    }
    const metadata = { provider: usage.provider, mode: "dictation", where: body.where ?? null, chars: [...text].length };
    if (slot.id) await finishReservedUsage(slot.id, { model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, metadata });
    else await trackAiUsage({ userId: user.id, service: "gemini_text", model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, endpoint: ENDPOINT, success: true, metadata });
    return NextResponse.json({ text, quota: { used: slot.id ? slot.used : 0, limit } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] 用說的聽寫失敗:", msg);
    if (slot.id) await releaseReservedUsage(slot.id);
    await trackAiUsage({ userId: user.id, service: "gemini_text", model: "unknown", endpoint: ENDPOINT, success: false, errorMessage: msg.slice(0, 500), metadata: { mode: "dictation" } }).catch(() => undefined);
    return NextResponse.json({ error: "這次沒聽清楚，請再說一次" }, { status: 502 });
  }
}
