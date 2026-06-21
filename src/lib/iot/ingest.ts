// ────────────────────────────────────────────────
// IoT 事件接收 → 儲存 → （重要事件）觸發警報 + 通知家人
// 模擬器與未來的 LifeSmart webhook 都呼叫這個函式
// 用 service-role client（繞過 RLS，跨長輩讀家人 + 寄信）
// ────────────────────────────────────────────────
import { sendEmail } from "@/lib/email/send";
import { buildAlertEmail } from "@/lib/email/templates";
import type { EventKind, Severity } from "./types";

interface IngestInput {
  userId: string; // 長輩
  deviceId?: string | null;
  eventKind: EventKind;
  data?: Record<string, unknown>;
  source?: string;
}

// 事件 → 警報對應（只有需要通知家人的才有）
function mapToAlert(
  eventKind: EventKind,
  data: Record<string, unknown>
): { severity: Severity; title: string; message: string } | null {
  switch (eventKind) {
    case "fall":
      return {
        severity: "critical",
        title: "偵測到跌倒",
        message: "感測器偵測到疑似跌倒，請立即聯繫或前往查看長輩狀況。",
      };
    case "sos":
      return {
        severity: "critical",
        title: "緊急求助",
        message: "長輩按下了緊急求助鈕，請立即聯繫確認狀況。",
      };
    case "leave_bed": {
      const mins = Number(data?.duration_min ?? 0);
      return {
        severity: "warning",
        title: "夜間離床過久",
        message: `感測到長輩夜間離床已超過 ${mins || 30} 分鐘仍未回床，建議關心是否身體不適。`,
      };
    }
    case "environment": {
      const temp = Number(data?.temp);
      if (!Number.isNaN(temp) && temp >= 30) {
        return {
          severity: "warning",
          title: "室內溫度過高",
          message: `室內目前 ${temp}°C 偏熱，長輩可能不自覺，建議提醒開冷氣或補充水分，留意中暑。`,
        };
      }
      if (!Number.isNaN(temp) && temp <= 12) {
        return {
          severity: "warning",
          title: "室內溫度過低",
          message: `室內目前 ${temp}°C 偏冷，建議提醒長輩保暖。`,
        };
      }
      return null; // 正常環境讀數不通知
    }
    default:
      return null; // activity / in_bed 只記錄、不通知
  }
}

// supabase admin client（避免引入完整型別，用 any）
type Admin = ReturnType<typeof import("@/lib/supabase/server").createSupabaseAdmin>;

export async function ingestIoTEvent(supabase: Admin, input: IngestInput) {
  const data = input.data ?? {};
  const alertSpec = mapToAlert(input.eventKind, data);
  const severity: Severity = alertSpec?.severity ?? "info";

  // 1. 寫入事件
  const { data: eventRow } = await supabase
    .from("iot_events")
    .insert({
      user_id: input.userId,
      device_id: input.deviceId ?? null,
      event_kind: input.eventKind,
      severity,
      data,
      source: input.source ?? "mock",
    })
    .select()
    .single();

  // 2. 更新裝置最後狀態
  if (input.deviceId) {
    await supabase
      .from("iot_devices")
      .update({ last_state: data, last_event_at: new Date().toISOString() })
      .eq("id", input.deviceId);
  }

  // 3. 非警報事件就到此為止
  if (!alertSpec) return { event: eventRow, alerted: false };

  // 4. 警報事件 → 寫 alerts 表 + 通知家人（複用既有管線）
  const { data: elderProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", input.userId)
    .single();
  const elderName = elderProfile?.display_name ?? "您的家人";

  const { data: links } = await supabase
    .from("family_links")
    .select("family_user_id, family_name, permissions")
    .eq("owner_id", input.userId)
    .eq("status", "accepted");

  const notified: Array<{ family_id: string; email: string; sent_at: string }> = [];
  for (const fl of links ?? []) {
    if (!fl.family_user_id) continue;
    if (!(fl.permissions as { alerts?: boolean } | null)?.alerts) continue;
    const { data: famData } = await supabase.auth.admin.getUserById(fl.family_user_id);
    const famEmail = famData?.user?.email;
    if (!famEmail) continue;

    const res = await sendEmail({
      to: famEmail,
      subject: `【暖暖】${elderName} ${alertSpec.title}`,
      html: buildAlertEmail({
        familyName: fl.family_name,
        elderName,
        alert: { type: input.eventKind, severity: alertSpec.severity, title: alertSpec.title, message: alertSpec.message },
      }),
    });
    if (res.ok) {
      notified.push({ family_id: fl.family_user_id, email: famEmail, sent_at: new Date().toISOString() });
    }
  }

  await supabase.from("alerts").insert({
    elder_id: input.userId,
    alert_type: input.eventKind,
    severity: alertSpec.severity,
    title: alertSpec.title,
    message: alertSpec.message,
    metadata: data,
    notified_family: notified,
  });

  return { event: eventRow, alerted: true, notified: notified.length };
}
