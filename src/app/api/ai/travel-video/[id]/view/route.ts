// ────────────────────────────────────────────────
// 家人播放了長輩的出遊影片 → 記一筆「看過了」（只顯示給長輩，不推播）
// POST → { ok: true }；長輩自己看不記
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadVideoAccess, recordVideoView } from "@/lib/video-comments-server";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "找不到這支影片" }, { status: 404 });

  const admin = createSupabaseAdmin();
  const access = await loadVideoAccess(admin, id, user.id);
  if (!access) return NextResponse.json({ error: "找不到這支影片" }, { status: 404 });
  if (!access.isOwner) await recordVideoView(admin, id, user.id);
  return NextResponse.json({ ok: true });
}
