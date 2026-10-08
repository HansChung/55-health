// ────────────────────────────────────────────────
// 我的故事集
// GET  → { stories }（自己的，新的在前；含家人的按讚留言）
// POST { title, era?, body, shareWithFamily, photoPaths?, photoSizes?, interview? } → { story }
//   照片已直傳 Supabase 暫存區，這裡在 Supabase 裡複製到私人 bucket life-stories
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { copyUserUpload, UserUploadError } from "@/lib/ai/user-uploads-server";
import { isOwnUploadPath } from "@/lib/user-uploads";
import {
  STORY_BODY_MAX,
  STORY_INTERVIEW_MAX,
  STORY_PHOTOS_MAX,
  sanitizeStoryBody,
  sanitizeStoryEra,
  sanitizeStoryTitle,
  trimStoryInterview,
} from "@/lib/life-stories";
import {
  STORY_BUCKET,
  loadStoryCommentsViews,
  notifyFamilyNewStory,
  signStoryPhotos,
  storyPhotoPath,
  toClientStory,
  type StoryRow,
} from "@/lib/life-stories-server";

const PostSchema = z.object({
  title: z.string().max(100),
  era: z.string().max(100).optional(),
  body: z.string().max(STORY_BODY_MAX * 2),
  shareWithFamily: z.boolean(),
  photoPaths: z.array(z.string().max(200)).max(STORY_PHOTOS_MAX).optional(),
  photoSizes: z.array(z.object({ width: z.number().int().min(0).max(20000), height: z.number().int().min(0).max(20000) })).optional(),
  interview: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(3000) })).max(STORY_INTERVIEW_MAX * 2).optional(),
});

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("life_stories")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[api] stories GET:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const rows = (data ?? []) as StoryRow[];
  const [urls, comments] = await Promise.all([signStoryPhotos(admin, rows), loadStoryCommentsViews(admin, rows, user.id)]);
  return NextResponse.json({
    stories: rows.map((r) => ({ ...toClientStory(r, urls), ...(comments.has(r.id) ? { comments: comments.get(r.id) } : {}) })),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const b = parsed.data;
  const title = sanitizeStoryTitle(b.title);
  const body = sanitizeStoryBody(b.body);
  if (!title || !body) return NextResponse.json({ error: "標題和內容都要寫喔" }, { status: 400 });
  const photoPaths = b.photoPaths ?? [];
  if (photoPaths.some((p) => !isOwnUploadPath(p, user.id))) {
    return NextResponse.json({ error: "照片位置不對，請重新選一次照片" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const id = crypto.randomUUID();
  const targets = photoPaths.map((p, i) => storyPhotoPath(user.id, id, i, p));
  const copies = await Promise.allSettled(photoPaths.map((p, i) => copyUserUpload(admin, user.id, p, STORY_BUCKET, targets[i])));
  const failed = copies.find((c): c is PromiseRejectedResult => c.status === "rejected");
  if (failed) {
    if (targets.length) await admin.storage.from(STORY_BUCKET).remove(targets);
    if (failed.reason instanceof UserUploadError) return NextResponse.json({ error: failed.reason.message }, { status: 400 });
    console.error("[api] story photo copy:", failed.reason);
    return NextResponse.json({ error: "照片存不進去，請再試一次" }, { status: 500 });
  }

  const photos = targets.map((path, i) => ({
    path,
    width: b.photoSizes?.[i]?.width ?? 0,
    height: b.photoSizes?.[i]?.height ?? 0,
  }));
  const { data, error } = await admin
    .from("life_stories")
    .insert({
      id,
      user_id: user.id,
      title,
      era: sanitizeStoryEra(b.era) || null,
      body,
      photos,
      interview: trimStoryInterview(b.interview ?? []),
      share_with_family: b.shareWithFamily,
    })
    .select("*")
    .single();
  if (error || !data) {
    if (targets.length) await admin.storage.from(STORY_BUCKET).remove(targets);
    console.error("[api] story insert:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const row = data as StoryRow;
  after(() => notifyFamilyNewStory(admin, row));
  const urls = await signStoryPhotos(admin, [row]);
  return NextResponse.json({ story: toClientStory(row, urls) });
}
