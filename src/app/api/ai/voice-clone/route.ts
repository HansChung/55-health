// ────────────────────────────────────────────────
// 我的聲音（專業版）：錄一段自己的聲音 → 複製成配音用的音色，出遊影片口白就用自己的聲音念
// GET    → { status: MyVoiceStatus }
// POST   { audio: dataURL（瀏覽器錄音 webm／mp4／wav…）, consent: true } → { status }
// DELETE → 不再使用（軟刪除；平台端沒有刪除 API）
// 錄音只轉成 WAV 送去平台，我們不保存原始錄音
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota, trackAiUsage } from "@/lib/ai/usage-tracker";
import { isVideoProviderConfigured, VideoProviderError } from "@/lib/ai/lk888-video";
import { CLONE_TTS_MODEL, cloneVoice, wavDurationSeconds } from "@/lib/ai/lk888-tts";
import { toWav, wavRms } from "@/lib/ai/audio-convert";
import { TRAVEL_VIDEO_BUCKET } from "@/lib/ai/travel-video-server";
import {
  loadActiveVoice,
  remainingClones,
  toMyVoice,
  voiceCloneAllowed,
} from "@/lib/ai/voice-clone-server";
import {
  VOICE_CONSENT_TEXT,
  VOICE_SAMPLE_MAX_SECONDS,
  VOICE_SAMPLE_MIN_SECONDS,
  type MyVoiceStatus,
} from "@/lib/travel-video";

const ENDPOINT = "/api/ai/voice-clone";
/** 平台新音色的有效期（沒回 expires_at 時用） */
const UNUSED_VOICE_TTL_MS = 7 * 86_400_000;
/** 1 分鐘的錄音：webm／opus 約 0.3MB、Safari mp4 約 1MB；base64 再多 1/3 */
const MAX_AUDIO_CHARS = 3_000_000;
const AUDIO_DATA_URL = /^data:audio\/[a-z0-9.+-]+(?:;[a-z0-9=._+-]+)*;base64,([A-Za-z0-9+/]+={0,2})$/i;
/** 比這更小聲就當作沒錄到聲音（16-bit 滿格＝1） */
const MIN_RMS = 0.005;

/**
 * 平台給的試聽是約 2 天後過期的簽名網址（放在大陸的雲端空間）→ 轉成 WAV 存到自己的 Storage，
 * 之後打開「我的聲音」都聽得到；失敗就不給試聽（不影響聲音本身）
 */
