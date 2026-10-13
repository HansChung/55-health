// ────────────────────────────────────────────────
// 家人看長輩的血壓、血糖、體重紀錄（畫趨勢用）
// GET ?elder=<長輩 id>&type=blood_pressure|blood_glucose|weight&days=60 → { metrics }
// 只有已接受的家人、而且長輩開了「健康與守護」權限（permissions.alerts，和家人狀況一樣）才看得到
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

const TYPES = ["weight", "blood_pressure", "blood_glucose"] as const;
const MAX_DAYS = 180;

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const elder = req.nextUrl.searchParams.get("elder") ?? "";
  const type = req.nextUrl.searchParams.get("type");
  const days = Math.min(MAX_DAYS, Math.max(1, Math.floor(Number(req.nextUrl.searchParams.get("days") ?? 60)) || 60));
  if (!/^[0-9a-f-]{36}$/i.test(elder) || !TYPES.includes(type as (typeof TYPES)[number])) {
    return NextResponse.json({ error: "參數不對" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: link } = await admin
    .from("family_links")
    .select("permissions")
    .eq("owner_id", elder)
    .eq("family_user_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();
  const perms = ((link as { permissions: Record<string, boolean> | null } | null)?.permissions ?? {}) as Record<string, boolean>;
  if (!link || !perms.alerts) return NextResponse.json({ error: "長輩還沒開放健康紀錄給你看" }, { status: 403 });

  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data, error } = await admin
    .from("health_metrics")
    .select("id, user_id, metric_type, measured_at, weight_kg, systolic, diastolic, pulse, glucose_mg_dl, glucose_context, notes")
    .eq("user_id", elder)
    .eq("metric_type", type as string)
    .gte("measured_at", since)
    .order("measured_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("[api] family health-metrics:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ metrics: data ?? [] });
}
