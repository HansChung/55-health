// ────────────────────────────────────────────────
// 故事用自己的聲音念（專業版）：用「我的聲音」把整篇故事念成一個錄音，家人也聽得到
// GET    → { quota: { used, limit } }（這個月念了幾篇）
// POST   → { story, quota }：一段段合成再接起來，3000 字約 1～2 分鐘；每篇約 2～4 算力，每月 STORY_VOICE_MONTHLY 篇
// DELETE → { story }：不要這個錄音了（不退次數）
// 錄音存在 story-audio：{user}/{story}/voice-{hash}.m4a；文字改過會標示「可以重念」
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import {
  checkUserQuota,
  countEndpointSuccessSince,
  finishReservedUsage,
  releaseReservedUsage,
  reserveDailySlot,
  trackAiUsage,
} from "@/lib/ai/usage-tracker";
import { isVideoProviderConfigured } from "@/lib/ai/lk888-video";
import { CLONE_TTS_MODEL } from "@/lib/ai/lk888-tts";
import {
  FIRST_USE_BUSY_MESSAGE,
  claimFirstUse,
  markVoiceActivated,
  releaseFirstUse,
  resolveSpeaker,
  voiceCloneAllowed,
} from "@/lib/ai/voice-clone-server";
import { MY_VOICE } from "@/lib/travel-video";
import { signStoryMedia, toClientStory, type StoryRow } from "@/lib/life-stories-server";
import { STORY_AUDIO_BUCKET } from "@/lib/story-audio";
import { removeStoryAudio } from "@/lib/story-audio-server";
import { STORY_VOICE_MONTHLY, storyVoiceText, taipeiMonthStartIso } from "@/lib/story-voice";
import {
  storyVoiceHash,
  storyVoicePath,
  synthesizeStoryVoice,
  type StoredVoiceReading,
} from "@/lib/story-voice-server";

/** 3000 字切成十段左右、三段同時合成，再用 ffmpeg 接起來 */
export const maxDuration = 300;

const ENDPOINT = "/api/stories/voice";
/** 同一篇同時只念一次（避免連按兩下付兩次）；比 maxDuration 長一點 */
const LEASE_MS = 6 * 60_000;

