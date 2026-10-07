// ────────────────────────────────────────────────
// 多張照片遊記影片：3～5 張照片 + 每張一句話 + 聲音 → 建立一支遊記（在自己伺服器用 ffmpeg 做）
// POST { images: dataURL[], sizes: {width,height}[], lines: string[], voice, accent?, music?, place? }
// 建立後在背景先開始配音，之後由背景接力（/api/cron/montage-step）與畫面輪詢接著做
// ────────────────────────────────────────────────
import { copyUserUpload, UserUploadError } from "@/lib/ai/user-uploads-server";
import { isOwnUploadPath } from "@/lib/user-uploads";
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota } from "@/lib/ai/usage-tracker";
import { isVideoProviderConfigured } from "@/lib/ai/lk888-video";
import { TRAVEL_VIDEO_BUCKET, toClientVideo, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { MONTAGE_STALE_MS, montagePhotoPath, syncMontage } from "@/lib/ai/travel-montage-server";
import { montageSize } from "@/lib/ai/montage-compose";
import { resolveSpeaker } from "@/lib/ai/voice-clone-server";
import {
  MONTAGE_MAX_PHOTOS,
  MONTAGE_MAX_TOTAL_CHARS,
  MONTAGE_MIN_PHOTOS,
  DEFAULT_NARRATION_ACCENT,
  MONTAGE_MUSIC_IDS,
  MY_VOICE,
  NARRATION_ACCENT_IDS,
  NARRATION_VOICE_CHOICES,
  isTravelVideoPending,
  sanitizeMontageLine,
  sanitizePlace,
  type MontageState,
} from "@/lib/travel-video";

export const maxDuration = 60;

const IMAGE_DATA_URL = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;
// Vercel request body 上限 4.5MB：前端每張壓到長邊 1280px，通常一張 < 500KB
const MAX_IMAGE_CHARS = 1_400_000;
const PENDING_MESSAGE = "上一支遊記還在做，做好再做下一支喔";

const PostSchema = z
  .object({
    // 新方式：photoPaths（照片已直傳 Supabase 暫存區，伺服器在 Supabase 裡複製）；舊方式：images（data URL）
    photoPaths: z.array(z.string().max(200)).min(MONTAGE_MIN_PHOTOS).max(MONTAGE_MAX_PHOTOS).optional(),
    images: z.array(z.string().max(MAX_IMAGE_CHARS).regex(IMAGE_DATA_URL)).min(MONTAGE_MIN_PHOTOS).max(MONTAGE_MAX_PHOTOS).optional(),
    sizes: z.array(z.object({ width: z.number().int().min(1).max(20000), height: z.number().int().min(1).max(20000) })),
    lines: z.array(z.string().max(200)),
    voice: z.enum(NARRATION_VOICE_CHOICES),
    accent: z.enum(NARRATION_ACCENT_IDS).optional(),
    // 配樂：沒給＝不要音樂（舊版 App 送出的請求）
    music: z.enum(MONTAGE_MUSIC_IDS).nullable().optional(),
    place: z.string().max(100).optional(),
  })
  .refine((b) => Boolean(b.photoPaths || b.images), "photos required")
  .refine((b) => {
    const n = (b.photoPaths ?? b.images ?? []).length;
    return b.sizes.length === n && b.lines.length === n;
  }, "length mismatch")
  .refine((b) => (b.images ?? []).reduce((n, s) => n + s.length, 0) <= MONTAGE_MAX_TOTAL_CHARS, "too large");

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  // 配音走邁笙：沒設金鑰就做不了
  if (!isVideoProviderConfigured()) {
    return NextResponse.json({ error: "遊記影片還在準備中，請稍後再試" }, { status: 503 });
  }

  const admin = createSupabaseAdmin();

  // 一次只做一支遊記：卡太久的舊遊記先結清（標記失敗、不扣次數），還在做的就擋下
  const { data: pendingRows } = await admin
    .from("travel_videos")
    .select("*")
    .eq("user_id", user.id)
    .eq("kind", "montage")
    .in("status", ["queued", "running"])
    .is("deleted_at", null);
  for (const r of (pendingRows ?? []) as TravelVideoRow[]) {
    const current = Date.now() - new Date(r.created_at).getTime() > MONTAGE_STALE_MS ? await syncMontage(r).catch(() => r) : r;
    if (isTravelVideoPending(current.status)) return NextResponse.json({ error: PENDING_MESSAGE }, { status: 409 });
  }

  const quota = await checkUserQuota(user.id, "montage");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.limit === 0 ? "升級方案就可以做遊記影片喔" : "本月的遊記影片次數用完了，下個月再來做吧",
        quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
        upgradeUrl: "/pricing",
      },
      { status: 429 }
    );
  }

  let body: z.infer<typeof PostSchema>;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: `請選 ${MONTAGE_MIN_PHOTOS}～${MONTAGE_MAX_PHOTOS} 張照片，每張寫一句話` }, { status: 400 });
  }
  const lines = body.lines.map(sanitizeMontageLine);
  if (lines.some((l) => !l)) {
    return NextResponse.json({ error: "每張照片都要寫一句話（可以按「AI 幫我寫」）" }, { status: 400 });
  }
  // 選「我的聲音」：現在就確認方案、有錄好、沒過期（背景配音時才發現就太晚了）
  const speaker = await resolveSpeaker(admin, { userId: user.id, tier: quota.tier, voice: body.voice, accent: body.accent });
  if (!speaker.ok) return NextResponse.json({ error: speaker.error }, { status: speaker.status });
  const accent = body.voice === MY_VOICE ? null : body.accent ?? DEFAULT_NARRATION_ACCENT;

  const id = crypto.randomUUID();
  const sources = body.photoPaths ?? body.images!;
  const photoPaths = sources.map((_, i) => montagePhotoPath(user.id, id, i));
  if (body.photoPaths) {
    // 照片已經在 Supabase 暫存區：在 Supabase 裡複製過去（照片不經過伺服器）；遊記的照片一律是 JPG
    if (body.photoPaths.some((p) => !isOwnUploadPath(p, user.id) || !p.toLowerCase().endsWith(".jpg"))) {
      return NextResponse.json({ error: "照片位置不對，請重新選一次照片" }, { status: 400 });
    }
    const copies = await Promise.allSettled(
      body.photoPaths.map((p, i) => copyUserUpload(admin, user.id, p, TRAVEL_VIDEO_BUCKET, photoPaths[i]))
    );
    const failed = copies.find((c): c is PromiseRejectedResult => c.status === "rejected");
    if (failed) {
      await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(photoPaths);
      if (failed.reason instanceof UserUploadError) return NextResponse.json({ error: failed.reason.message }, { status: 400 });
      console.error("[api] montage photo copy:", failed.reason);
      return NextResponse.json({ error: "照片上傳失敗，請再試一次" }, { status: 500 });
    }
  } else {
    const uploads = await Promise.all(
      body.images!.map((img, i) =>
        admin.storage.from(TRAVEL_VIDEO_BUCKET).upload(photoPaths[i], Buffer.from(img.match(IMAGE_DATA_URL)![1], "base64"), {
          contentType: "image/jpeg",
          cacheControl: "31536000",
        })
      )
    );
    if (uploads.some((u) => u.error)) {
      console.error("[api] montage photo upload:", uploads.find((u) => u.error)?.error);
      await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(photoPaths);
      return NextResponse.json({ error: "照片上傳失敗，請再試一次" }, { status: 500 });
    }
  }

  const state: MontageState = {
    size: montageSize(body.sizes),
    photos: photoPaths.map((path, i) => ({
      path,
      width: body.sizes[i].width,
      height: body.sizes[i].height,
      line: lines[i],
      audio_path: null,
      narration_seconds: null,
      clip_path: null,
      clip_seconds: null,
    })),
    attempts: 0,
    voice_clone_id: speaker.cloneId,
    music: body.music ?? null,
  };
  const place = sanitizePlace(body.place) || null;
  const { data: inserted, error: insErr } = await admin
    .from("travel_videos")
    .insert({
      id,
      user_id: user.id,
      kind: "montage",
      status: "queued",
      style: "gentle",
      place,
      prompt: lines.join("／"),
      model: "montage",
      photo_path: photoPaths[0],
      narration_text: lines.join("／"),
      narration_voice: body.voice,
      // 預設口音不寫：沒跑 add-narration-voices.sql 的環境照常可用
      ...(accent && accent !== DEFAULT_NARRATION_ACCENT ? { narration_accent: accent } : {}),
      montage: state,
    })
    .select("*")
    .single();
  if (insErr || !inserted) {
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(photoPaths);
    // 23505 = 撞到「每人每種影片同時一支」唯一索引
    if (insErr?.code === "23505") return NextResponse.json({ error: PENDING_MESSAGE }, { status: 409 });
    console.error("[api] montage insert:", insErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  // 回應之後在背景先開始配音（同一個函式執行，受 maxDuration 限制；做不完的由輪詢接手）
  // 做不完的由背景接力（/api/cron/montage-step）一段一段做完，長輩離開畫面也會做好並推播
  const origin = new URL(req.url).origin;
  after(() =>
    syncMontage(inserted as TravelVideoRow, { origin })
      .then(() => undefined)
      .catch((e) => console.error("[montage] kickoff failed:", e))
  );

  return NextResponse.json({
    video: toClientVideo(admin, inserted as TravelVideoRow),
    quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
  });
}
