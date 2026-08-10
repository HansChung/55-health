/** 異常預警閾值：系統預設 + 慢性病建議 + 個人覆寫 */

export type AlertThresholds = {
  inactivityDays: number;
  bpSystolicHigh: number;
  bpDiastolicHigh: number;
  bpSystolicLow: number;
  bpDiastolicLow: number;
  glucoseHigh: number;
  glucoseFastingHigh: number;
  glucoseLow: number;
  weightChangeKg: number;
  missedMedicationDays: number;
};

/** 第一版偏保守：寧可漏報不要狂報 */
export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  inactivityDays: 3,
  bpSystolicHigh: 160,
  bpDiastolicHigh: 100,
  bpSystolicLow: 90,
  bpDiastolicLow: 60,
  glucoseHigh: 250,
  glucoseFastingHigh: 180,
  glucoseLow: 70,
  weightChangeKg: 2.5,
  missedMedicationDays: 2,
};

export type AlertThresholdOverrides = Partial<AlertThresholds>;

/** 依慢性病給建議覆寫（仍偏保守，減少誤報） */
export function chronicSuggestedThresholds(
  chronicConditions: string[] | null | undefined
): AlertThresholdOverrides {
  const set = new Set(chronicConditions ?? []);
  const out: AlertThresholdOverrides = {};

  if (set.has("diabetes") || set.has("prediabetes")) {
    // 糖尿病族群日常血糖較高；警戒線略放寬，避免天天警報
    out.glucoseFastingHigh = 200;
    out.glucoseHigh = 280;
  }
  if (set.has("hypertension")) {
    // 高血壓需較早留意，略收緊
    out.bpSystolicHigh = 150;
    out.bpDiastolicHigh = 95;
  }
  return out;
}

function pickNumber(
  overrides: AlertThresholdOverrides | null | undefined,
  key: keyof AlertThresholds
): number | undefined {
  const v = overrides?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * 合併：系統預設 ← 慢性病建議 ← 個人覆寫
 */
export function resolveAlertThresholds(input?: {
  chronic_conditions?: string[] | null;
  alert_thresholds?: AlertThresholdOverrides | null;
} | null): AlertThresholds {
  const chronic = chronicSuggestedThresholds(input?.chronic_conditions);
  const custom = input?.alert_thresholds ?? {};
  const keys = Object.keys(DEFAULT_ALERT_THRESHOLDS) as (keyof AlertThresholds)[];
  const result = { ...DEFAULT_ALERT_THRESHOLDS };
  for (const key of keys) {
    result[key] =
      pickNumber(custom, key) ??
      pickNumber(chronic, key) ??
      DEFAULT_ALERT_THRESHOLDS[key];
  }
  return result;
}
