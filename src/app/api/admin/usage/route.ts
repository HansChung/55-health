import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { taipeiDay } from "@/lib/admin-costs";
import { loadPricedUsage } from "@/lib/admin-costs-server";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days")) || 30, 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const supabase = createSupabaseAdmin();
  const priced = await loadPricedUsage(supabase, since.toISOString());
  if (!priced) return NextResponse.json({ error: "讀取用量失敗" }, { status: 500 });
  const all = priced.rows;

  // 總成本（算力，算法同「每月成本」；ai_usage.cost_usd 走 lk888 時一律是 0）
  const totalPoints = all.reduce((s, r) => s + r.points, 0);

  // 各服務分組
  const serviceMap = new Map<string, { count: number; points: number; tokens: number }>();
  for (const r of all) {
    const key = r.service ?? "?";
    const cur = serviceMap.get(key) ?? { count: 0, points: 0, tokens: 0 };
    cur.count++;
    cur.points += r.points;
    cur.tokens += (r.input_tokens || 0) + (r.output_tokens || 0);
    serviceMap.set(key, cur);
  }
  const byService = Array.from(serviceMap.entries())
    .map(([service, v]) => ({ service, ...v }))
    .sort((a, b) => b.points - a.points);

  // 每日趨勢（台北日期）
  const dailyMap = new Map<string, { points: number; count: number }>();
  for (const r of all) {
    const day = taipeiDay(r.created_at);
    const cur = dailyMap.get(day) ?? { points: 0, count: 0 };
    cur.points += r.points;
    cur.count++;
    dailyMap.set(day, cur);
  }
  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // Top 用戶
  const userMap = new Map<string, { points: number; count: number }>();
  for (const r of all) {
    if (!r.user_id) continue;
    const cur = userMap.get(r.user_id) ?? { points: 0, count: 0 };
    cur.points += r.points;
    cur.count++;
    userMap.set(r.user_id, cur);
  }
  const topUserIds = Array.from(userMap.entries())
    .sort(([, a], [, b]) => b.points - a.points)
    .slice(0, 10);

  // 取得這些用戶 email
  const userIds = topUserIds.map(([id]) => id);
  let userEmails = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    userEmails = new Map(
      users
        .filter((u: { id: string }) => userIds.includes(u.id))
        .map((u: { id: string; email?: string }) => [u.id, u.email ?? ""])
    );
  }

  const topUsers = topUserIds.map(([user_id, v]) => ({
    user_id,
    email: userEmails.get(user_id) ?? null,
    ...v,
  }));

  return NextResponse.json({ totalPoints, pointNtd: priced.settings.pointNtd, users: userMap.size, byService, daily, topUsers });
}
