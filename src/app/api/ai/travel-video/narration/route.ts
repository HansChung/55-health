// ────────────────────────────────────────────────
// 出遊影片口白試聽：把一句遊記用 AI 配音念出來，存起來給送出影片時用
// POST { text, voice } → { narration: { id, url, seconds, text, voice, video_seconds } }
// 配音約 10～20 秒完成；每次約 0.02～0.04 算力，不扣影片次數
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota, trackAiUsage } from "@/lib/ai/usage-tracker";
import { isVideoProviderConfigured } from "@/lib/ai/lk888-video";
import { synthesizeNarration, ttsModel } from "@/lib/ai/lk888-tts";
import { cleanupStaleNarrations, narrationStoragePath, TRAVEL_VIDEO_BUCKET } from "@/lib/ai/travel-video-server";
import {
  NARRATION_VOICE_IDS,
  narrationTooLong,
  sanitizeNarration,
  videoSecondsForNarration,
} from "@/lib/travel-video";

export const maxDuration = 60;

const PostSchema = z.object({
  text: z.string().max(200),
  voice: z.enum(NARRATION_VOICE_IDS),
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

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }
  const text = sanitizeNarration(body.text);
  if (!text) return NextResponse.json({ error: "先寫一句想說的話喔" }, { status: 400 });

  let result;
  try {
    result = await synthesizeNarration(text, body.voice);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] 口白配音失敗:", msg);
    await trackAiUsage({
      userId: user.id,
      service: "gemini_tts",
      model: ttsModel(),
      endpoint: "/api/ai/travel-video/narration",
      success: false,
      errorMessage: msg,
    });
    return NextResponse.json({ error: "配音暫時沒成功，請再試一次" }, { status: 502 });
  }

  await trackAiUsage({
    userId: user.id,
    service: "gemini_tts",
    model: result.model,
    endpoint: "/api/ai/travel-video/narration",
    success: true,
    metadata: {
      provider: "lk888",
      voice: body.voice,
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
  const admin = createSupabaseAdmin();
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
      video_seconds: videoSecondsForNarration(result.seconds),
    },
  });
}
