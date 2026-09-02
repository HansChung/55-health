// ────────────────────────────────────────────────
// 異常預警 Cron：每天巡邏所有長輩，命中異常就通知家人（Email + Web Push）
// 由 Vercel Cron 每天觸發（見 vercel.json）
// 也可手動 curl 測試（需帶 CRON_SECRET）
//
// 效能設計（使用者變多後仍要跑得完）：
//   1. 共用資料一次撈完（profiles、家人 email、24h 內已發警報）→ 不在迴圈裡逐筆查
//   2. 長輩之間以受限併發處理，而非一位一位排隊
//   3. 設時間預算，接近平台上限就主動收尾並「如實回報」還有幾位沒巡到
//      （寧可明確回報未完成，也不要靜默漏掉長輩）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { detectAnomalies } from "@/lib/alerts/detect";
import { sendEmail } from "@/lib/email/send";
import { buildAlertEmail, type AlertPayload } from "@/lib/email/templates";
import { sendPushToUser } from "@/lib/push/send";
import { mapWithConcurrency, createDeadline } from "@/lib/concurrency";

// 強制 dynamic，不要被靜態快取
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 秒（Vercel）

interface FamilyLinkRow {
  owner_id: string;
  family_user_id: string | null;
  family_name: string;
  permissions: Record<string, boolean> | null;
}

interface NotifiedEntry {
  family_id: string;
  email?: string;
  push?: number;
  sent_at: string;
}

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h 內同類型不重發
const ELDER_CONCURRENCY = 6; // 同時處理幾位長輩（兼顧速度與 DB 負載）
const TIME_BUDGET_MS = 45_000; // 留 15 秒緩衝給收尾與回應

export async function GET(req: NextRequest) {
  // 1. 驗證 cron secret（防止外人亂打這個端點）
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const deadline = createDeadline(TIME_BUDGET_MS);
  const fired: Array<{ elder: string; type: string; emails: number; pushes: number }> = [];

  // 2. 撈出所有 accepted 的家人連結
  const { data: links, error: linksError } = await supabase
    .from("family_links")
    .select("owner_id, family_user_id, family_name, permissions")
    .eq("status", "accepted");

  if (linksError) {
    console.error("[cron] 讀取 family_links 失敗:", linksError);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }

  // 3. 以長輩(owner_id)分組，只留有開 alerts 權限的家人
  const elderMap = new Map<string, FamilyLinkRow[]>();
  for (const link of (links ?? []) as FamilyLinkRow[]) {
    if (!link.family_user_id) continue;
    if (!link.permissions?.alerts) continue;
    if (!elderMap.has(link.owner_id)) elderMap.set(link.owner_id, []);
    elderMap.get(link.owner_id)!.push(link);
  }
  const elderIds = Array.from(elderMap.keys());
  if (elderIds.length === 0) {
    return NextResponse.json({
      ok: true, checked_elders: 0, alerts_fired: 0, detail: [], ran_at: new Date().toISOString(),
    });
  }

  const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nuan55.com";

  // 4. 共用資料一次撈完（取代「每位長輩各查一次」）
  const [profilesRes, recentAlertsRes, emailMap] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, medications, chronic_conditions, alert_thresholds")
      .in("id", elderIds),
    supabase
      .from("alerts")
      .select("elder_id, alert_type")
      .in("elder_id", elderIds)
      .gte("created_at", since),
    loadFamilyEmails(supabase),
  ]);

  const profileById = new Map<string, Record<string, unknown>>();
  for (const p of (profilesRes.data ?? []) as { id: string }[]) {
    profileById.set(p.id, p as unknown as Record<string, unknown>);
  }

  // 24h 內已發過的「長輩+類型」組合 → 用來防重複
  const alreadySent = new Set<string>();
  for (const a of (recentAlertsRes.data ?? []) as { elder_id: string; alert_type: string }[]) {
    alreadySent.add(`${a.elder_id}|${a.alert_type}`);
  }

  // 5. 併發處理每位長輩
  let skippedForTime = 0;
  await mapWithConcurrency(elderIds, ELDER_CONCURRENCY, async (elderId) => {
    if (deadline.expired) {
      skippedForTime++;
      return;
    }

    const familyLinks = elderMap.get(elderId) ?? [];
    const elderProfile = profileById.get(elderId) ?? null;
    const elderName = (elderProfile?.display_name as string) ?? "您的家人";

    let anomalies: AlertPayload[] = [];
    try {
      anomalies = await detectAnomalies(supabase, elderId, elderProfile as never);
    } catch (e) {
      console.error(`[cron] detect 失敗 elder=${elderId}:`, e);
      return;
    }

    for (const alert of anomalies) {
      // 防重複：24h 內發過同類型就跳過（用預先撈好的集合，不再逐筆查 DB）
      const key = `${elderId}|${alert.type}`;
      if (alreadySent.has(key)) continue;
      alreadySent.add(key); // 同一輪內也不重複

      // 寄信 + Web Push 給每位有授權的家人（email 由預先建好的 map 取得）
      const notified: NotifiedEntry[] = [];
      let pushTotal = 0;

      for (const fl of familyLinks) {
        if (!fl.family_user_id) continue;
        const famEmail = emailMap.get(fl.family_user_id);
        const entry: NotifiedEntry = {
          family_id: fl.family_user_id,
          sent_at: new Date().toISOString(),
        };

        if (famEmail) {
          const result = await sendEmail({
            to: famEmail,
            subject: `【暖暖】${elderName} ${alert.title}`,
            html: buildAlertEmail({ familyName: fl.family_name, elderName, alert }),
          });
          if (result.ok) entry.email = famEmail;
        }

        try {
          const pushResult = await sendPushToUser(fl.family_user_id, {
            title: `【暖暖】${elderName}`,
            body: alert.title,
            url: `${appUrl}/`,
            tag: `alert-${alert.type}`,
          });
          entry.push = pushResult.sent;
          pushTotal += pushResult.sent;
        } catch (e) {
          console.warn("[cron] push 失敗:", e);
        }

        if (entry.email || (entry.push && entry.push > 0)) {
          notified.push(entry);
        }
      }

      // 寫入 alerts 表（記錄 + 之後防重複的依據）
      await supabase.from("alerts").insert({
        elder_id: elderId,
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        metadata: alert.metadata ?? {},
        notified_family: notified,
      });

      fired.push({
        elder: elderId,
        type: alert.type,
        emails: notified.filter((n) => n.email).length,
        pushes: pushTotal,
      });
    }
  });

  if (skippedForTime > 0) {
    console.error(`[cron] 時間不足，有 ${skippedForTime} 位長輩本輪未巡查（總數 ${elderIds.length}）`);
  }

  return NextResponse.json({
    ok: true,
    checked_elders: elderIds.length - skippedForTime,
    total_elders: elderIds.length,
    skipped_for_time: skippedForTime,
    alerts_fired: fired.length,
    detail: fired,
    took_ms: deadline.elapsedMs,
    ran_at: new Date().toISOString(),
  });
}

/** 一次載入所有使用者的 email（取代迴圈內逐筆 getUserById） */
async function loadFamilyEmails(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    for (let page = 1; page <= 10; page++) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      const users = data?.users ?? [];
      for (const u of users) {
        if (u.email) map.set(u.id, u.email);
      }
      if (users.length < 1000) break;
    }
  } catch (e) {
    console.error("[cron] 載入使用者 email 失敗:", e);
  }
  return map;
}
