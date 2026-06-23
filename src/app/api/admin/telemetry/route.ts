// 管理員：使用分析 + 錯誤總覽
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const days = Number(req.nextUrl.searchParams.get("days") ?? 7);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const supabase = createSupabaseAdmin();
  const { data: rows } = await supabase
    .from("app_events")
    .select("kind, name, detail, path, created_at, user_id")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);

  const all = (rows ?? []) as { kind: string; name: string; detail: Record<string, unknown>; path: string | null; created_at: string; user_id: string | null }[];

  // 使用事件：依名稱計次 + 不重複使用者數
  const usageMap = new Map<string, { count: number; users: Set<string> }>();
  for (const r of all) {
    if (r.kind !== "usage") continue;
    const cur = usageMap.get(r.name) ?? { count: 0, users: new Set<string>() };
    cur.count++;
    if (r.user_id) cur.users.add(r.user_id);
    usageMap.set(r.name, cur);
  }
  const usage = Array.from(usageMap.entries())
    .map(([name, v]) => ({ name, count: v.count, users: v.users.size }))
    .sort((a, b) => b.count - a.count);

  // 活躍使用者（有任何事件的不重複 user）
  const activeUsers = new Set(all.filter((r) => r.user_id).map((r) => r.user_id)).size;

  // 錯誤：最近 50 筆 + 依訊息計次
  const errorRows = all.filter((r) => r.kind === "error");
  const errorMap = new Map<string, number>();
  for (const r of errorRows) {
    const msg = String((r.detail as { message?: string })?.message ?? r.name).slice(0, 120);
    errorMap.set(msg, (errorMap.get(msg) ?? 0) + 1);
  }
  const topErrors = Array.from(errorMap.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  const recentErrors = errorRows.slice(0, 30).map((r) => ({
    name: r.name,
    message: String((r.detail as { message?: string })?.message ?? "").slice(0, 200),
    path: r.path,
    at: r.created_at,
  }));

  return NextResponse.json({
    days,
    total_events: all.length,
    active_users: activeUsers,
    error_count: errorRows.length,
    usage,
    top_errors: topErrors,
    recent_errors: recentErrors,
  });
}
