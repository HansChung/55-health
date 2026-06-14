import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const PostSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
  session_id: z.string().uuid().optional(),
  audio_url: z.string().url().optional().nullable(),
  ai_usage_id: z.string().uuid().optional().nullable(),
});

/** 列出當前用戶的對話（管理員可用 ?user_id= 查別人）*/
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("session_id");
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 200), 500);
  const since = new Date();
  since.setDate(since.getDate() - days);

  let q = supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sessionId) q = q.eq("session_id", sessionId);

  const { data, error } = await q;
  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ messages: data });
}

/** 寫入一則訊息（fire-and-forget，不影響語音 UX）*/
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      role: body.role,
      content: body.content,
      session_id: body.session_id ?? null,
      audio_url: body.audio_url ?? null,
      ai_usage_id: body.ai_usage_id ?? null,
    })
    .select("id, session_id, created_at")
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ message: data });
}
