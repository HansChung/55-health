// ────────────────────────────────────────────────
// 出遊回憶影片（邁笙 lk888 平台 × MiniMax 海螺 H3 圖轉影片）
// GET  → 列出我的影片（進行中的會順便向平台同步）+ 本月配額
// POST → 上傳一張照片，建立 10 秒影片任務
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadCommentsViews } from "@/lib/video-comments-server";
import { syncMv } from "@/lib/ai/travel-mv-server";
import { checkUserQuota, trackAiUsage } from "@/lib/ai/usage-tracker";
import {
  createImageToVideoTask,
  isVideoProviderConfigured,
  videoModel,
  VideoProviderError,
} from "@/lib/ai/lk888-video";
import {
  syncTravelVideo,
  toClientVideo,
  narrationStoragePath,
  TRAVEL_VIDEO_BUCKET,
  isPastDeadline,
  type TravelVideoRow,
} from "@/lib/ai/travel-video-server";
import { syncMontage } from "@/lib/ai/travel-montage-server";
import { wavDurationSeconds } from "@/lib/ai/lk888-tts";
import { travelVideoNotifyUrl } from "@/lib/ai/travel-video-webhook";
import {
  DEFAULT_NARRATION_ACCENT,
  MY_VOICE,
  NARRATION_ACCENT_IDS,
  NARRATION_VOICE_CHOICES,
  TRAVEL_VIDEO_STYLE_IDS,
  buildTravelVideoPrompt,
  isTravelVideoPending,
  narrationTooLong,
  sanitizeNarration,
  sanitizePlace,
  videoSecondsForNarration,
} from "@/lib/travel-video";

// 成功時要下載影片再轉存 Storage
export const maxDuration = 60;

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
// Vercel request body 上限 4.5MB；前端已壓到長邊 1280px，通常 < 1MB
const MAX_IMAGE_CHARS = 4_000_000;
const PENDING_MESSAGE = "上一支影片還在做，做好再做下一支喔";

