// ────────────────────────────────────────────────
// 後台「方案與次數」：功能開關、最低方案、各項次數上限
// GET → { settings, defaults, updatedAt, saved }；PUT { settings } → { settings }
// 存在 app_settings（key='plan'）；各程式實例最多 30 秒後生效
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { baseSettings, getPlanSettings, invalidatePlanSettings } from "@/lib/plan-access-server";
import { defaultPlanSettings, normalizePlanSettings } from "@/lib/plan-settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("app_settings").select("updated_at").eq("key", "plan").maybeSingle();
  return NextResponse.json({
    settings: await getPlanSettings({ fresh: true }),
    // 預設值：程式裡的數字（拍照、影片用 subscription_plans 原本的設定）
    defaults: await baseSettings(supabase).catch(() => defaultPlanSettings()),
    updatedAt: (data as { updated_at: string } | null)?.updated_at ?? null,
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
  // 以目前的設定為底：只送一部分也不會把其他項目變回預設
  const settings = normalizePlanSettings(body.settings, await getPlanSettings({ fresh: true }));
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "plan", value: settings, updated_at: new Date().toISOString(), updated_by: admin.id });
  if (error) {
    console.error("[api] save plan settings:", error.message);
    return NextResponse.json(
      { error: /app_settings/.test(error.message) ? "請先在 Supabase 跑 add-plan-settings.sql" : "伺服器忙線中，請稍後再試" },
      { status: 500 }
    );
  }
  invalidatePlanSettings();
  return NextResponse.json({ settings });
}
