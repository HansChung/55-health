// ────────────────────────────────────────────────
// 標記警報為「已處理」
// 只有「長輩本人」或「被授權家人」可操作。
// 防禦縱深：route 層自己驗證擁有權，不單純依賴 RLS（避免 RLS 缺口造成越權竄改）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await ctx.params;

  // 1. 先取這筆警報，確認存在並拿到所屬長輩 id
  const { data: alert, error: fetchError } = await supabase
    .from("alerts")
    .select("id, elder_id")
    .eq("id", id)
    .single();

  if (fetchError || !alert) {
    return NextResponse.json({ error: "找不到這則提醒" }, { status: 404 });
  }

  // 2. 驗證操作者有權處理：長輩本人，或 accepted + 有 alerts 權限的家人
  let authorized = alert.elder_id === user.id;
  if (!authorized) {
    const { data: link } = await supabase
      .from("family_links")
      .select("permissions")
      .eq("owner_id", alert.elder_id)
      .eq("family_user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();
    authorized = !!link && (link.permissions as { alerts?: boolean } | null)?.alerts === true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "沒有權限處理這則提醒" }, { status: 403 });
  }

  // 3. 通過授權才更新（仍用 RLS-aware client 作為第二道防線）
  const { data, error } = await supabase
    .from("alerts")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("更新警報失敗:", error);
    return NextResponse.json({ error: "更新失敗，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ alert: data });
}
