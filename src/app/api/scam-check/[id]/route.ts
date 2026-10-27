// 這則訊息可疑嗎？：刪掉一筆自己問過的紀錄（DELETE → { ok }）
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  const { data, error } = await createSupabaseAdmin().from("scam_checks").delete().eq("id", id).eq("user_id", user.id).select("id");
  if (error) {
    console.error("[api] scam-check delete:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  if ((data ?? []).length === 0) return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
