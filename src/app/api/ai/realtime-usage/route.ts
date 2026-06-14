import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { calculateCost } from "@/lib/ai/pricing";

const UsageSchema = z.object({
  seconds: z.number().int().min(0).max(180),
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
    console.error("[api] 格式錯誤:", e); return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const model = body.model || process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";
  const admin = createSupabaseAdmin();

  // 計費完整性：找出建立 session 時記下的「開始時間 + 上限」，
  // 用伺服器算的實際經過秒數當下限，避免 client 低報秒數繞過配額。
  let serverElapsed = 0;
  let maxSeconds = 180;
  let pendingRowId: string | null = null;
  if (body.session_id) {
    const { data: pending } = await admin
      .from("ai_usage")
      .select("id, metadata")
      .eq("user_id", user.id)
      .eq("service", "openai_realtime")
      .contains("metadata", { session_id: body.session_id, pending: true })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pending) {
      pendingRowId = pending.id;
      const meta = (pending.metadata ?? {}) as { started_at?: string; max_seconds?: number };
      if (meta.max_seconds) maxSeconds = meta.max_seconds;
      if (meta.started_at) {
        serverElapsed = Math.ceil((Date.now() - new Date(meta.started_at).getTime()) / 1000);
      }
    }
  }

  // 取 client 回報與伺服器經過秒數的較大值（防低報），再 clamp 到 [1, maxSeconds]
  const clientSeconds = Math.max(0, Math.floor(body.seconds));
  const seconds = Math.min(maxSeconds, Math.max(1, clientSeconds, serverElapsed));
  const cost = calculateCost({
    model,
    audioInputSeconds: seconds,
    // Realtime 實際輸出秒數前端拿不到，用保守比例估成本，配額仍只看連線秒數。
    audioOutputSeconds: Math.round(seconds * 0.5),
  });

  const metadata = {
    session_id: body.session_id,
    reason: body.reason ?? "manual",
    max_single_session_seconds: maxSeconds,
    client_reported_seconds: clientSeconds,
    server_elapsed_seconds: serverElapsed,
    pending: false,
  };

  // 若有開始時的 placeholder 列就更新它（避免一個 session 算兩筆），否則新增一筆
  if (pendingRowId) {
    const { data, error } = await admin
      .from("ai_usage")
      .update({ audio_seconds: seconds, cost_usd: cost, metadata })
      .eq("id", pendingRowId)
      .select("id")
      .single();
    if (error) { console.error("[api] 更新語音用量失敗:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
    return NextResponse.json({ ok: true, id: data.id, seconds, cost_usd: cost });
  }

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
      metadata,
    })
    .select("id")
    .single();

  if (error) { console.error("[api] 寫入語音用量失敗:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ ok: true, id: data.id, seconds, cost_usd: cost });
}
