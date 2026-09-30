// ────────────────────────────────────────────────
// 多張照片遊記：背景接力（伺服器自己呼叫自己，沒人開著畫面也會一段一段做完）
// POST { id }，Authorization: Bearer CRON_SECRET → 馬上回 202，在這個函式的 after() 裡做下一段
// 做完一段還沒完成，syncMontage 會再叫下一棒；拿不到租約（別人在做）就不叫，所以不會越叫越多
// ────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { montageRetryDelayMs, syncMontage } from "@/lib/ai/travel-montage-server";
import type { TravelVideoRow } from "@/lib/ai/travel-video-server";
import { isTravelVideoPending } from "@/lib/travel-video";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** after() 裡的工作時間（含失敗重試前的等待），留時間給上傳與寫 DB */
const WORK_BUDGET_MS = 45_000;

export async function POST(req: NextRequest) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" && UUID_RE.test(body.id) ? body.id : null;
  if (!id) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("travel_videos")
    .select("*")
    .eq("id", id)
    .eq("kind", "montage")
    .is("deleted_at", null)
    .maybeSingle();
  const row = data as TravelVideoRow | null;
  if (!row || !isTravelVideoPending(row.status)) return NextResponse.json({ ok: true, skipped: true });

  const origin = new URL(req.url).origin;
  after(async () => {
    const wait = montageRetryDelayMs(row.montage?.attempts ?? 0);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    await syncMontage(row, { origin, budgetMs: WORK_BUDGET_MS - wait }).catch((e) =>
      console.error("[montage] continuation step failed:", e)
    );
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}
