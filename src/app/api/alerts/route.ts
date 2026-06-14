// ────────────────────────────────────────────────
// 警報讀取 API
// - 預設：回傳「我自己的」警報（長輩本人看）
// - ?elder=<id>：回傳某位長輩的警報（家人看，RLS 會擋掉沒授權的）
// RLS 已確保只有本人或被授權家人能讀
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const elderId = req.nextUrl.searchParams.get("elder") ?? user.id;
  const unresolvedOnly = req.nextUrl.searchParams.get("unresolved") === "1";

  let query = supabase
    .from("alerts")
    .select("*")
    .eq("elder_id", elderId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unresolvedOnly) query = query.eq("resolved", false);

  const { data, error } = await query;
  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ alerts: data });
}
