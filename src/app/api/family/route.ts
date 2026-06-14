import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const InviteSchema = z.object({
  family_name: z.string().min(1).max(30),
  relationship: z.string().min(1).max(30),
  permissions: z.object({
    calories: z.boolean().optional(),
    alerts: z.boolean().optional(),
    diary: z.boolean().optional(),
    voice: z.boolean().optional(),
  }).optional(),
});

/** 列出當前用戶的所有家人連結 */
export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("family_links")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ family: data });
}

/** 建立邀請（產生 6 位數邀請碼） */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = InviteSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  // 產生 6 位數邀請碼（格式：XXX-XXX）
  const code = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 小時有效

  const { data, error } = await supabase
    .from("family_links")
    .insert({
      owner_id: user.id,
      family_name: body.family_name,
      relationship: body.relationship,
      invite_code: code,
      invite_expires_at: expires.toISOString(),
      permissions: body.permissions ?? {
        calories: true,
        alerts: true,
        diary: true,
        voice: false,
      },
      status: "pending",
    })
    .select()
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ link: data });
}
