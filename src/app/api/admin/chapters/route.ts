// 管理員：章節清單（含是否已被覆蓋）
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { listChapterOpenings } from "@/lib/chapter-opening";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const { data: rows } = await supabase
    .from("chapter_content")
    .select("chapter_id, updated_at");
  const overridden = new Map<string, string>();
  for (const r of (rows ?? []) as { chapter_id: string; updated_at: string }[]) {
    overridden.set(r.chapter_id, r.updated_at);
  }

  const chapters = listChapterOpenings().map((ch) => ({
    id: ch.id,
    title: ch.title,
    subtitle: ch.subtitle,
    emoji: ch.headerEmoji ?? "",
    overridden: overridden.has(ch.id),
    updated_at: overridden.get(ch.id) ?? null,
  }));

  return NextResponse.json({ chapters });
}
