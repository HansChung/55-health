// ────────────────────────────────────────────────
// 後台「每月成本」
// GET ?month=YYYY-MM → AI 花費（實際＋估算）、lk888 餘額與這個月實際扣點、固定費用、收入估算
// PUT { settings } → 存算力價格、匯率、金流手續費、固定費用（app_settings key = 'costs'）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  daysLeft,
  isMonth,
  lk888MonthUsed,
  monthRange,
  normalizeCostSettings,
  recentMonths,
  summarizeUsage,
  taipeiMonth,
  type UsageRow,
} from "@/lib/admin-costs";
import { fetchLk888Balance, fetchTokenRates, loadCostSettings, loadRevenue, loadSnapshots, saveSnapshot } from "@/lib/admin-costs-server";

export const dynamic = "force-dynamic";

const PAGE = 1000;
const MAX_ROWS = 100_000;

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "權限不足" }, { status: 403 });
  const asked = req.nextUrl.searchParams.get("month");
  const month = isMonth(asked) ? asked : taipeiMonth();
  const { start, end } = monthRange(month);
  const admin = createSupabaseAdmin();

  // 這個月的 AI 使用紀錄（分頁讀完）
  const rows: UsageRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await admin
      .from("ai_usage")
      .select("user_id, endpoint, model, input_tokens, output_tokens, success, metadata, created_at")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("[api] admin costs:", error);
      return NextResponse.json({ error: "讀取失敗" }, { status: 500 });
    }
    rows.push(...((data ?? []) as UsageRow[]));
    if ((data ?? []).length < PAGE) break;
  }

  const tokenModels = rows.filter((r) => typeof r.metadata?.platform_cost !== "number" && (r.input_tokens || r.output_tokens) && r.model).map((r) => r.model!);
  const [rates, balance, settings, revenue] = await Promise.all([
    fetchTokenRates(tokenModels),
    fetchLk888Balance(),
    loadCostSettings(admin),
    loadRevenue(admin),
  ]);
  if (balance) await saveSnapshot(admin, balance);
  const snapshots = await loadSnapshots(admin);
  const summary = summarizeUsage(rows, rates);

  // 前 10 名的 email
  const emails = new Map<string, string>();
  await Promise.all(
    summary.topUsers.map(async (u) => {
      const { data } = await admin.auth.admin.getUserById(u.user_id);
      if (data?.user?.email) emails.set(u.user_id, data.user.email);
    })
  );

  return NextResponse.json({
    month,
    months: recentMonths(),
    settings,
    summary: { ...summary, topUsers: summary.topUsers.map((u) => ({ ...u, email: emails.get(u.user_id) ?? null })) },
    rates,
    lk888: balance
      ? { balance: balance.balance, monthUsed: lk888MonthUsed(snapshots, month, balance), daysLeft: daysLeft(balance.balance, snapshots, balance) }
      : { balance: null, monthUsed: lk888MonthUsed(snapshots, month, null), daysLeft: null },
    revenue,
  });
}

export async function PUT(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "權限不足" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { settings?: unknown } | null;
  const settings = normalizeCostSettings(body?.settings);
  const { error } = await createSupabaseAdmin()
    .from("app_settings")
    .upsert({ key: "costs", value: settings, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "key" });
  if (error) {
    console.error("[api] admin costs settings:", error);
    return NextResponse.json({ error: "沒存成功（add-plan-settings.sql 跑了嗎？）" }, { status: 500 });
  }
  return NextResponse.json({ settings });
}
