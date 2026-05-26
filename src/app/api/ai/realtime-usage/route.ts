import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { calculateCost } from "@/lib/ai/pricing";

const UsageSchema = z.object({
  seconds: z.number().int().min(1).max(180),
  model: z.string().optional(),
  session_id: z.string().optional(),
  reason: z.enum(["manual", "time_limit", "close", "unload", "error"]).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: z.infer<typeof UsageSchema>;
  try {
    body = UsageSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤", detail: String(e) }, { status: 400 });
  }

  const model = body.model || process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";
  const seconds = Math.min(180, Math.max(1, body.seconds));
  const cost = calculateCost({
    model,
    audioInputSeconds: seconds,
    // Realtime 實際輸出秒數前端拿不到，用保守比例估成本，配額仍只看連線秒數。
    audioOutputSeconds: Math.round(seconds * 0.5),
  });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("ai_usage")
    .insert({
      user_id: user.id,
      service: "openai_realtime",
      model,
      audio_seconds: seconds,
      cost_usd: cost,
      endpoint: "/api/ai/realtime-session",
      success: true,
      metadata: {
        session_id: body.session_id,
        reason: body.reason ?? "manual",
        max_single_session_seconds: 180,
      },
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id, seconds, cost_usd: cost });
}
