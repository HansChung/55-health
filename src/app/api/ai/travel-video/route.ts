// ────────────────────────────────────────────────
// 出遊回憶影片（邁笙 lk888 平台 × MiniMax 海螺 H3 圖轉影片）
// GET  → 列出我的影片（進行中的會順便向平台同步）+ 本月配額
// POST → 上傳一張照片，建立 10 秒影片任務
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
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
  TRAVEL_VIDEO_BUCKET,
  TRAVEL_VIDEO_STALE_MS,
  type TravelVideoRow,
} from "@/lib/ai/travel-video-server";
import { isPublicHttpsUrl, travelVideoNotifyUrl } from "@/lib/ai/travel-video-webhook";
import {
  TRAVEL_VIDEO_STYLE_IDS,
  buildTravelVideoPrompt,
  isTravelVideoPending,
  sanitizePlace,
} from "@/lib/travel-video";

// 成功時要下載影片再轉存 Storage
export const maxDuration = 60;

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
// Vercel request body 上限 4.5MB；前端已壓到長邊 1280px，通常 < 1MB
const MAX_IMAGE_CHARS = 4_000_000;

const PostSchema = z.object({
  image: z.string().max(MAX_IMAGE_CHARS).regex(IMAGE_DATA_URL),
  style: z.enum(TRAVEL_VIDEO_STYLE_IDS),
  place: z.string().max(100).optional(),
});

export async function GET() {
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
      rows.map((r) => (isTravelVideoPending(r.status) ? syncTravelVideo(r).catch(() => r) : r))
    );
  }

  const quota = await checkUserQuota(user.id, "video");
  const admin = createSupabaseAdmin();
  return NextResponse.json({
    videos: rows.map((r) => toClientVideo(admin, r)),
    quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
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

  // 2. 配額檢查（失敗的影片不算次數）
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

  // 3. 解析請求
  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "照片格式不對，請換一張再試" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // 4. 一次只做一支，避免連點重複扣費
  const { data: pending } = await admin
    .from("travel_videos")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["queued", "running"])
    .is("deleted_at", null)
    .gte("created_at", new Date(Date.now() - TRAVEL_VIDEO_STALE_MS).toISOString())
    .limit(1);
  if (pending && pending.length > 0) {
    return NextResponse.json({ error: "上一支影片還在做，做好再做下一支喔" }, { status: 409 });
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

  // 6. 先寫 DB 再呼叫平台：就算之後中斷也追得到這筆
  const place = sanitizePlace(body.place) || null;
  const prompt = buildTravelVideoPrompt(body.style, place);
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
    })
    .select("*")
    .single();
  if (insErr || !inserted) {
    console.error("[api] travel_videos insert:", insErr);
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove([photoPath]);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  // 7. 建立影片任務：正式站傳 Storage 公網網址（平台建議，請求較快）；本機 Supabase 平台連不到 → 改傳 base64
  const photoUrl = admin.storage.from(TRAVEL_VIDEO_BUCKET).getPublicUrl(photoPath).data.publicUrl;
  const imageUrl = isPublicHttpsUrl(photoUrl) ? photoUrl : body.image;
  try {
    // 有設回呼 → 做好時平台主動通知，伺服器同步後推播給長輩（沒設就靠畫面輪詢）
    const { taskId } = await createImageToVideoTask({ imageUrl, prompt, notifyUrl: travelVideoNotifyUrl() });
    const { data: updated } = await admin
      .from("travel_videos")
      .update({ task_id: taskId, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    const row = (updated ?? { ...inserted, task_id: taskId }) as TravelVideoRow;
    return NextResponse.json({
      video: toClientVideo(admin, row),
      quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const httpStatus = error instanceof VideoProviderError ? error.httpStatus : 0;
    console.error("[api] 建立影片任務失敗:", msg);

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
}
