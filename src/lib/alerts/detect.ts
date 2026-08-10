// ────────────────────────────────────────────────
// 異常偵測規則引擎
// 純函式邏輯，方便單獨測試
// ────────────────────────────────────────────────
import type { AlertPayload } from "@/lib/email/templates";
import {
  DEFAULT_ALERT_THRESHOLDS,
  resolveAlertThresholds,
  type AlertThresholdOverrides,
} from "@/lib/alerts/thresholds";

// 用 any 表示 supabase admin client（避免引入完整型別）
type SupabaseAdmin = {
  from: (table: string) => any;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** @deprecated 請改用 DEFAULT_ALERT_THRESHOLDS；保留匯出以相容舊引用 */
export const THRESHOLDS = DEFAULT_ALERT_THRESHOLDS;

interface ProfileLite {
  display_name?: string | null;
  chronic_conditions?: string[] | null;
  alert_thresholds?: AlertThresholdOverrides | null;
  medications?: Array<{
    name?: string;
    reminder_enabled?: boolean;
    taken_today?: boolean;
    last_taken_at?: string;
  }> | null;
}

/**
 * 對單一長輩跑所有偵測規則，回傳命中的警報陣列
 */
export async function detectAnomalies(
  supabase: SupabaseAdmin,
  elderId: string,
  profile: ProfileLite | null
): Promise<AlertPayload[]> {
  const alerts: AlertPayload[] = [];
  const now = Date.now();
  const T = resolveAlertThresholds(profile);

  // ── 規則 1：失聯（N 天沒任何記錄）──
  const inactiveSince = new Date(now - T.inactivityDays * DAY_MS).toISOString();
  const [meals, metricsRecent, convs, exercises] = await Promise.all([
    supabase.from("meals").select("id").eq("user_id", elderId).gte("eaten_at", inactiveSince).limit(1),
    supabase.from("health_metrics").select("id").eq("user_id", elderId).gte("measured_at", inactiveSince).limit(1),
    supabase.from("conversations").select("id").eq("user_id", elderId).gte("created_at", inactiveSince).limit(1),
    supabase.from("exercises").select("id").eq("user_id", elderId).gte("performed_at", inactiveSince).limit(1),
  ]);
  const activityCount =
    (meals.data?.length ?? 0) +
    (metricsRecent.data?.length ?? 0) +
    (convs.data?.length ?? 0) +
    (exercises.data?.length ?? 0);
  if (activityCount === 0) {
    alerts.push({
      type: "inactivity",
      severity: "warning",
      title: `已 ${T.inactivityDays} 天沒有使用暖暖`,
      message: `您的家人已經連續 ${T.inactivityDays} 天沒有記錄飲食、量測健康數據或使用語音。建議主動打通電話關心一下他的狀況。`,
      metadata: { days: T.inactivityDays },
    });
  }

  // ── 規則 2：血壓異常（最近一筆）──
  const { data: bp } = await supabase
    .from("health_metrics")
    .select("systolic, diastolic, measured_at")
    .eq("user_id", elderId)
    .eq("metric_type", "blood_pressure")
    .order("measured_at", { ascending: false })
    .limit(1);
  if (bp?.[0]) {
    const { systolic, diastolic } = bp[0];
    if (systolic != null && diastolic != null) {
      if (systolic >= T.bpSystolicHigh || diastolic >= T.bpDiastolicHigh) {
        alerts.push({
          type: "blood_pressure",
          severity: "critical",
          title: "血壓偏高",
          message: `最近一次量測血壓為 ${systolic}/${diastolic} mmHg，已超過警戒值（${T.bpSystolicHigh}/${T.bpDiastolicHigh}）。若持續偏高，建議盡快回診或聯繫醫師。`,
          metadata: { systolic, diastolic, thresholds: { hi: T.bpSystolicHigh, dia: T.bpDiastolicHigh } },
        });
      } else if (systolic <= T.bpSystolicLow || diastolic <= T.bpDiastolicLow) {
        alerts.push({
          type: "blood_pressure",
          severity: "warning",
          title: "血壓偏低",
          message: `最近一次量測血壓為 ${systolic}/${diastolic} mmHg 偏低，請留意是否有頭暈、無力或站起來眼前發黑的情形。`,
          metadata: { systolic, diastolic },
        });
      }
    }
  }

  // ── 規則 3：血糖異常（最近一筆）──
  const { data: bg } = await supabase
    .from("health_metrics")
    .select("glucose_mg_dl, glucose_context, measured_at")
    .eq("user_id", elderId)
    .eq("metric_type", "blood_glucose")
    .order("measured_at", { ascending: false })
    .limit(1);
  if (bg?.[0]?.glucose_mg_dl != null) {
    const g = bg[0].glucose_mg_dl as number;
    const isFasting = bg[0].glucose_context === "fasting";
    const highLimit = isFasting ? T.glucoseFastingHigh : T.glucoseHigh;
    if (g >= highLimit) {
      alerts.push({
        type: "blood_glucose",
        severity: "critical",
        title: "血糖偏高",
        message: `最近一次血糖為 ${g} mg/dL${isFasting ? "（空腹）" : ""}，已超過警戒值（${highLimit}）。建議留意飲食並諮詢醫師。`,
        metadata: { glucose: g, fasting: isFasting, highLimit },
      });
    } else if (g <= T.glucoseLow) {
      alerts.push({
        type: "blood_glucose",
        severity: "critical",
        title: "血糖偏低",
        message: `最近一次血糖為 ${g} mg/dL 偏低，低血糖有立即風險。請確認家人是否有發抖、冒冷汗、意識不清的情形，必要時補充糖分並就醫。`,
        metadata: { glucose: g },
      });
    }
  }

  // ── 規則 4：體重驟變（7 天內）──
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString();
  const { data: weights } = await supabase
    .from("health_metrics")
    .select("weight_kg, measured_at")
    .eq("user_id", elderId)
    .eq("metric_type", "weight")
    .gte("measured_at", weekAgo)
    .order("measured_at", { ascending: false });
  if (weights && weights.length >= 2) {
    const valid = weights.filter((w: any) => w.weight_kg != null);
    if (valid.length >= 2) {
      const latest = valid[0].weight_kg as number;
      const oldest = valid[valid.length - 1].weight_kg as number;
      const diff = latest - oldest;
      if (Math.abs(diff) >= T.weightChangeKg) {
        const dir = diff > 0 ? "增加" : "減少";
        alerts.push({
          type: "weight_change",
          severity: "warning",
          title: `體重 7 天內${dir} ${Math.abs(diff).toFixed(1)} 公斤`,
          message: `您的家人最近 7 天體重從 ${oldest} 公斤變為 ${latest} 公斤（${dir} ${Math.abs(diff).toFixed(1)} 公斤）。短期體重明顯變化建議留意飲食、水分或健康狀況。`,
          metadata: { from: oldest, to: latest, diff: Number(diff.toFixed(1)) },
        });
      }
    }
  }

  // ── 規則 5：連續漏吃藥 ──
  const meds = profile?.medications ?? [];
  const reminderMeds = meds.filter((m) => m?.reminder_enabled);
  if (reminderMeds.length > 0) {
    const cutoff = now - T.missedMedicationDays * DAY_MS;
    const missed = reminderMeds.filter((m) => {
      if (!m.last_taken_at) return true;
      return new Date(m.last_taken_at).getTime() < cutoff;
    });
    if (missed.length > 0) {
      const names = missed.map((m) => m.name).filter(Boolean).join("、");
      alerts.push({
        type: "missed_medication",
        severity: "warning",
        title: "可能連續漏吃藥",
        message: `您的家人已超過 ${T.missedMedicationDays} 天沒有記錄服用：${names || "部分藥物"}。建議提醒他按時服藥。`,
        metadata: { medications: names, days: T.missedMedicationDays },
      });
    }
  }

  return alerts;
}
