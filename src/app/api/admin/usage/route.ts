import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const supabase = createSupabaseAdmin();
  const { data: rows } = await supabase
    .from("ai_usage")
    .select("service, model, input_tokens, output_tokens, cost_usd, created_at, user_id")
    .gte("created_at", since.toISOString());

  const all = rows ?? [];

  // 總成本
  const totalCostUsd = all.reduce((s: number, r: { cost_usd: number | null }) => s + Number(r.cost_usd || 0), 0);

  // 各服務分組
  const serviceMap = new Map<string, { count: number; cost: number; tokens: number }>();
  for (const r of all) {
    const key = r.service as string;
    const cur = serviceMap.get(key) ?? { count: 0, cost: 0, tokens: 0 };
    cur.count++;
    cur.cost += Number(r.cost_usd || 0);
    cur.tokens += (r.input_tokens || 0) + (r.output_tokens || 0);
    serviceMap.set(key, cur);
  }
  const byService = Array.from(serviceMap.entries()).map(([service, v]) => ({ service, ...v }));

  // 每日趨勢
  const dailyMap = new Map<string, { cost: number; count: number }>();
  for (const r of all) {
    const day = (r.created_at as string).substring(0, 10);
    const cur = dailyMap.get(day) ?? { cost: 0, count: 0 };
    cur.cost += Number(r.cost_usd || 0);
    cur.count++;
    dailyMap.set(day, cur);
  }
  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // Top 用戶
  const userMap = new Map<string, { cost: number; count: number }>();
  for (const r of all) {
    if (!r.user_id) continue;
    const cur = userMap.get(r.user_id) ?? { cost: 0, count: 0 };
    cur.cost += Number(r.cost_usd || 0);
    cur.count++;
    userMap.set(r.user_id, cur);
  }
  const topUserIds = Array.from(userMap.entries())
    .sort(([, a], [, b]) => b.cost - a.cost)
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

  return NextResponse.json({ totalCostUsd, byService, daily, topUsers });
}
