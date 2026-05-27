import type { HealthMetric, MealRecord, ProfileMedication } from "./api-client";
import { getPendingMedicationReminders, isSameLocalDay } from "./medication-utils";

export interface HealthAlert {
  level: "info" | "warning";
  title: string;
  message: string;
}

export function generateHealthAlerts(input: {
  meals: MealRecord[];
  metrics: HealthMetric[];
  medications: ProfileMedication[];
  now?: Date;
}): HealthAlert[] {
  const now = input.now ?? new Date();
  const todayMeals = input.meals.filter((meal) => isSameLocalDay(new Date(meal.eaten_at), now));
  const pendingMeds = getPendingMedicationReminders(input.medications, now);
  const latestBloodPressure = input.metrics.find((m) => m.metric_type === "blood_pressure");
  const latestBloodGlucose = input.metrics.find((m) => m.metric_type === "blood_glucose");
  const alerts: HealthAlert[] = [];

  if (latestBloodPressure?.systolic && latestBloodPressure?.diastolic) {
    if (latestBloodPressure.systolic >= 140 || latestBloodPressure.diastolic >= 90) {
      alerts.push({
        level: "warning",
        title: "血壓偏高",
        message: "今天飲食可以清淡一點，也記得按時量血壓。",
      });
    }
  }

  if (latestBloodGlucose?.glucose_mg_dl && latestBloodGlucose.glucose_mg_dl >= 180) {
    alerts.push({
      level: "warning",
      title: "血糖偏高",
      message: "點心先避開含糖飲料，下一餐醣類份量可以少一點。",
    });
  }

  if (pendingMeds.length > 0) {
    alerts.push({
      level: "warning",
      title: "還有藥物未確認",
      message: `今天還有 ${pendingMeds.length} 個用藥提醒未完成。`,
    });
  }

  if (todayMeals.length === 0 && now.getHours() >= 10) {
    alerts.push({
      level: "info",
      title: "今天還沒記錄餐點",
      message: "可以先從早餐或午餐開始，拍照記錄最快。",
    });
  }

  if (input.metrics.length === 0) {
    alerts.push({
      level: "info",
      title: "健康數值還不多",
      message: "有空可以補一筆體重、血壓或血糖，報告會更準。",
    });
  }

  return alerts.slice(0, 3);
}
