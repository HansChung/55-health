import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const EventSchema = z.object({
  event_type: z.enum(["impression", "click"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  // 必須登入才記錄事件：避免未登入者無限灌 impression/click 汙染廣告數據
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: z.infer<typeof EventSchema>;
  try {
    body = EventSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] track 格式錯誤:", e);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const { id } = await params;
  const { error } = await supabase
    .from("partner_campaign_events")
    .insert({
      campaign_id: id,
      user_id: user.id,
      event_type: body.event_type,
    });

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