async function ownStory(id: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  if (!z.string().uuid().safeParse(id).success) return { error: NextResponse.json({ error: "找不到這篇故事" }, { status: 404 }) };
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("life_stories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return { error: NextResponse.json({ error: "找不到這篇故事" }, { status: 404 }) };
  return { user, admin, row: data as StoryRow };
}

async function monthlyQuota(userId: string, tier: string) {
  const limit = tier === "admin" ? 99999 : STORY_VOICE_MONTHLY;
  const used = await countEndpointSuccessSince(userId, ENDPOINT, taipeiMonthStartIso());
  return { used: Math.min(used, limit), limit };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const found = await ownStory((await ctx.params).id);
  if ("error" in found) return found.error;
  const { tier } = await checkUserQuota(found.user.id, "video");
  try {
    return NextResponse.json({ quota: await monthlyQuota(found.user.id, tier) });
  } catch (e) {
    console.error("[api] story voice quota:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const found = await ownStory((await ctx.params).id);
  if ("error" in found) return found.error;
  const { user, admin, row } = found;
  if (!isVideoProviderConfigured()) {
    return NextResponse.json({ error: "這個功能還在準備中，請稍後再試" }, { status: 503 });
  }
  const { tier } = await checkUserQuota(user.id, "video");
  if (!voiceCloneAllowed(tier)) {
    return NextResponse.json({ error: "用自己的聲音念是專業版功能，升級後就可以使用", upgradeUrl: "/pricing" }, { status: 403 });
  }
  if (!row.body.trim()) return NextResponse.json({ error: "這篇還沒有文字，先寫下內容才能念" }, { status: 400 });

  const resolved = await resolveSpeaker(admin, { userId: user.id, tier, voice: MY_VOICE });
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  const cloneId = resolved.cloneId!;
  const text = storyVoiceText(row);
  const hash = storyVoiceHash(text);
  // 文字沒改、聲音也沒換：已經念好了，不用再花一次
  if (row.voice_reading?.text_hash === hash && row.voice_reading.clone_id === cloneId) {
    return NextResponse.json({
      story: toClientStory(row, await signStoryMedia(admin, [row])),
      quota: await monthlyQuota(user.id, tier),
    });
  }

  // 同一篇同時只念一次
  const now = new Date();
  const { data: leased, error: leaseErr } = await admin
    .from("life_stories")
    .update({ voice_reading_lease: new Date(now.getTime() + LEASE_MS).toISOString() })
    .eq("id", row.id)
    .is("deleted_at", null)
    .or(`voice_reading_lease.is.null,voice_reading_lease.lt.${now.toISOString()}`)
    .select("id")
    .maybeSingle();
  if (leaseErr) {
    console.error("[api] story voice lease (add-story-voice.sql 跑了嗎？):", leaseErr.message);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  if (!leased) return NextResponse.json({ error: "這篇正在念，請等一下再看" }, { status: 409 });
  const releaseLease = () => admin.from("life_stories").update({ voice_reading_lease: null }).eq("id", row.id).then(() => undefined);

  // 每月篇數：先佔一格（同時念好幾篇也不會超過）；管理員不限
  let slot: { id: string | null; used: number } = { id: null, used: 0 };
  if (tier !== "admin") {
    try {
      slot = await reserveDailySlot({
        userId: user.id,
        service: "minimax_tts",
        endpoint: ENDPOINT,
        sinceIso: taipeiMonthStartIso(),
        limit: STORY_VOICE_MONTHLY,
      });
    } catch (e) {
      console.error("[api] story voice quota:", e);
      await releaseLease();
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!slot.id) {
      await releaseLease();
      return NextResponse.json(
        { error: `這個月已經念了 ${STORY_VOICE_MONTHLY} 篇，下個月再來`, quota: { used: STORY_VOICE_MONTHLY, limit: STORY_VOICE_MONTHLY } },
        { status: 429 }
      );
    }
  }
  const giveBack = async () => {
    if (slot.id) await releaseReservedUsage(slot.id);
    await releaseLease();
  };

  // 還沒啟用的聲音：第一次合成同時只讓一個請求做（平台會收一次啟用費）
  const firstUse = !resolved.activated;
  if (firstUse) {
    let claimed = false;
    try {
      claimed = await claimFirstUse(admin, cloneId);
    } catch (e) {
      console.error("[api] story voice first use:", e);
      await giveBack();
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!claimed) {
      await giveBack();
      return NextResponse.json({ error: FIRST_USE_BUSY_MESSAGE }, { status: 409 });
    }
  }
  let activated = !firstUse;

  let result;
  try {
    result = await synthesizeStoryVoice(text, resolved.speaker, {
      firstUse,
      onActivated: async () => {
        activated = true;
        await markVoiceActivated(admin, cloneId);
      },
    });
  } catch (e) {
    if (firstUse && !activated) await releaseFirstUse(admin, cloneId);
    await giveBack();
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] 故事用自己的聲音念失敗:", msg);
    await trackAiUsage({
      userId: user.id,
      service: "minimax_tts",
      model: CLONE_TTS_MODEL,
      endpoint: ENDPOINT,
      success: false,
      errorMessage: msg.slice(0, 500),
      metadata: { story_id: row.id, voice_clone_id: cloneId, first_use: firstUse, chars: [...text].length },
    }).catch(() => undefined);
    return NextResponse.json({ error: "這次沒念成功，請再試一次（沒有算次數）" }, { status: 502 });
  }

  const reading: StoredVoiceReading = {
    path: storyVoicePath(user.id, row.id, hash),
    seconds: result.seconds,
    text_hash: hash,
    clone_id: cloneId,
    created_at: new Date().toISOString(),
  };
  const metadata = {
    provider: "lk888",
    story_id: row.id,
    voice_clone_id: cloneId,
    first_use: firstUse,
    chars: result.chars,
    chunks: result.chunks,
    seconds: result.seconds,
    platform_cost: result.platformCost,
  };
  // 已經付費合成好了：之後就算存檔失敗也照算次數（記下用量）
  if (slot.id) await finishReservedUsage(slot.id, { model: result.model, metadata });
  else await trackAiUsage({ userId: user.id, service: "minimax_tts", model: result.model, endpoint: ENDPOINT, success: true, metadata });

  const { error: upErr } = await admin.storage
    .from(STORY_AUDIO_BUCKET)
    .upload(reading.path, result.m4a, { contentType: "audio/mp4", upsert: true });
  if (upErr) {
    console.error("[api] story voice upload:", upErr.message);
    await releaseLease();
    return NextResponse.json({ error: "錄音存檔沒成功，請再試一次" }, { status: 500 });
  }
  // 念的這段時間故事可能被刪了：只更新還在的故事，否則把剛存的錄音刪掉
  const { data: saved, error: saveErr } = await admin
    .from("life_stories")
    .update({ voice_reading: reading, voice_reading_lease: null })
    .eq("id", row.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();
  if (saveErr || !saved) {
    if (saveErr) console.error("[api] story voice save:", saveErr.message);
    await removeStoryAudio(admin, [reading.path]);
    await releaseLease();
    return NextResponse.json({ error: saveErr ? "伺服器忙線中，請稍後再試" : "這篇故事已經刪除了" }, { status: saveErr ? 500 : 404 });
  }
  if (row.voice_reading?.path && row.voice_reading.path !== reading.path) {
    await removeStoryAudio(admin, [row.voice_reading.path]);
  }
  const story = saved as StoryRow;
  return NextResponse.json({
    story: toClientStory(story, await signStoryMedia(admin, [story])),
    quota: await monthlyQuota(user.id, tier),
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const found = await ownStory((await ctx.params).id);
  if ("error" in found) return found.error;
  const { admin, row } = found;
  if (!row.voice_reading) return NextResponse.json({ story: toClientStory(row, await signStoryMedia(admin, [row])) });
  const { data, error } = await admin
    .from("life_stories")
    .update({ voice_reading: null })
    .eq("id", row.id)
    .select("*")
    .single();
  if (error || !data) {
    console.error("[api] story voice delete:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  await removeStoryAudio(admin, [row.voice_reading.path]);
  const story = data as StoryRow;
  return NextResponse.json({ story: toClientStory(story, await signStoryMedia(admin, [story])) });
}
