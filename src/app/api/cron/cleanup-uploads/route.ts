// ────────────────────────────────────────────────
// 每天清掉照片暫存區（user-uploads）超過一天的檔案
// 照片直傳 Supabase 後，分析完、做完影片就用不到了（影片要留的已經複製到 travel-videos）
// 順便刪掉超過 SCAM_CHECK_KEEP_DAYS 天的「這則訊息可疑嗎？」紀錄
// 由 Vercel Cron 觸發（見 vercel.json），CRON_SECRET 保護
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { cleanupStaleUserUploads } from "@/lib/ai/user-uploads-server";
import { SCAM_CHECK_KEEP_DAYS } from "@/lib/scam-check";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createSupabaseAdmin();
  // 可疑訊息紀錄：還沒跑 add-scam-checks.sql 時表不存在，記錄就好、不影響清照片
  const cutoff = new Date(Date.now() - SCAM_CHECK_KEEP_DAYS * 24 * 3600 * 1000).toISOString();
  const { count: scamChecks, error: scamErr } = await admin.from("scam_checks").delete({ count: "exact" }).lt("created_at", cutoff);
  if (scamErr) console.warn("[cron] cleanup scam checks:", scamErr.message);
  try {
    const removed = await cleanupStaleUserUploads(admin);
    return NextResponse.json({ ok: true, removed, scamChecks: scamChecks ?? 0 });
  } catch (e) {
    // 還沒跑 add-user-uploads.sql 時 stale_user_uploads 不存在：記錄就好
    console.error("[cron] cleanup uploads:", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
