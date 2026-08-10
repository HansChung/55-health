// ────────────────────────────────────────────────
// 章節開篇私人草稿
// GET  ?chapter_id=1201 → { draft } | { draft: null }
// PUT  { chapter_id, payload } → upsert
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import { isChapterDraftId } from "@/lib/chapter-cloud-draft";

const PutSchema = z.object({
  chapter_id: z.string().refine(isChapterDraftId, { message: "invalid chapter_id" }),
  payload: z.record(z.string(), z.unknown()),
});

export type ChapterDraftRow = {
  chapter_id: string;
  payload: Record<string, unknown>;
  updated_at: string;
};

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const chapterId = req.nextUrl.searchParams.get("chapter_id") ?? "";
  if (!isChapterDraftId(chapterId)) {
    return NextResponse.json({ error: "章節編號格式有誤" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("chapter_drafts")
    .select("chapter_id, payload, updated_at")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (error) {
    console.error("[api] chapter_drafts GET:", error);
    const missing =
      error.code === "42P01" ||
      /chapter_drafts|schema cache|does not exist/i.test(error.message ?? "");
    if (missing) {
      return NextResponse.json(
        { error: "私人草稿功能尚未啟用，請管理員先執行 add-chapter-drafts.sql" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({ draft: (data as ChapterDraftRow | null) ?? null });
}

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: z.infer<typeof PutSchema>;
  try {
    body = PutSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] chapter_drafts 格式錯誤:", e);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("chapter_drafts")
    .upsert(
      {
        user_id: user.id,
        chapter_id: body.chapter_id,
        payload: body.payload,
        updated_at: updatedAt,
      },
      { onConflict: "user_id,chapter_id" }
    )
    .select("chapter_id, payload, updated_at")
    .single();

  if (error) {
    console.error("[api] chapter_drafts PUT:", error);
    const missing =
      error.code === "42P01" ||
      /chapter_drafts|schema cache|does not exist/i.test(error.message ?? "");
    if (missing) {
      return NextResponse.json(
        { error: "私人草稿功能尚未啟用，請管理員先執行 add-chapter-drafts.sql" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({ draft: data as ChapterDraftRow });
}
