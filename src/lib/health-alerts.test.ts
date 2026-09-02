import { describe, it, expect } from "vitest";
import { generateHealthAlerts } from "./health-alerts";
import type { HealthMetric, MealRecord, ProfileMedication } from "./api-client";

/** 固定一個「今天下午 3 點」的基準時間，避免測試隨執行時段變動 */
const NOW = (() => {
  const d = new Date();
  d.setHours(15, 0, 0, 0);
  return d;
})();

const atHourToday = (h: number) => {
  const d = new Date(NOW);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const meal = (hour = 8): MealRecord =>
  ({ id: "m1", user_id: "u1", meal_type: "breakfast", eaten_at: atHourToday(hour), items: [], total_cal: 300 } as unknown as MealRecord);

const bp = (systolic: number, diastolic: number): HealthMetric =>
  ({ id: "bp1", metric_type: "blood_pressure", systolic, diastolic, measured_at: atHourToday(7) } as unknown as HealthMetric);

const glucose = (v: number): HealthMetric =>
  ({ id: "bg1", metric_type: "blood_glucose", glucose_mg_dl: v, measured_at: atHourToday(7) } as unknown as HealthMetric);

const weight = (): HealthMetric =>
  ({ id: "w1", metric_type: "weight", weight_kg: 60, measured_at: atHourToday(7) } as unknown as HealthMetric);

/** 已服藥的提醒藥物（不應產生待辦提醒） */
const medTaken = (): ProfileMedication =>
  ({ name: "阿斯匹靈", reminder_enabled: true, reminder_times: ["08:00"], taken_today: true, last_taken_at: atHourToday(8) } as unknown as ProfileMedication);

const gen = (over: Partial<Parameters<typeof generateHealthAlerts>[0]> = {}) =>
  generateHealthAlerts({ meals: [meal()], metrics: [weight()], medications: [], now: NOW, ...over });

const ids = (alerts: { id: string }[]) => alerts.map((a) => a.id);

describe("generateHealthAlerts", () => {
  it("一切正常（有記錄餐點、有健康數值、無待辦用藥）→ 無提醒", () => {
    expect(gen()).toEqual([]);
  });

  describe("血壓", () => {
    it("收縮壓 >= 140 → 提醒", () => {
      const a = gen({ metrics: [bp(150, 85)] }).find((x) => x.id === "blood_pressure_high");
      expect(a?.level).toBe("warning");
    });

    it("舒張壓 >= 90 也要抓到", () => {
      expect(ids(gen({ metrics: [bp(130, 95)] }))).toContain("blood_pressure_high");
    });

    it("正常血壓不提醒", () => {
      expect(ids(gen({ metrics: [bp(120, 78)] }))).not.toContain("blood_pressure_high");
    });

    it("只取最新一筆判斷（陣列第一筆）", () => {
      // 最新是正常值，舊的偏高 → 不應提醒
      expect(ids(gen({ metrics: [bp(118, 75), bp(180, 110)] })))
        .not.toContain("blood_pressure_high");
    });
  });

  describe("血糖", () => {
    it("血糖 >= 180 → 提醒", () => {
      expect(ids(gen({ metrics: [glucose(200)] }))).toContain("blood_glucose_high");
    });

    it("正常血糖不提醒", () => {
      expect(ids(gen({ metrics: [glucose(100)] }))).not.toContain("blood_glucose_high");
    });
  });

  describe("用藥", () => {
    it("已服用的藥不產生待辦提醒", () => {
      expect(ids(gen({ medications: [medTaken()] }))).not.toContain("medication_pending");
    });
  });

  describe("今日尚未記錄餐點", () => {
    it("過了早上 10 點還沒記錄 → info 提醒", () => {
      const a = gen({ meals: [] }).find((x) => x.id === "meal_missing");
      expect(a?.level).toBe("info");
    });

    it("清晨還沒記錄不催（長輩可能還沒吃早餐）", () => {
      const early = new Date(NOW);
      early.setHours(7, 0, 0, 0);
      expect(ids(gen({ meals: [], now: early }))).not.toContain("meal_missing");
    });

    it("昨天的餐點不算今天已記錄", () => {
      const yesterday = new Date(NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      const old = { ...meal(), eaten_at: yesterday.toISOString() } as MealRecord;
      expect(ids(gen({ meals: [old] }))).toContain("meal_missing");
    });
  });

  describe("健康數值", () => {
    it("完全沒有健康數值 → 鼓勵補一筆", () => {
      const a = gen({ metrics: [] }).find((x) => x.id === "metric_missing");
      expect(a?.level).toBe("info");
    });

    it("已有健康數值就不再提示", () => {
      expect(ids(gen({ metrics: [weight()] }))).not.toContain("metric_missing");
    });
  });

  it("多個問題同時存在時全部回報", () => {
    const alerts = gen({ meals: [], metrics: [bp(160, 100)] });
    expect(ids(alerts)).toContain("blood_pressure_high");
    expect(ids(alerts)).toContain("meal_missing");
  });
});
