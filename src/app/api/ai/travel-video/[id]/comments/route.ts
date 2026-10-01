// ────────────────────────────────────────────────
// 出遊影片的按讚、留言（影片本人＋看得到影片的家人）
// GET  → { comments: VideoCommentsView }
// POST { emoji } 按讚／收回；{ body } 留言；{ audio } 語音留言（瀏覽器錄音 dataURL）→ { comments }
// 有新的就推播給對方
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { toWav, wavRms, wavToM4a } from "@/lib/ai/audio-convert";
import { wavDurationSeconds } from "@/lib/ai/lk888-tts";
import {
  addComment,
  addVoiceComment,
  loadCommentsViews,
  loadVideoAccess,
  notifyVideoComment,
  toggleReaction,
} from "@/lib/video-comments-server";
import {
  EMPTY_COMMENTS,
  VIDEO_COMMENTS_PER_AUTHOR,
  VIDEO_REACTIONS,
  VOICE_COMMENT_MAX_SECONDS,
  VOICE_COMMENT_MIN_SECONDS,
  sanitizeComment,
} from "@/lib/video-comments";

/** 語音留言要轉檔（ffmpeg） */
export const maxDuration = 60;

const AUDIO_DATA_URL = /^data:audio\/[a-z0-9.+-]+(?:;[a-z0-9=._+-]+)*;base64,([A-Za-z0-9+/]+={0,2})$/i;
/** 1 分鐘：webm／opus 約 0.3MB、Safari mp4 約 1MB；base64 再多 1/3 */
const MAX_AUDIO_CHARS = 3_000_000;
/** 比這更小聲就當作沒錄到聲音 */
const MIN_RMS = 0.003;

const PostSchema = z.union([
  z.object({ emoji: z.enum(VIDEO_REACTIONS) }),
  z.object({ body: z.string().max(500) }),
  z.object({ audio: z.string().max(MAX_AUDIO_CHARS).regex(AUDIO_DATA_URL) }),
]);

/** 錄音 → 檢查長度、音量 → m4a；不合格回 error 文字 */
async function prepareVoice(dataUrl: string): Promise<{ m4a: Buffer; seconds: number } | { error: string }> {
  let wav: Buffer;
  try {
    const [, b64] = dataUrl.match(AUDIO_DATA_URL)!;
    wav = await toWav(Buffer.from(b64, "base64"), { maxSeconds: VOICE_COMMENT_MAX_SECONDS });
  } catch (e) {
    console.warn("[api] voice comment convert failed:", e instanceof Error ? e.message : e);
    return { error: "錄音讀不出來，請再錄一次" };
  }
  const seconds = wavDurationSeconds(wav);
  if (seconds < VOICE_COMMENT_MIN_SECONDS) return { error: "錄音太短了，按住說完一句話再送出" };
  if (wavRms(wav) < MIN_RMS) return { error: "錄音裡聽不到聲音，請靠近手機再錄一次" };
  return { m4a: await wavToM4a(wav), seconds };
}

async function access(ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return { error: NextResponse.json({ error: "找不到這支影片" }, { status: 404 }) };
  }
  const admin = createSupabaseAdmin();
  const found = await loadVideoAccess(admin, id, user.id);
  if (!found) return { error: NextResponse.json({ error: "找不到這支影片" }, { status: 404 }) };
  return { user, admin, found };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await access(ctx);
  if ("error" in a) return a.error;
  const views = await loadCommentsViews(a.admin, [a.found.video], a.user.id);
  return NextResponse.json({ comments: views.get(a.found.video.id) ?? EMPTY_COMMENTS });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await access(ctx);
  if ("error" in a) return a.error;
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });

  const { admin, user, found } = a;
  try {
    if ("emoji" in parsed.data) {
      const emoji = parsed.data.emoji;
      const added = await toggleReaction(admin, found.video.id, user.id, emoji);
      if (added) after(() => notifyVideoComment(admin, found, user.id, { emoji }));
    } else if ("audio" in parsed.data) {
      const voice = await prepareVoice(parsed.data.audio);
      if ("error" in voice) return NextResponse.json({ error: voice.error }, { status: 400 });
      const commentId = await addVoiceComment(admin, found, user.id, voice);
      if (!commentId) {
        return NextResponse.json({ error: `這支影片你已經留了 ${VIDEO_COMMENTS_PER_AUTHOR} 則，先休息一下吧` }, { status: 429 });
      }
      after(() => notifyVideoComment(admin, found, user.id, { voiceSeconds: voice.seconds, commentId }));
    } else {
      const body = sanitizeComment(parsed.data.body);
      if (!body) return NextResponse.json({ error: "先寫一句話喔" }, { status: 400 });
      const commentId = await addComment(admin, found.video.id, user.id, body);
      if (!commentId) {
        return NextResponse.json({ error: `這支影片你已經留了 ${VIDEO_COMMENTS_PER_AUTHOR} 則，先休息一下吧` }, { status: 429 });
      }
      after(() => notifyVideoComment(admin, found, user.id, { body, commentId }));
    }
  } catch (e) {
    console.error("[api] video comment failed:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  const views = await loadCommentsViews(admin, [found.video], user.id);
  return NextResponse.json({ comments: views.get(found.video.id) ?? EMPTY_COMMENTS });
}
