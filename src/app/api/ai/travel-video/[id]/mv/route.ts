// ────────────────────────────────────────────────
// 遊記 MV（專業版）：把一支做好的遊記寫成一首歌，配上遊記的照片
// POST { language, style, vocal, title, lyrics } → { video, quota }
// 建立後：邁笙 Suno 做歌（約 0.54 算力、1～3 分鐘）→ 伺服器剪輯＋合成（背景接力，跟遊記一樣）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota } from "@/lib/ai/usage-tracker";
import { isVideoProviderConfigured } from "@/lib/ai/lk888-video";
import { createSongTask } from "@/lib/ai/lk888-music";
import { loadMvSource } from "@/lib/ai/travel-mv-source";
import { mvPhotoPath, syncMv } from "@/lib/ai/travel-mv-server";
import { TRAVEL_VIDEO_BUCKET, toClientVideo, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import {
  MV_LANGUAGE_IDS,
  MV_STYLE_IDS,
  mvSunoPrompt,
  sanitizeMvLyrics,
  sanitizeMvTitle,
  type MvState,
} from "@/lib/travel-video";

export const maxDuration = 60;

const PostSchema = z.object({
  language: z.enum(MV_LANGUAGE_IDS),
  style: z.enum(MV_STYLE_IDS),
  vocal: z.enum(["f", "m"]),
  title: z.string().max(100),
  lyrics: z.string().max(5000),
});

const PENDING_MESSAGE = "上一支 MV 還在做，做好再做下一支喔";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  if (!isVideoProviderConfigured()) return NextResponse.json({ error: "MV 還在準備中，請稍後再試" }, { status: 503 });

  const quota = await checkUserQuota(user.id, "mv");
  if (quota.limit === 0) {
    return NextResponse.json({ error: "遊記 MV 是專業版功能，升級後就可以使用", upgradeUrl: "/pricing" }, { status: 403 });
  }
  if (!quota.allowed) return NextResponse.json({ error: "本月的 MV 次數用完了，下個月再來做吧" }, { status: 429 });

  const { id } = await ctx.params;
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!z.string().uuid().safeParse(id).success || !parsed.success) {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }
  const title = sanitizeMvTitle(parsed.data.title);
  const lyrics = sanitizeMvLyrics(parsed.data.lyrics);
  if (!title || [...lyrics].length < 20) {
    return NextResponse.json({ error: "先寫好歌名和歌詞（可以按「AI 寫歌詞」）" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const source = await loadMvSource(admin, user.id, id);
  if (!source) return NextResponse.json({ error: "找不到這支遊記" }, { status: 404 });

  // 照片複製一份到 MV 底下：之後遊記被刪掉，MV 也不受影響
  const mvId = crypto.randomUUID();
  const photos = source.montage!.photos;
  const target = { user_id: user.id, id: mvId };
  const copied: string[] = [];
  for (const [i, p] of photos.entries()) {
    const to = mvPhotoPath(target, i);
    const { error } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).copy(p.path, to);
    if (error) {
      console.error("[api] mv photo copy:", error);
      if (copied.length) await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(copied);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    copied.push(to);
  }

  const state: MvState = {
    source_video_id: source.id,
    language: parsed.data.language,
    style: parsed.data.style,
    vocal: parsed.data.vocal,
    title,
    lyrics,
    task_id: null,
    song_path: null,
    alt_song_path: null,
    song_seconds: null,
    size: source.montage!.size,
    photos: photos.map((p, i) => ({ path: copied[i], width: p.width, height: p.height })),
    segments: null,
    attempts: 0,
  };
  // 先寫 DB 再叫平台做歌：同時只能有一支在做（唯一索引），也不會重複付費
  const { data: inserted, error: insErr } = await admin
    .from("travel_videos")
    .insert({
      id: mvId,
      user_id: user.id,
      kind: "mv",
      status: "queued",
      style: "gentle",
      place: source.place,
      prompt: title,
      model: "suno-v4.5",
      photo_path: copied[0],
      mv: state,
    })
    .select("*")
    .single();
  if (insErr || !inserted) {
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(copied);
    if (insErr?.code === "23505") return NextResponse.json({ error: PENDING_MESSAGE }, { status: 409 });
    console.error("[api] mv insert:", insErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  let taskId: string;
  try {
    taskId = await createSongTask({
      stylePrompt: mvSunoPrompt(state.style, state.language, state.vocal),
      lyrics,
      vocal: state.vocal,
    });
  } catch (e) {
    console.error("[api] mv song create failed:", e instanceof Error ? e.message : e);
    await admin
      .from("travel_videos")
      .update({ status: "failed", error_message: `song create failed: ${e instanceof Error ? e.message : e}`.slice(0, 500), completed_at: new Date().toISOString() })
      .eq("id", mvId);
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(copied);
    return NextResponse.json({ error: "做歌暫時沒成功，請稍後再試（不會扣次數）" }, { status: 502 });
  }

  const started = { ...state, task_id: taskId };
  const { data: running } = await admin
    .from("travel_videos")
    .update({ status: "running", task_id: taskId, mv: started, updated_at: new Date().toISOString() })
    .eq("id", mvId)
    .select("*")
    .single();
  const row = (running ?? { ...inserted, mv: started }) as TravelVideoRow;

  // 回應送出後先開始等歌（背景接力會接著做完，長輩離開畫面也會做好並推播）
  const origin = new URL(req.url).origin;
  after(() => syncMv(row, { origin, waitForSong: true }).then(() => undefined).catch((e) => console.error("[mv] first step failed:", e)));

  return NextResponse.json({
    video: toClientVideo(admin, row),
    quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
  });
}
