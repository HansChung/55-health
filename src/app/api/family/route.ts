import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import { generateInviteCode } from "@/lib/family-invite";

const InviteSchema = z.object({
  family_name: z.string().min(1).max(30),
  relationship: z.string().min(1).max(30),
  permissions: z.object({
    calories: z.boolean().optional(),
    alerts: z.boolean().optional(),
    diary: z.boolean().optional(),
    voice: z.boolean().optional(),
    trips: z.boolean().optional(),
    videos: z.boolean().optional(),
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

/** 建立邀請（產生 8 位數邀請碼） */
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

  const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24 小時有效

  // 8 位數邀請碼（1234-5678，加密亂數；家人在「家人狀況」輸入）；invite_code 是 unique，極少數撞到就換一個
  const insert = () =>
    supabase
      .from("family_links")
      .insert({
        owner_id: user.id,
        family_name: body.family_name,
        relationship: body.relationship,
        invite_code: generateInviteCode(),
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
  let { data, error } = await insert();
  for (let i = 0; i < 2 && error?.code === "23505"; i++) ({ data, error } = await insert());

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ link: data });
}
