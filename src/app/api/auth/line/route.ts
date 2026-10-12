// ────────────────────────────────────────────────
// LINE 登入狀態
// GET → { configured, linked, name, picture, canUnlink }（沒登入也可以問 configured：登入畫面決定要不要顯示 LINE 按鈕）
// DELETE → 解除連結（只用 LINE 登入、沒有真的 Email 的帳號不能解除，不然就登不進來了）
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { isPlaceholderEmail, lineConfig } from "@/lib/line-login";
import { lineAccountOf } from "@/lib/line-login-server";

export async function GET() {
  const configured = Boolean(lineConfig());
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ configured, linked: false });
  try {
    const account = await lineAccountOf(createSupabaseAdmin(), user.id);
    return NextResponse.json({
      configured,
      linked: Boolean(account),
      name: account?.display_name ?? null,
      picture: account?.picture_url ?? null,
      canUnlink: Boolean(account) && !isPlaceholderEmail(user.email),
    });
  } catch (e) {
    // 還沒跑 add-line-login.sql：當作沒有連結
    console.warn("[line-login] status:", e instanceof Error ? e.message : e);
    return NextResponse.json({ configured, linked: false });
  }
}

export async function DELETE() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  if (isPlaceholderEmail(user.email)) {
    return NextResponse.json({ error: "這個帳號只能用 LINE 登入，解除連結就登不進來了" }, { status: 409 });
  }
  const { error } = await createSupabaseAdmin().from("line_accounts").delete().eq("user_id", user.id);
  if (error) {
    console.error("[line-login] unlink:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
