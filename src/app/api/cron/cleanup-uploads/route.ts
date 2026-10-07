// ────────────────────────────────────────────────
// 每天清掉照片暫存區（user-uploads）超過一天的檔案
// 照片直傳 Supabase 後，分析完、做完影片就用不到了（影片要留的已經複製到 travel-videos）
// 由 Vercel Cron 觸發（見 vercel.json），CRON_SECRET 保護
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { cleanupStaleUserUploads } from "@/lib/ai/user-uploads-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const removed = await cleanupStaleUserUploads(createSupabaseAdmin());
    return NextResponse.json({ ok: true, removed });
  } catch (e) {
    // 還沒跑 add-user-uploads.sql 時 stale_user_uploads 不存在：記錄就好
    console.error("[cron] cleanup uploads:", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
