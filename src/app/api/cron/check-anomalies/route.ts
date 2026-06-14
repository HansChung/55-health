// ────────────────────────────────────────────────
// 異常預警 Cron：每天巡邏所有長輩，命中異常就通知家人
// 由 Vercel Cron 每天觸發（見 vercel.json）
// 也可手動 curl 測試（需帶 CRON_SECRET）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { detectAnomalies } from "@/lib/alerts/detect";
import { sendEmail } from "@/lib/email/send";
import { buildAlertEmail, type AlertPayload } from "@/lib/email/templates";

// 強制 dynamic，不要被靜態快取
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 秒（Vercel）

interface FamilyLinkRow {
  owner_id: string;
  family_user_id: string | null;
  family_name: string;
  permissions: Record<string, boolean> | null;
}

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h 內同類型不重發

export async function GET(req: NextRequest) {
  // 1. 驗證 cron secret（防止外人亂打這個端點）
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const fired: Array<{ elder: string; type: string; emails: number }> = [];
  let elderCount = 0;

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
  elderCount = elderMap.size;

  // 4. 對每位長輩跑偵測
  for (const [elderId, familyLinks] of elderMap) {
    // 取長輩 profile（名字 + 藥物）
    const { data: elderProfile } = await supabase
      .from("profiles")
      .select("display_name, medications")
      .eq("id", elderId)
      .single();

    const elderName = elderProfile?.display_name ?? "您的家人";

    let anomalies: AlertPayload[] = [];
    try {
      anomalies = await detectAnomalies(supabase, elderId, elderProfile ?? null);
    } catch (e) {
      console.error(`[cron] detect 失敗 elder=${elderId}:`, e);
      continue;
    }

    for (const alert of anomalies) {
      // 防重複：24h 內發過同 type 就跳過
      const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
      const { data: recent } = await supabase
        .from("alerts")
        .select("id")
        .eq("elder_id", elderId)
        .eq("alert_type", alert.type)
        .gte("created_at", since)
        .limit(1);
      if (recent && recent.length > 0) continue;

      // 寄信給每個家人，收集寄送結果
      const notified: Array<{ family_id: string; email: string; sent_at: string }> = [];
      for (const fl of familyLinks) {
        if (!fl.family_user_id) continue;
        const { data: famData } = await supabase.auth.admin.getUserById(fl.family_user_id);
        const famEmail = famData?.user?.email;
        if (!famEmail) continue;

        const result = await sendEmail({
          to: famEmail,
          subject: `【暖暖】${elderName} ${alert.title}`,
          html: buildAlertEmail({
            familyName: fl.family_name,
            elderName,
            alert,
          }),
        });

        if (result.ok) {
          notified.push({
            family_id: fl.family_user_id,
            email: famEmail,
            sent_at: new Date().toISOString(),
          });
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

      fired.push({ elder: elderId, type: alert.type, emails: notified.length });
    }
  }

  return NextResponse.json({
    ok: true,
    checked_elders: elderCount,
    alerts_fired: fired.length,
    detail: fired,
    ran_at: new Date().toISOString(),
  });
}
