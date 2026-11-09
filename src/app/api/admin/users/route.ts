import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { loadPricedUsage } from "@/lib/admin-costs-server";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const { data: profiles } = await supabase.from("profiles").select("*");

  // 過去 30 天 AI 成本（算力，算法同「每月成本」）
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const priced = await loadPricedUsage(supabase, since.toISOString());
  if (!priced) return NextResponse.json({ error: "讀取用量失敗" }, { status: 500 });

  const pointsMap = new Map<string, number>();
  for (const u of priced.rows) {
    if (!u.user_id) continue;
    pointsMap.set(u.user_id, (pointsMap.get(u.user_id) ?? 0) + u.points);
  }

  // 餐點數
  const { data: mealCounts } = await supabase
    .from("meals")
    .select("user_id")
    .gte("eaten_at", since.toISOString());
  const mealCountMap = new Map<string, number>();
  for (const m of mealCounts ?? []) {
    mealCountMap.set(m.user_id, (mealCountMap.get(m.user_id) ?? 0) + 1);
  }

  const profileMap = new Map((profiles ?? []).map((p: { id: string; [k: string]: unknown }) => [p.id, p]));

  const merged = users.map((u: { id: string; email?: string; created_at: string }) => {
    const p = (profileMap.get(u.id) as Record<string, unknown> | undefined) ?? {};
    return {
      id: u.id,
      email: u.email ?? null,
      display_name: (p.display_name as string) ?? null,
      subscription_tier: (p.subscription_tier as string) ?? "free",
      subscription_expires_at: (p.subscription_expires_at as string) ?? null,
      is_admin: (p.is_admin as boolean) ?? false,
      created_at: u.created_at,
      meals_count: mealCountMap.get(u.id) ?? 0,
      ai_points_30d: pointsMap.get(u.id) ?? 0,
    };
  });

  return NextResponse.json({ users: merged, pointNtd: priced.settings.pointNtd });
}
