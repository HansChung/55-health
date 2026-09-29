// ────────────────────────────────────────────────
// 邁笙平台任務完成回呼（notify_url）
// 平台回呼不帶簽章：路徑密鑰只當「該去查了」的訊號，結果一律用 task_id 反查平台（syncTravelVideo）
// 同步完成後會推播給長輩「影片做好了」
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { syncTravelVideo, type TravelVideoRow } from "@/lib/ai/travel-video-server";
import { webhookSecretMatches } from "@/lib/ai/travel-video-webhook";
import { isTravelVideoPending } from "@/lib/travel-video";

// 成功時要下載影片再轉存 Storage
export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: { params: Promise<{ secret: string }> }) {
  const { secret } = await ctx.params;
  if (!webhookSecretMatches(secret, process.env.LK888_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { task_id?: unknown; is_final?: unknown } | null;
  const taskId = body?.task_id;
  if (typeof taskId !== "number" && typeof taskId !== "string") {
    return NextResponse.json({ ok: true });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("travel_videos")
    .select("*")
    .eq("task_id", String(taskId))
    .maybeSingle();
  if (error) {
    console.error("[webhook] lk888 lookup:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let row = data as TravelVideoRow | null;

  // 建立任務後 task_id 沒寫進 DB（只記在 log）→ 用回呼網址上的 video_id 補回來。
  // 只補「還沒有 task_id、仍在製作中」的列；真正狀態接著由 syncTravelVideo 向平台反查
  const videoId = req.nextUrl.searchParams.get("video_id");
  if (!row && videoId && z.string().uuid().safeParse(videoId).success) {
    const { data: orphan, error: fixErr } = await admin
      .from("travel_videos")
      .update({ task_id: String(taskId), updated_at: new Date().toISOString() })
      .eq("id", videoId)
      .is("task_id", null)
      .in("status", ["queued", "running"])
      .select("*")
      .maybeSingle();
    if (fixErr) {
      console.error("[webhook] lk888 reconcile task_id:", fixErr);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    if (orphan) console.warn(`[webhook] 補回 task_id：video_id=${videoId} task_id=${taskId}`);
    row = orphan as TravelVideoRow | null;
  }

  // 不是影片任務，或已經處理過（平台同一任務最多重送 4 次）
  if (!row || !isTravelVideoPending(row.status)) return NextResponse.json({ ok: true });

  const synced = await syncTravelVideo(row);
  // 平台說已結束、我們卻還沒存好（例如下載失敗）→ 回 5xx 讓平台稍後重送
  if (isTravelVideoPending(synced.status) && body?.is_final === true) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
