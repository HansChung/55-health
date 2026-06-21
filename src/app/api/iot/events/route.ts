// 列出當前長輩的 IoT 感測事件（最新在前）
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const elderId = req.nextUrl.searchParams.get("elder") ?? user.id;

  const { data, error } = await supabase
    .from("iot_events")
    .select("*")
    .eq("user_id", elderId)
    .order("occurred_at", { ascending: false })
    .limit(30);

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ events: data });
}
