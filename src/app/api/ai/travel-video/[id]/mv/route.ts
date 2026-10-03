// ────────────────────────────────────────────────
// 遊記 MV（專業版）：把一支做好的遊記寫成一首歌，配上遊記的照片
// POST { language, style, vocal, title, lyrics } → { video, quota }
// 建立後：邁笙 Suno 做歌（約 0.54 算力、1～3 分鐘）→ 伺服器剪輯＋合成（背景接力，跟遊記一樣）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota } from "@/lib/ai/usage-tracker";
import { VideoProviderError, isVideoProviderConfigured } from "@/lib/ai/lk888-video";
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
    const msg = e instanceof Error ? e.message : String(e);
    // 逾時：平台可能已經收下並扣費 → 保留這筆「製作中」（占住名額，長輩不會重送重複付費）；
    // 沒有任務編號就等不到歌，45 分鐘後自動標記失敗（不扣次數）
    if (e instanceof VideoProviderError && e.code === "timeout") {
      console.error(`[api] MV 做歌任務建立逾時，保留待對帳：video_id=${mvId}`);
      return NextResponse.json({
        video: toClientVideo(admin, inserted as TravelVideoRow),
        quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
      });
    }
    console.error("[api] mv song create failed:", msg);
    await admin
      .from("travel_videos")
      .update({ status: "failed", error_message: `song create failed: ${msg}`.slice(0, 500), completed_at: new Date().toISOString() })
      .eq("id", mvId);
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(copied);
    return NextResponse.json({ error: "做歌暫時沒成功，請稍後再試（不會扣次數）" }, { status: 502 });
  }

  // 任務編號一定要存進 DB 才開始等歌（存不進去就重試；背景工作是從 DB 讀的）。
  // 欄位 task_id 也存一份：mv 欄位萬一沒寫進去，等歌時還找得到
  const started = { ...state, task_id: taskId };
  let row: TravelVideoRow | null = null;
  for (let attempt = 0; attempt < 3 && !row; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * attempt));
    const { data: running, error: upErr } = await admin
      .from("travel_videos")
      .update({ status: "running", task_id: taskId, mv: started, updated_at: new Date().toISOString() })
      .eq("id", mvId)
      .select("*")
      .maybeSingle();
    if (upErr) console.warn("[api] mv task id save failed:", upErr.message);
    row = (running as TravelVideoRow | null) ?? null;
  }
  if (!row) {
    // 歌已經在做（有付費）但編號沒存進去：留下紀錄方便對帳，不啟動背景工作
    console.error(`[api] MV 任務編號沒存進資料庫，請人工對帳：video_id=${mvId} task_id=${taskId}`);
    return NextResponse.json({
      video: toClientVideo(admin, inserted as TravelVideoRow),
      quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
    });
  }

  // 回應送出後先開始等歌（背景接力會接著做完，長輩離開畫面也會做好並推播）
  const origin = new URL(req.url).origin;
  const startedRow = row;
  after(() => syncMv(startedRow, { origin, waitForSong: true }).then(() => undefined).catch((e) => console.error("[mv] first step failed:", e)));

  return NextResponse.json({
    video: toClientVideo(admin, row),
    quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
  });
}
