// ────────────────────────────────────────────────
// 子女／家人儀表板彙整 API
// 回傳「我（登入者）關心的每位長輩」的狀態總覽
// 安全性：先驗證 accepted 家人關係，再以 service role 讀資料；
//         並依長輩授權的權限（calories / alerts）決定顯示範圍
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Medication {
  name?: string;
  reminder_enabled?: boolean;
  taken_today?: boolean;
}

// 台灣今天 00:00 的 UTC ISO
function startOfTaipeiTodayISO(): string {
  const now = new Date();
  const tp = new Date(now.getTime() + 8 * 3600 * 1000);
  const startUtc = Date.UTC(tp.getUTCFullYear(), tp.getUTCMonth(), tp.getUTCDate()) - 8 * 3600 * 1000;
  return new Date(startUtc).toISOString();
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const admin = createSupabaseAdmin();

  // 1. 我是哪些長輩的「已接受」家人
  const { data: links } = await admin
    .from("family_links")
    .select("owner_id, relationship, permissions")
    .eq("family_user_id", user.id)
    .eq("status", "accepted");

  if (!links || links.length === 0) {
    return NextResponse.json({ elders: [] });
  }

  const todayISO = startOfTaipeiTodayISO();
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const elders = await Promise.all(
    (links as { owner_id: string; relationship: string | null; permissions: Record<string, boolean> | null }[]).map(async (link) => {
      const elderId = link.owner_id as string;
      const perms = (link.permissions ?? {}) as Record<string, boolean>;
      const canMeals = perms.calories !== false; // 預設可看飲食
      const canHealth = !!perms.alerts; // 健康/警報/IoT 需開啟提醒權限

      const { data: profile } = await admin
        .from("profiles")
        .select("display_name, medications")
        .eq("id", elderId)
        .single();

      const elderName = profile?.display_name ?? "長輩";

      // 飲食（今天）
      let meals: { logged: number; lastAt: string | null } | null = null;
      if (canMeals) {
        const { data: mealRows } = await admin
          .from("meals")
          .select("eaten_at")
          .eq("user_id", elderId)
          .gte("eaten_at", todayISO)
          .order("eaten_at", { ascending: false });
        meals = { logged: mealRows?.length ?? 0, lastAt: mealRows?.[0]?.eaten_at ?? null };
      }

      // 健康相關（需 alerts 權限）
      let meds: { total: number; taken: number } | null = null;
      let bp: { systolic: number; diastolic: number; at: string } | null = null;
      let glucose: { value: number; at: string } | null = null;
      let alertsUnresolved = 0;
      let latestAlert: { title: string; severity: string; created_at: string } | null = null;
      let iot: { lastActivityAt: string | null; temp: number | null; recentCritical: boolean } | null = null;
      let shi: number | null = null;

      if (canHealth) {
        const medsArr = (profile?.medications ?? []) as Medication[];
        const reminder = medsArr.filter((m) => m?.reminder_enabled);
        if (reminder.length > 0) {
          meds = { total: reminder.length, taken: reminder.filter((m) => m.taken_today).length };
        }

        const { data: bpRows } = await admin
          .from("health_metrics")
          .select("systolic, diastolic, measured_at")
          .eq("user_id", elderId).eq("metric_type", "blood_pressure")
          .order("measured_at", { ascending: false }).limit(1);
        if (bpRows?.[0]?.systolic != null) {
          bp = { systolic: bpRows[0].systolic, diastolic: bpRows[0].diastolic, at: bpRows[0].measured_at };
        }

        const { data: bgRows } = await admin
          .from("health_metrics")
          .select("glucose_mg_dl, measured_at")
          .eq("user_id", elderId).eq("metric_type", "blood_glucose")
          .order("measured_at", { ascending: false }).limit(1);
        if (bgRows?.[0]?.glucose_mg_dl != null) {
          glucose = { value: bgRows[0].glucose_mg_dl, at: bgRows[0].measured_at };
        }

        const { data: alertRows } = await admin
          .from("alerts")
          .select("title, severity, created_at, resolved")
          .eq("elder_id", elderId)
          .order("created_at", { ascending: false }).limit(20);
        type AlertRow = { title: string; severity: string; created_at: string; resolved: boolean };
        const unresolved = ((alertRows ?? []) as AlertRow[]).filter((a) => !a.resolved);
        alertsUnresolved = unresolved.length;
        latestAlert = unresolved[0]
          ? { title: unresolved[0].title, severity: unresolved[0].severity, created_at: unresolved[0].created_at }
          : null;

        const { data: iotRows } = await admin
          .from("iot_events")
          .select("event_kind, severity, data, occurred_at")
          .eq("user_id", elderId)
          .order("occurred_at", { ascending: false }).limit(20);
        type IotRow = { event_kind: string; severity: string; data: { temp?: number } | null; occurred_at: string };
        const iotList = (iotRows ?? []) as IotRow[];
        if (iotList.length > 0) {
          const lastEnv = iotList.find((e) => e.event_kind === "environment");
          iot = {
            lastActivityAt: iotList[0].occurred_at,
            temp: lastEnv?.data?.temp ?? null,
            recentCritical: iotList.some((e) => e.severity === "critical" && e.occurred_at >= since24h),
          };
        }

        const { data: shiRows } = await admin
          .from("smart_assessments")
          .select("shi").eq("user_id", elderId)
          .order("created_at", { ascending: false }).limit(1);
        shi = shiRows?.[0]?.shi ?? null;
      }

      // 綜合狀態
      let overall: "normal" | "attention" | "alert" = "normal";
      if (alertsUnresolved > 0 || iot?.recentCritical) {
        overall = latestAlert?.severity === "critical" || iot?.recentCritical ? "alert" : "attention";
      } else if (canMeals && meals && meals.logged === 0) {
        overall = "attention"; // 今天還沒有任何飲食記錄
      }

      return {
        elder_id: elderId,
        name: elderName,
        relationship: link.relationship ?? "",
        permissions: perms,
        overall,
        meals,
        meds,
        bp,
        glucose,
        alerts_unresolved: alertsUnresolved,
        latest_alert: latestAlert,
        iot,
        shi,
      };
    })
  );

  return NextResponse.json({ elders });
}
