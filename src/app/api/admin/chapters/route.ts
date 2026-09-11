// 管理員：章節清單（內建＋後台新增）／新增章節
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getChapterOpening, listChapterOpenings } from "@/lib/chapter-opening";
import { CUSTOM_CHAPTER_ID_RE } from "@/lib/chapter-content";

interface Row {
  chapter_id: string;
  overrides: { title?: string; headerEmoji?: string } | null;
  updated_at: string;
  is_custom: boolean | null;
  published: boolean | null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const { data: rows } = await supabase
    .from("chapter_content")
    .select("chapter_id, overrides, updated_at, is_custom, published");
  const byId = new Map<string, Row>();
  for (const r of (rows ?? []) as Row[]) byId.set(r.chapter_id, r);

  const builtin = listChapterOpenings().map((ch) => {
    const r = byId.get(ch.id);
    return {
      id: ch.id,
      title: r?.overrides?.title || ch.title,
      subtitle: ch.subtitle,
      emoji: r?.overrides?.headerEmoji || ch.headerEmoji || "",
      overridden: !!r && !r.is_custom,
      custom: false,
      published: true,
      updated_at: r?.updated_at ?? null,
    };
  });

  const custom = [...byId.values()]
    .filter((r) => r.is_custom && !getChapterOpening(r.chapter_id))
    .map((r) => ({
      id: r.chapter_id,
      title: r.overrides?.title || "新章節",
      subtitle: "後台新增",
      emoji: r.overrides?.headerEmoji || "📘",
      overridden: false,
      custom: true,
      published: r.published !== false,
      updated_at: r.updated_at,
    }));

  const chapters = [...builtin, ...custom].sort((a, b) => a.id.localeCompare(b.id));
  return NextResponse.json({ chapters });
}

const createSchema = z.object({
  id: z.string().regex(CUSTOM_CHAPTER_ID_RE, "QR 碼需為四碼，前兩碼 01–12（例如 0215）"),
  title: z.string().trim().min(1, "請填標題").max(120),
});

/** 新增章節：一律先存成草稿，編輯好再發布 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "格式錯誤" }, { status: 400 });
  }
  const { id, title } = parsed.data;
  if (getChapterOpening(id)) {
    return NextResponse.json({ error: `QR 碼 ${id} 已是書本內建章節，請換一個` }, { status: 409 });
  }

  const supabase = createSupabaseAdmin();
  const { data: existing } = await supabase
    .from("chapter_content").select("chapter_id").eq("chapter_id", id).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `QR 碼 ${id} 已被使用，請換一個` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("chapter_content").insert({
    chapter_id: id,
    overrides: { title },
    is_custom: true,
    published: false,
    updated_at: now,
    updated_by: admin.id,
  });
  if (error) {
    console.error("[admin/chapters] 新增失敗:", error);
    return NextResponse.json({ error: "新增失敗，請確認已執行 add-chapter-content.sql" }, { status: 500 });
  }
  return NextResponse.json({ id }, { status: 201 });
}
