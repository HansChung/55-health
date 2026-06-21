// 列出當前長輩的 IoT 裝置（RLS 確保只看到自己的或被授權的）
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const elderId = req.nextUrl.searchParams.get("elder") ?? user.id;

  const { data, error } = await supabase
    .from("iot_devices")
    .select("*")
    .eq("user_id", elderId)
    .order("created_at", { ascending: true });

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ devices: data });
}
