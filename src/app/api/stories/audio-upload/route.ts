// ────────────────────────────────────────────────
// 聲音故事：拿一個簽名上傳網址，瀏覽器直接把錄音傳到 Supabase（大檔案不經過 Vercel）
// POST { fileName, size, type } → { path, token, contentType }；傳好之後存故事時帶 audioPath
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { StoryAudioError, createStoryAudioUpload } from "@/lib/story-audio-server";

const Schema = z.object({
  fileName: z.string().max(300),
  size: z.number().int().min(1),
  type: z.string().max(100),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  try {
    return NextResponse.json(await createStoryAudioUpload(createSupabaseAdmin(), user.id, parsed.data));
  } catch (e) {
    if (e instanceof StoryAudioError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[api] story audio upload:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
}
