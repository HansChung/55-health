// ────────────────────────────────────────────────
// 後台「書本練習內容」：全部章節共用的設定（目前只有進階內容要收起來還是全部顯示）
// GET → { settings, ready }；PUT { settings } → { settings }
// 存在 app_settings（key='book'），章節頁每次打開都重新讀，存了立即生效
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_BOOK_SETTINGS, normalizeBookSettings } from "@/lib/chapter-content";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", "book").maybeSingle();
  return NextResponse.json({
    settings: data ? normalizeBookSettings((data as { value: unknown }).value) : DEFAULT_BOOK_SETTINGS,
    // 還沒跑 add-plan-settings.sql：存不了，畫面要提示
    ready: !error,
  });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { settings?: unknown } | null;
  if (!body?.settings || typeof body.settings !== "object") {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }
  const settings = normalizeBookSettings(body.settings);
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "book", value: settings, updated_at: new Date().toISOString(), updated_by: admin.id });
  if (error) {
    console.error("[api] save book settings:", error.message);
    return NextResponse.json(
      { error: /app_settings/.test(error.message) ? "請先在 Supabase 跑 add-plan-settings.sql" : "伺服器忙線中，請稍後再試" },
      { status: 500 }
    );
  }
  return NextResponse.json({ settings });
}
