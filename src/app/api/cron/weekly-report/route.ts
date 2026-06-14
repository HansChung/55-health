// ────────────────────────────────────────────────
// 每週健康報告 Cron：每週寄報告給長輩本人與被授權家人
// 由 Vercel Cron 觸發（見 vercel.json），需帶 CRON_SECRET
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { computeWeeklyReport } from "@/lib/reports/weekly";
import { sendEmail } from "@/lib/email/send";
import { buildWeeklyReportEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface FamilyLinkRow {
  owner_id: string;
  family_user_id: string | null;
  family_name: string;
  permissions: Record<string, boolean> | null;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const sent: Array<{ elder: string; emails: number }> = [];

  // 過去 7 天有任何餐點記錄的用戶才寄（避免對沒在用的人發信）
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data: activeMeals, error: mealsErr } = await supabase
    .from("meals")
    .select("user_id")
    .gte("eaten_at", since.toISOString());

  if (mealsErr) {
    console.error("[cron] weekly-report 讀取活躍用戶失敗:", mealsErr);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }

  const mealRows = (activeMeals ?? []) as Array<{ user_id: string }>;
  const activeUserIds = Array.from(new Set(mealRows.map((m) => m.user_id)));

  for (const elderId of activeUserIds) {
    const report = await computeWeeklyReport(supabase, elderId);
    if (!report) continue;

    const { data: elderProfile } = await supabase
      .from("profiles")
      .select("display_name, notification_settings")
      .eq("id", elderId)
      .single();
    const elderName = elderProfile?.display_name ?? "您";

    let emailCount = 0;

    // 1. 寄給長輩本人（若未關閉週報通知）
    const wantsWeekly =
      (elderProfile?.notification_settings as { weekly_report?: boolean } | null)?.weekly_report !== false;
    if (wantsWeekly) {
      const { data: elderUser } = await supabase.auth.admin.getUserById(elderId);
      const elderEmail = elderUser?.user?.email;
      if (elderEmail) {
        const res = await sendEmail({
          to: elderEmail,
          subject: "【暖暖】您的每週健康報告",
          html: buildWeeklyReportEmail({
            recipientName: elderName,
            elderName,
            forFamily: false,
            report,
          }),
        });
        if (res.ok) emailCount++;
      }
    }

    // 2. 寄給被授權（accepted + diary 權限）的家人
    const { data: links } = await supabase
      .from("family_links")
      .select("owner_id, family_user_id, family_name, permissions")
      .eq("owner_id", elderId)
      .eq("status", "accepted");

    for (const link of (links ?? []) as FamilyLinkRow[]) {
      if (!link.family_user_id) continue;
      if (!link.permissions?.diary && !link.permissions?.alerts) continue;
      const { data: famUser } = await supabase.auth.admin.getUserById(link.family_user_id);
      const famEmail = famUser?.user?.email;
      if (!famEmail) continue;
      const res = await sendEmail({
        to: famEmail,
        subject: `【暖暖】${elderName} 的每週健康報告`,
        html: buildWeeklyReportEmail({
          recipientName: link.family_name,
          elderName,
          forFamily: true,
          report,
        }),
      });
      if (res.ok) emailCount++;
    }

    if (emailCount > 0) sent.push({ elder: elderId, emails: emailCount });
  }

  return NextResponse.json({
    ok: true,
    users_checked: activeUserIds.length,
    reports_sent: sent.length,
    ran_at: new Date().toISOString(),
  });
}
