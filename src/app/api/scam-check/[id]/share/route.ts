// ────────────────────────────────────────────────
// 這則訊息可疑嗎？：長輩按「通知家人」
// POST → { family, pushed }：家人狀況裡看得到這一筆，有開通知的家人收到推播
// 沒有連結家人 → 409（畫面改請他用 LINE 傳）；同一筆按第二次不再推播
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { acceptedFamilyIds, pushScamCheckToFamily, type ScamCheckRow } from "@/lib/scam-check-server";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });

  const admin = createSupabaseAdmin();
  const { data: own } = await admin.from("scam_checks").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!own) return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  const family = await acceptedFamilyIds(admin, user.id);
  if (family.length === 0) {
    return NextResponse.json({ error: "還沒有連結家人，可以先用 LINE 傳給家人", noFamily: true }, { status: 409 });
  }
  // 只有第一次按才推播（條件更新：同時按兩下也只會推一次）
  const { data: claimed, error } = await admin
    .from("scam_checks")
    .update({ shared_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("shared_at", null)
    .select("*");
  if (error) {
    console.error("[api] scam-check share:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  const row = ((claimed ?? []) as ScamCheckRow[])[0];
  if (!row) return NextResponse.json({ family: family.length, pushed: 0, already: true });
  const pushed = await pushScamCheckToFamily(admin, row, family);
  return NextResponse.json({ family: family.length, pushed });
}
