// ────────────────────────────────────────────────
// 陪伴機器人 — 使用者端裝置管理（Supabase cookie 認證）
// GET  → 列出我的裝置
// POST → 產生新的 6 位數配對碼（建立待配對裝置）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const PAIRING_TTL_MS = 10 * 60 * 1000; // 配對碼 10 分鐘有效

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("devices")
    .select("id, name, pairing_code, pairing_expires_at, paired_at, last_seen_at, fw_version, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[devices] DB error:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ devices: data });
}

const PostSchema = z.object({
  name: z.string().min(1).max(30).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PostSchema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  // 先清掉自己過期又沒配對成功的舊列（避免累積垃圾列）
  await supabase
    .from("devices")
    .delete()
    .eq("user_id", user.id)
    .is("paired_at", null)
    .lt("pairing_expires_at", new Date().toISOString());

  // 產生不易撞碼的 6 位數（100000-999999）
  const pairingCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS).toISOString();

  const { data, error } = await supabase
    .from("devices")
    .insert({
      user_id: user.id,
      name: body.name || "暖暖機器人",
      pairing_code: pairingCode,
      pairing_expires_at: expiresAt,
    })
    .select("id, name, pairing_code, pairing_expires_at, created_at")
    .single();

  if (error) {
    console.error("[devices] DB error:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({
    device: data,
    pairing_code: pairingCode,
    expires_at: expiresAt,
  });
}
