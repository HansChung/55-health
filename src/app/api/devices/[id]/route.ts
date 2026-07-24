// ────────────────────────────────────────────────
// 陪伴機器人 — 單一裝置管理（Supabase cookie 認證，RLS 保護）
// PATCH  → 改名
// DELETE → 解除綁定（刪列後裝置 token 立即失效）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const PatchSchema = z.object({
  name: z.string().min(1).max(30),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PatchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("devices")
    .update({ name: body.name })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, paired_at, last_seen_at, fw_version")
    .single();

  if (error || !data) return NextResponse.json({ error: "找不到裝置" }, { status: 404 });
  return NextResponse.json({ device: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { error } = await supabase
    .from("devices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[devices] DB error:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
