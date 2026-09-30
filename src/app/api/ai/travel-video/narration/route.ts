// ────────────────────────────────────────────────
// 出遊影片口白試聽：把一句遊記用 AI 配音念出來，存起來給送出影片時用
// POST { text, voice, accent? } → { narration: { id, url, seconds, text, voice, accent, video_seconds } }
// 配音約 10～20 秒完成；每次約 0.02～0.04 算力，不扣影片次數
// voice="mine"（專業版）：用自己錄音複製的聲音念；第一次使用時平台另收一次啟用費
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota, countMonthlyEndpointUsage, trackAiUsage } from "@/lib/ai/usage-tracker";
import { isVideoProviderConfigured } from "@/lib/ai/lk888-video";
import { synthesizeNarration } from "@/lib/ai/lk888-tts";
import {
  FIRST_USE_BUSY_MESSAGE,
  claimFirstUse,
  markVoiceActivated,
  releaseFirstUse,
  resolveSpeaker,
} from "@/lib/ai/voice-clone-server";
import { cleanupStaleNarrations, narrationStoragePath, TRAVEL_VIDEO_BUCKET } from "@/lib/ai/travel-video-server";
import {
  DEFAULT_NARRATION_ACCENT,
  NARRATION_ACCENT_IDS,
  NARRATION_VOICE_CHOICES,
  narrationTooLong,
  sanitizeNarration,
  travelVideoExtrasLimit,
  videoSecondsForNarration,
} from "@/lib/travel-video";

const ENDPOINT = "/api/ai/travel-video/narration";

export const maxDuration = 60;

const PostSchema = z.object({
  text: z.string().max(200),
  voice: z.enum(NARRATION_VOICE_CHOICES),
  accent: z.enum(NARRATION_ACCENT_IDS).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  if (!isVideoProviderConfigured()) {
    return NextResponse.json({ error: "影片功能還在準備中，請稍後再試" }, { status: 503 });
  }

  // 只有還能做影片的人才需要試聽口白
  const quota = await checkUserQuota(user.id, "video");
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.limit === 0 ? "升級方案就可以做出遊影片喔" : "本月的影片次數用完了，下個月再來做吧" },
      { status: 429 }
    );
  }
  // 試聽不扣影片次數，但每月有上限（避免一直按、燒掉共用的配音額度）
  if ((await countMonthlyEndpointUsage(user.id, ENDPOINT)) >= travelVideoExtrasLimit(quota.limit)) {
    return NextResponse.json({ error: "本月試聽口白的次數用完了，下個月再來喔" }, { status: 429 });
  }

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }
  const text = sanitizeNarration(body.text);
  if (!text) return NextResponse.json({ error: "先寫一句想說的話喔" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const resolved = await resolveSpeaker(admin, { userId: user.id, tier: quota.tier, voice: body.voice, accent: body.accent });
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  const { speaker } = resolved;
  const accent = speaker.kind === "preset" ? speaker.accent ?? DEFAULT_NARRATION_ACCENT : null;
  const service = speaker.kind === "clone" ? "minimax_tts" : "gemini_tts";

  // 還沒啟用的聲音：第一次配音同時只讓一個請求做（平台會收一次啟用費）
  const firstUse = Boolean(resolved.cloneId && !resolved.activated);
  if (firstUse && !(await claimFirstUse(admin, resolved.cloneId!))) {
    return NextResponse.json({ error: FIRST_USE_BUSY_MESSAGE }, { status: 409 });
  }

  let result;
  try {
    result = await synthesizeNarration(text, speaker);
  } catch (e) {
    if (firstUse) await releaseFirstUse(admin, resolved.cloneId!);
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] 口白配音失敗:", msg);
    await trackAiUsage({
      userId: user.id,
      service,
      model: speaker.kind === "clone" ? "speech-2.8" : "gem-3.1-tts",
      endpoint: ENDPOINT,
      success: false,
      errorMessage: msg,
      metadata: { voice: body.voice, accent },
    });
    return NextResponse.json({ error: "配音暫時沒成功，請再試一次" }, { status: 502 });
  }
  // 第一次用自己的聲音配音成功 → 平台已轉為永久（收了啟用費）
  if (firstUse) await markVoiceActivated(admin, resolved.cloneId!);

  await trackAiUsage({
    userId: user.id,
    service,
    model: result.model,
    endpoint: "/api/ai/travel-video/narration",
    success: true,
    metadata: {
      provider: "lk888",
      voice: body.voice,
      accent,
      ...(resolved.cloneId ? { voice_clone_id: resolved.cloneId, first_use: firstUse } : {}),
      chars: [...text].length,
      seconds: Number(result.seconds.toFixed(2)),
      task_id: result.taskId,
      platform_cost: result.platformCost,
    },
  });

  if (narrationTooLong(result.seconds)) {
    return NextResponse.json({ error: "這句話念起來太長了，請縮短一點（影片最長 15 秒）" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const storagePath = narrationStoragePath(user.id, id);
  const { error: upErr } = await admin.storage
    .from(TRAVEL_VIDEO_BUCKET)
    .upload(storagePath, result.audio, { contentType: "audio/wav", cacheControl: "3600" });
  if (upErr) {
    console.error("[api] narration upload:", upErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  // 回應送出後，順手清掉這個人超過 1 小時、沒被影片用到的舊試聽音檔
  after(() =>
    cleanupStaleNarrations(user.id).catch((e) => console.warn("[api] narration cleanup failed:", e))
  );

  return NextResponse.json({
    narration: {
      id,
      url: admin.storage.from(TRAVEL_VIDEO_BUCKET).getPublicUrl(storagePath).data.publicUrl,
      seconds: Number(result.seconds.toFixed(2)),
      text,
      voice: body.voice,
      accent: accent ?? DEFAULT_NARRATION_ACCENT,
      video_seconds: videoSecondsForNarration(result.seconds),
    },
  });
}
