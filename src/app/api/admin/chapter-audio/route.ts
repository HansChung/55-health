// ────────────────────────────────────────────────
// 管理員：書本章節的 Podcast／音檔上傳
// POST { chapterId, fileName, size, type } → { path, token, publicUrl, contentType }
//   回一個簽名上傳網址，瀏覽器直接把檔案傳到 Supabase（大檔案不經過 Vercel），傳完用 publicUrl 放進章節
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  CHAPTER_AUDIO_BUCKET,
  CHAPTER_AUDIO_MAX_BYTES,
  CHAPTER_AUDIO_MIME_TYPES,
  buildChapterAudioPath,
  chapterAudioType,
} from "@/lib/chapter-audio";

const Schema = z.object({
  chapterId: z.string().min(1).max(40),
  fileName: z.string().max(300),
  size: z.number().int().min(1),
  type: z.string().max(100),
});

/** 第一次上傳時建立公開 bucket；已經有就沿用 */
async function ensureBucket(admin: ReturnType<typeof createSupabaseAdmin>): Promise<string | null> {
  const { data } = await admin.storage.getBucket(CHAPTER_AUDIO_BUCKET);
  if (data) return null;
  const { error } = await admin.storage.createBucket(CHAPTER_AUDIO_BUCKET, {
    public: true,
    fileSizeLimit: CHAPTER_AUDIO_MAX_BYTES,
    allowedMimeTypes: CHAPTER_AUDIO_MIME_TYPES,
  });
  if (error && !/already exists/i.test(error.message)) return error.message;
  return null;
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const { chapterId, fileName, size, type } = parsed.data;
  const audio = chapterAudioType(fileName, type);
  if (!audio) return NextResponse.json({ error: "只支援 mp3、m4a、aac、wav 音檔" }, { status: 415 });
  if (size > CHAPTER_AUDIO_MAX_BYTES) {
    return NextResponse.json(
      { error: "音檔超過 50MB。可以先轉成 64kbps 的 mp3（一小時大約 28MB）再上傳" },
      { status: 413 }
    );
  }

  const admin = createSupabaseAdmin();
  const bucketErr = await ensureBucket(admin);
  if (bucketErr) {
    console.error("[admin] chapter-audio bucket:", bucketErr);
    return NextResponse.json({ error: "音檔空間建立失敗，請稍後再試" }, { status: 500 });
  }
  const path = buildChapterAudioPath(chapterId, audio.ext);
  const { data, error } = await admin.storage.from(CHAPTER_AUDIO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[admin] chapter-audio signed url:", error);
    return NextResponse.json({ error: "上傳準備失敗，請稍後再試" }, { status: 500 });
  }
  const { data: pub } = admin.storage.from(CHAPTER_AUDIO_BUCKET).getPublicUrl(path);
  return NextResponse.json({ path, token: data.token, publicUrl: pub.publicUrl, contentType: audio.contentType });
}
