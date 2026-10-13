// ────────────────────────────────────────────────
// 節日、生日祝福影片（kind='greeting'）：伺服器自己剪，不花算力
// GET → { quota }
// POST { occasion, to, from, music, photos: [{ photoPath, width, height, caption }] } → { video, quota }
//   照片先直傳到 user-uploads 暫存區；這裡下載檢查是圖片，放到 travel-videos/{user}/{影片}/photo-N.jpg 再開始剪
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota } from "@/lib/ai/usage-tracker";
import { blockedResponse } from "@/lib/plan-access-server";
import { TRAVEL_VIDEO_BUCKET, toClientVideo } from "@/lib/ai/travel-video-server";
import { upload } from "@/lib/ai/travel-montage-server";
import { montageSize } from "@/lib/ai/montage-compose";
import { insertCompilationRow, syncYearly, yearlyPhotoPath } from "@/lib/ai/travel-yearly-server";
import { UserUploadError, readUserImage } from "@/lib/ai/user-uploads-server";
import { MONTAGE_MUSIC_IDS } from "@/lib/travel-video";
import { sanitizeYearlyCaption, taipeiYearMonth } from "@/lib/travel-yearly";
import {
  GREETING_MAX_PHOTOS,
  GREETING_MIN_PHOTOS,
  GREETING_OCCASIONS,
  defaultGreetingLine,
  greetingClosing,
  greetingOccasion,
  greetingSegments,
  greetingTitle,
  type GreetingOccasion,
} from "@/lib/greeting-video";

/** 建立後在背景先剪第一段（剩下的由背景接力做完） */
export const maxDuration = 60;

const PostSchema = z.object({
  occasion: z.enum(GREETING_OCCASIONS.map((o) => o.id) as [GreetingOccasion, ...GreetingOccasion[]]),
  to: z.string().max(50).default(""),
  from: z.string().max(50).default(""),
  music: z.enum(MONTAGE_MUSIC_IDS).optional(),
  photos: z
    .array(z.object({
      photoPath: z.string().max(300),
      width: z.number().min(0).max(20000),
      height: z.number().min(0).max(20000),
      caption: z.string().max(100).default(""),
    }))
    .min(GREETING_MIN_PHOTOS)
    .max(GREETING_MAX_PHOTOS),
});

async function currentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const quota = await checkUserQuota(user.id, "greeting");
  const blocked = blockedResponse(quota.access, "greeting_video");
  if (blocked) return blocked;
  return NextResponse.json({ quota: { used: quota.used, limit: quota.limit, tier: quota.tier } });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const quota = await checkUserQuota(user.id, "greeting");
  const blocked = blockedResponse(quota.access, "greeting_video");
  if (blocked) return blocked;
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.limit === 0 ? "你的方案還不能做祝福影片，升級後就可以做" : `這個月的 ${quota.limit} 支祝福影片做完了，下個月再來做吧`,
        quota: { used: quota.used, limit: quota.limit, tier: quota.tier },
        ...(quota.limit === 0 ? { upgradeUrl: "/pricing" } : {}),
      },
      { status: 429 }
    );
  }
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: `請放 ${GREETING_MIN_PHOTOS}～${GREETING_MAX_PHOTOS} 張照片` }, { status: 400 });
  }
  const body = parsed.data;
  const title = greetingTitle(body.occasion, body.to);
  const closing = greetingClosing(body.from);
  const captions = body.photos.map((p, i) => sanitizeYearlyCaption(p.caption) || defaultGreetingLine(body.occasion, i));

  // 照片：確認是自己的、真的是圖片，再放到影片底下（公開 bucket，不能直接複製任意檔案過去）
  const admin = createSupabaseAdmin();
  const id = crypto.randomUUID();
  const target = { user_id: user.id, id };
  const placed: string[] = [];
  try {
    for (const [i, p] of body.photos.entries()) {
      const img = await readUserImage(admin, user.id, p.photoPath);
      const to = yearlyPhotoPath(target, i);
      await upload(admin, to, img.buffer, img.mimeType);
      placed.push(to);
    }
  } catch (e) {
    if (placed.length) await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(placed);
    if (e instanceof UserUploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[api] greeting photos:", e);
    return NextResponse.json({ error: "照片沒放好，請再試一次" }, { status: 500 });
  }

  let created;
  try {
    created = await insertCompilationRow(admin, {
      id,
      userId: user.id,
      kind: "greeting",
      state: {
        year: taipeiYearMonth(new Date().toISOString()).year,
        title,
        music: body.music ?? greetingOccasion(body.occasion).music,
        size: montageSize(body.photos.map((p) => ({ width: p.width || 4, height: p.height || 3 }))),
        photos: body.photos.map((p, i) => ({ path: placed[i], width: p.width, height: p.height, caption: captions[i] })),
        segments: greetingSegments(title, captions, closing),
        attempts: 0,
      },
    });
  } catch (e) {
    console.error("[api] greeting create:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  if ("pending" in created) return NextResponse.json({ error: "上一支祝福影片還在做，做好再做下一支喔" }, { status: 409 });

  // 回應送出後先開始剪（背景接力會接著做完，長輩離開畫面也會做好並推播）
  const origin = new URL(req.url).origin;
  const row = created.row;
  after(() => syncYearly(row, { origin }).then(() => undefined).catch((e) => console.error("[greeting] first step failed:", e)));

  return NextResponse.json({
    video: toClientVideo(admin, row),
    quota: { used: quota.used + 1, limit: quota.limit, tier: quota.tier },
  });
}
