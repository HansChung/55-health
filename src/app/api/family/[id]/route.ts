import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

const PatchSchema = z.object({
  permissions: z.object({
    calories: z.boolean().optional(),
    alerts: z.boolean().optional(),
    diary: z.boolean().optional(),
    voice: z.boolean().optional(),
    trips: z.boolean().optional(),
  }).optional(),
  status: z.enum(["pending", "accepted", "revoked"]).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await ctx.params;
  let body;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  // family_links 沒有開放使用者直接 update 的 RLS policy（schema.sql 只有讀、新增）→
  // 由伺服器用 service role 寫，並明確限定「只能改自己的」連結；也只收 permissions／status 兩個欄位
  const { data, error } = await createSupabaseAdmin()
    .from("family_links")
    .update(body)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select()
    .maybeSingle();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  if (!data) return NextResponse.json({ error: "找不到這位家人" }, { status: 404 });
  return NextResponse.json({ link: data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await ctx.params;
  // 同上：沒有 delete policy 時用使用者身分刪會「刪 0 筆但回成功」→ 改由伺服器刪，只能刪自己的
  const { data, error } = await createSupabaseAdmin()
    .from("family_links")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id");

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  if (!data?.length) return NextResponse.json({ error: "找不到這位家人" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