async function keepDemo(admin: ReturnType<typeof createSupabaseAdmin>, userId: string, cloneId: string, url: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const wav = await toWav(Buffer.from(await res.arrayBuffer()), { maxSeconds: 30 });
    const path = `${userId}/voice/${cloneId}-demo.wav`;
    const { error } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).upload(path, wav, { contentType: "audio/wav", upsert: true });
    if (error) throw error;
    return admin.storage.from(TRAVEL_VIDEO_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.warn("[api] voice demo copy failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export const maxDuration = 60;

const PostSchema = z.object({
  audio: z.string().max(MAX_AUDIO_CHARS).regex(AUDIO_DATA_URL),
  consent: z.literal(true),
});

async function currentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function buildStatus(userId: string, tier: string): Promise<MyVoiceStatus> {
  const admin = createSupabaseAdmin();
  const [row, remaining] = await Promise.all([loadActiveVoice(admin, userId), remainingClones(admin, userId)]);
  return {
    allowed: voiceCloneAllowed(tier),
    voice: row ? toMyVoice(row) : null,
    remaining: tier === "admin" ? Math.max(remaining, 1) : remaining,
  };
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { tier } = await checkUserQuota(user.id, "video");
  try {
    return NextResponse.json({ status: await buildStatus(user.id, tier) });
  } catch (e) {
    // 還沒跑 add-narration-voices.sql：當作沒有錄過
    console.warn("[api] voice clone status:", e instanceof Error ? e.message : e);
    return NextResponse.json({ status: { allowed: false, voice: null, remaining: 0 } satisfies MyVoiceStatus });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  if (!isVideoProviderConfigured()) {
    return NextResponse.json({ error: "這個功能還在準備中，請稍後再試" }, { status: 503 });
  }

  const { tier } = await checkUserQuota(user.id, "video");
  if (!voiceCloneAllowed(tier)) {
    return NextResponse.json(
      { error: "用自己的聲音念是專業版功能，升級後就可以使用", upgradeUrl: "/pricing" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "錄音格式不對，請再錄一次（要勾選同意）" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  if (tier !== "admin" && (await remainingClones(admin, user.id)) <= 0) {
    return NextResponse.json({ error: "這個月重錄的次數用完了，下個月再來錄喔" }, { status: 429 });
  }

  // 轉成 WAV、檢查長度與音量（太短、沒聲音都不送去平台，省錢）
  let wav: Buffer;
  let seconds: number;
  try {
    const [, b64] = body.audio.match(AUDIO_DATA_URL)!;
    wav = await toWav(Buffer.from(b64, "base64"), { maxSeconds: VOICE_SAMPLE_MAX_SECONDS });
    seconds = wavDurationSeconds(wav);
  } catch (e) {
    console.warn("[api] voice sample convert failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "錄音讀不出來，請再錄一次" }, { status: 400 });
  }
  if (seconds < VOICE_SAMPLE_MIN_SECONDS) {
    return NextResponse.json(
      { error: `錄音太短了（${Math.round(seconds)} 秒），請把整段念完，至少 ${VOICE_SAMPLE_MIN_SECONDS} 秒` },
      { status: 400 }
    );
  }
  if (wavRms(wav) < MIN_RMS) {
    return NextResponse.json({ error: "錄音裡聽不到聲音，請靠近手機、大聲一點再錄一次" }, { status: 400 });
  }

  let cloned;
  try {
    cloned = await cloneVoice(wav, `nn-${user.id.slice(0, 8)}-${Date.now().toString(36)}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] voice clone failed:", msg);
    await trackAiUsage({
      userId: user.id,
      service: "minimax_tts",
      model: `${CLONE_TTS_MODEL}-clone`,
      endpoint: ENDPOINT,
      success: false,
      errorMessage: msg,
    });
    const tooShort = e instanceof VideoProviderError && /duration/i.test(msg);
    return NextResponse.json(
      { error: tooShort ? "錄音太短或聽不清楚，請在安靜的地方再錄一次" : "聲音複製暫時沒成功，請稍後再試" },
      { status: tooShort ? 400 : 502 }
    );
  }

  await trackAiUsage({
    userId: user.id,
    service: "minimax_tts",
    model: `${CLONE_TTS_MODEL}-clone`,
    endpoint: ENDPOINT,
    success: true,
    metadata: { provider: "lk888", voice_id: cloned.voiceId, sample_seconds: Number(seconds.toFixed(1)) },
  });

  // 一個人只留一個聲音：舊的先停用再存新的（同時送兩次時，唯一索引會擋下後到的那筆）
  const now = new Date();
  const cloneId = crypto.randomUUID();
  const demoUrl = await keepDemo(admin, user.id, cloneId, cloned.demoUrl);
  await admin.from("voice_clones").update({ deleted_at: now.toISOString() }).eq("user_id", user.id).is("deleted_at", null);
  const { error: insErr } = await admin.from("voice_clones").insert({
    id: cloneId,
    user_id: user.id,
    provider_voice_id: cloned.voiceId,
    model: CLONE_TTS_MODEL,
    sample_seconds: Number(seconds.toFixed(2)),
    demo_url: demoUrl,
    consent_text: VOICE_CONSENT_TEXT,
    consented_at: now.toISOString(),
    expires_at: cloned.expiresAt ?? new Date(now.getTime() + UNUSED_VOICE_TTL_MS).toISOString(),
  });
  if (insErr) {
    if (insErr.code === "23505") {
      return NextResponse.json({ error: "剛剛已經在處理另一段錄音了，請稍等一下再看看" }, { status: 409 });
    }
    console.error("[api] voice clone insert:", insErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({ status: await buildStatus(user.id, tier) });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("voice_clones")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("deleted_at", null);
  if (error) {
    console.error("[api] voice clone delete:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const { tier } = await checkUserQuota(user.id, "video");
  return NextResponse.json({ status: await buildStatus(user.id, tier) });
}