const PostSchema = z.object({
  image: z.string().max(MAX_IMAGE_CHARS).regex(IMAGE_DATA_URL),
  style: z.enum(TRAVEL_VIDEO_STYLE_IDS),
  place: z.string().max(100).optional(),
  // 選了口白：先試聽過（/narration 存好音檔），這裡用 id 取回
  narration: z
    .object({
      id: z.string().uuid(),
      voice: z.enum(NARRATION_VOICE_CHOICES),
      accent: z.enum(NARRATION_ACCENT_IDS).optional(),
      text: z.string().max(200),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("travel_videos")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[api] travel_videos GET:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  const enabled = isVideoProviderConfigured();
  let rows = (data ?? []) as TravelVideoRow[];
  if (enabled) {
    rows = await Promise.all(
      rows.map((r) => {
        if (!isTravelVideoPending(r.status)) return r;
        // 遊記在自己伺服器做（配音→剪輯→合成），每次輪詢推進一段；單張影片向平台查進度
        const origin = new URL(req.url).origin;
        const step =
          r.kind === "montage" ? syncMontage(r, { origin }) : r.kind === "mv" ? syncMv(r, { origin }) : syncTravelVideo(r);
        return step.catch(() => r);
      })
    );
  }

  const [quota, montageQuota, mvQuota] = await Promise.all([
    checkUserQuota(user.id, "video"),
    checkUserQuota(user.id, "montage"),
    checkUserQuota(user.id, "mv"),
  ]);
  const admin = createSupabaseAdmin();
  const done = rows.filter((r) => r.status === "succeeded");
  const comments = await loadCommentsViews(admin, done, user.id);
  return NextResponse.json({
    videos: rows.map((r) => ({ ...toClientVideo(admin, r), ...(comments.has(r.id) ? { comments: comments.get(r.id) } : {}) })),
    quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
    montage_quota: { used: montageQuota.used, limit: montageQuota.limit, tier: montageQuota.tier },
    mv_quota: { used: mvQuota.used, limit: mvQuota.limit, tier: mvQuota.tier },
    enabled,
  });
}

export async function POST(req: NextRequest) {
  // 1. 認證
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  if (!isVideoProviderConfigured()) {
    return NextResponse.json({ error: "影片功能還在準備中，請稍後再試" }, { status: 503 });
  }

  const admin = createSupabaseAdmin();

  // 2. 一次只做一支，避免連點重複扣費。逾時的舊任務先向平台結清（標記失敗會退回次數），
  //    還在做的就擋下。並發請求由 DB 的部分唯一索引（travel_videos_one_pending_per_user）把關
  const { data: pendingRows } = await admin
    .from("travel_videos")
    .select("*")
    .eq("user_id", user.id)
    .eq("kind", "single") // 遊記、MV 另外算，不會擋住單張影片
    .in("status", ["queued", "running"])
    .is("deleted_at", null);
  for (const r of (pendingRows ?? []) as TravelVideoRow[]) {
    const current = isPastDeadline(r) ? await syncTravelVideo(r).catch(() => r) : r;
    if (isTravelVideoPending(current.status)) {
      return NextResponse.json({ error: PENDING_MESSAGE }, { status: 409 });
    }
  }

  // 3. 配額檢查（失敗的影片不算次數）
  const quota = await checkUserQuota(user.id, "video");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.limit === 0 ? "升級方案就可以做出遊影片喔" : "本月的影片次數用完了，下個月再來做吧",
        quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
        upgradeUrl: "/pricing",
      },
      { status: 429 }
    );
  }

  // 4. 解析請求
  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "照片格式不對，請換一張再試" }, { status: 400 });
  }

  // 4b. 口白：確認音檔是這個人試聽時存的，並以實際長度決定影片秒數（不信任前端）
  let narration: {
    text: string;
    voice: string;
    accent: string | null;
    path: string;
    seconds: number;
    videoSeconds: number;
  } | null = null;
  if (body.narration) {
    const text = sanitizeNarration(body.narration.text);
    const narrationPath = narrationStoragePath(user.id, body.narration.id);
    const { data: audio } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).download(narrationPath);
    let seconds = 0;
    try {
      seconds = audio ? wavDurationSeconds(Buffer.from(await audio.arrayBuffer())) : 0;
    } catch {
      seconds = 0;
    }
    if (!text || !seconds) {
      return NextResponse.json({ error: "口白找不到了，請再按一次「試聽口白」" }, { status: 400 });
    }
    if (narrationTooLong(seconds)) {
      return NextResponse.json({ error: "這句話念起來太長了，請縮短一點（影片最長 15 秒）" }, { status: 400 });
    }
    narration = {
      text,
      voice: body.narration.voice,
      accent: body.narration.voice === MY_VOICE ? null : body.narration.accent ?? DEFAULT_NARRATION_ACCENT,
      path: narrationPath,
      seconds,
      videoSeconds: videoSecondsForNarration(seconds),
    };
  }

  // 5. 照片存 Storage（影片清單顯示封面用）
  const id = crypto.randomUUID();
  const [, mime, b64] = body.image.match(IMAGE_DATA_URL)!;
  const photoPath = `${user.id}/${id}/photo.${mime === "jpeg" ? "jpg" : mime}`;
  const { error: upErr } = await admin.storage
    .from(TRAVEL_VIDEO_BUCKET)
    .upload(photoPath, Buffer.from(b64, "base64"), {
      contentType: `image/${mime}`,
      cacheControl: "31536000",
    });
  if (upErr) {
    console.error("[api] travel video photo upload:", upErr);
    return NextResponse.json({ error: "照片上傳失敗，請再試一次" }, { status: 500 });
  }

  // 6. 先寫 DB 再呼叫平台：就算之後中斷也追得到這筆；同時占住「製作中」名額
  const place = sanitizePlace(body.place) || null;
  const prompt = buildTravelVideoPrompt(body.style, place, { withNarration: Boolean(narration) });
  const model = videoModel();
  const { data: inserted, error: insErr } = await admin
    .from("travel_videos")
    .insert({
      id,
      user_id: user.id,
      status: "queued",
      style: body.style,
      place,
      prompt,
      model,
      photo_path: photoPath,
      // 只有選口白時才寫這些欄位：沒跑 add-travel-video-narration.sql 的環境，一般影片照常可用
      ...(narration
        ? {
            narration_text: narration.text,
            narration_voice: narration.voice,
            // 預設口音不寫：沒跑 add-narration-voices.sql 的環境照常可用
            ...(narration.accent && narration.accent !== DEFAULT_NARRATION_ACCENT ? { narration_accent: narration.accent } : {}),
            narration_path: narration.path,
            narration_seconds: Number(narration.seconds.toFixed(2)),
            duration_seconds: narration.videoSeconds,
          }
        : {}),
    })
    .select("*")
    .single();
  if (insErr || !inserted) {
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove([photoPath]);
    // 23505 = 撞到「每人同時一支」唯一索引：另一個請求剛搶先建立
    if (insErr?.code === "23505") {
      return NextResponse.json({ error: PENDING_MESSAGE }, { status: 409 });
    }
    console.error("[api] travel_videos insert:", insErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  // 7. 建立影片任務：照片一律用 base64 傳，由邁笙自己轉存。
  //    傳網址時平台上游可能抓不到（實測回「媒體鏈結無法存取…屏蔽了伺服器 IP」）；
  //    前端已壓到長邊 1280px，通常 < 1MB，遠低於平台 base64 單檔 10MB 上限
  let taskId: string;
  try {
    // 有設回呼 → 做好時平台主動通知，伺服器同步後推播給長輩（沒設就靠畫面輪詢）
    // 回呼網址帶 video_id：萬一下面 task_id 沒寫進 DB，webhook 還能用它補回來
    ({ taskId } = await createImageToVideoTask({
      imageUrl: body.image,
      prompt,
      notifyUrl: travelVideoNotifyUrl(process.env, id),
      durationSeconds: narration?.videoSeconds,
    }));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const httpStatus = error instanceof VideoProviderError ? error.httpStatus : 0;
    console.error("[api] 建立影片任務失敗:", msg);

    // 逾時：平台可能已建立並扣費 → 保留這筆「製作中」，別讓長輩重送重複付費。
    // 有回呼時 webhook 會用 video_id 補回 task_id；2 小時內沒補回就自動標記失敗（不扣次數）
    if (error instanceof VideoProviderError && error.code === "timeout") {
      console.error(`[api] 影片任務建立逾時，保留待對帳：video_id=${id}`);
      return NextResponse.json({
        video: toClientVideo(admin, inserted as TravelVideoRow),
        quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
      });
    }

    // 沒建成功 → 不留紀錄、不扣次數
    await admin.from("travel_videos").delete().eq("id", id);
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove([photoPath]);
    await trackAiUsage({
      userId: user.id,
      service: "minimax_video",
      model,
      endpoint: "/api/ai/travel-video",
      success: false,
      errorMessage: msg,
    });

    if (httpStatus === 429) {
      return NextResponse.json({ error: "現在做影片的人比較多，請過幾分鐘再試" }, { status: 429 });
    }
    if (httpStatus === 400 || httpStatus === 422) {
      return NextResponse.json({ error: "這張照片暫時做不成影片，換一張試試" }, { status: 400 });
    }
    return NextResponse.json({ error: "影片服務暫時忙線，請稍後再試" }, { status: 502 });
  }

  // 8. 平台已收單（已扣費）→ task_id 一定要記下來，否則之後找不到影片
  const row = await saveTaskId(admin, id, taskId);
  if (!row) {
    // 留下對帳資訊；有設回呼時 webhook 會用 video_id 補上 task_id
    console.error(`[api] 影片任務已建立但 task_id 未寫入 DB：video_id=${id} task_id=${taskId}`);
    return NextResponse.json(
      { error: "影片已經送出，但記錄時出了點問題。請過幾分鐘回來看看，先不要重複送出" },
      { status: 500 }
    );
  }
  return NextResponse.json({
    video: toClientVideo(admin, row),
    quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
  });
}

/** 寫入 task_id，失敗重試（最多 3 次） */
async function saveTaskId(
  admin: ReturnType<typeof createSupabaseAdmin>,
  id: string,
  taskId: string
): Promise<TravelVideoRow | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await admin
      .from("travel_videos")
      .update({ task_id: taskId, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (!error && data) return data as TravelVideoRow;
    console.warn(`[api] save task_id attempt ${attempt} failed:`, error);
    if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt));
  }
  return null;
}
