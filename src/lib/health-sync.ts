/**
 * 健康平台同步（共用層）— Apple HealthKit（iPhone）＋ Google Health Connect（Android）
 *
 * 用同一份程式碼接兩個平台，透過 capacitor-health 外掛只「讀取」資料：
 *   - 運動 / 訓練（workouts）→ 寫進現有 exercises 表
 *   - 今日步數（steps）→ 即時顯示用
 *
 * 只在原生 App（Capacitor）裡有效；Web/PWA 會回報「不支援」並安全跳過。
 */

import { Capacitor } from "@capacitor/core";
import { Health, type HealthPermission, type Workout } from "capacitor-health";
import { api } from "./api-client";

/** 這個功能只在原生 App 內可用（Web 沒有 HealthKit / Health Connect） */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** 平台是否提供健康 API（Android 需安裝 Health Connect app；iOS 為 HealthKit） */
export async function isHealthAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { available } = await Health.isHealthAvailable();
    return available;
  } catch {
    return false;
  }
}

// Phase 1 只讀「運動 + 步數 + 卡路里」，不寫入、不碰路線/心率細節
const READ_PERMISSIONS: HealthPermission[] = [
  "READ_WORKOUTS",
  "READ_STEPS",
  "READ_ACTIVE_CALORIES",
];

/** 向使用者請求讀取權限。回傳是否（至少運動）取得授權 */
export async function requestHealthPermissions(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await Health.requestHealthPermissions({ permissions: READ_PERMISSIONS });
    // iOS 無法可靠回報個別權限狀態，外掛會假設已授權；Android 會回實際結果。
    // 這裡不擋，後續實際查詢若無資料/被拒會自然得到空陣列。
    return true;
  } catch (e) {
    console.error("[health] 請求權限失敗:", e);
    return false;
  }
}

const DAY_MS = 86_400_000;

/** 把健康平台的運動類型代碼／英文，盡量轉成長輩看得懂的中文 */
function workoutLabel(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("walk")) return "走路";
  if (t.includes("run")) return "跑步";
  if (t.includes("hik")) return "健行";
  if (t.includes("bik") || t.includes("cycl")) return "騎車";
  if (t.includes("swim")) return "游泳";
  if (t.includes("yoga")) return "瑜伽";
  if (t.includes("strength") || t.includes("weight")) return "重訓";
  if (t.includes("dance")) return "跳舞";
  if (t.includes("tai")) return "太極";
  return "運動";
}

/** 一筆運動的去重 ID：優先用平台給的 id，否則用來源＋開始時間組合 */
function workoutExternalId(w: Workout): string {
  if (w.id) return w.id;
  return `${w.sourceBundleId || w.sourceName || "health"}:${w.startDate}`;
}

export interface SyncResult {
  imported: number;   // 這次實際新增的運動筆數
  duplicates: number; // 已存在被略過的筆數
  total: number;      // 平台讀到的總筆數
}

/**
 * 同步最近 N 天的運動到 exercises 表。
 * 重複的運動（同 external_id）由後端 upsert 自動略過，可安全重複呼叫。
 */
export async function syncWorkouts(days = 7): Promise<SyncResult> {
  if (!isNativeApp()) return { imported: 0, duplicates: 0, total: 0 };

  const end = new Date();
  const start = new Date(end.getTime() - days * DAY_MS);

  const { workouts } = await Health.queryWorkouts({
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    includeHeartRate: false,
    includeRoute: false,
    includeSteps: false,
  });

  let imported = 0;
  let duplicates = 0;

  for (const w of workouts) {
    // 用起訖時間算分鐘，避開不同平台 duration 單位差異
    const minutes = Math.max(1, Math.round((new Date(w.endDate).getTime() - new Date(w.startDate).getTime()) / 60_000));
    try {
      const res = await api.createExercise({
        exercise_type: workoutLabel(w.workoutType),
        minutes,
        kcal_burned: Math.round(w.calories || 0),
        performed_at: w.startDate,
        source: "health",
        external_id: workoutExternalId(w),
      });
      // 後端回 duplicate=true 表示這筆已存在
      if ((res as { duplicate?: boolean }).duplicate) duplicates++;
      else imported++;
    } catch (e) {
      console.error("[health] 匯入運動失敗:", e);
    }
  }

  return { imported, duplicates, total: workouts.length };
}

/** 讀今日步數（即時顯示用，不寫入 DB）。讀不到時回 null */
export async function getTodaySteps(): Promise<number | null> {
  if (!isNativeApp()) return null;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  try {
    const { aggregatedData } = await Health.queryAggregated({
      startDate: startOfDay.toISOString(),
      endDate: new Date().toISOString(),
      dataType: "steps",
      bucket: "day",
    });
    if (!aggregatedData.length) return 0;
    return Math.round(aggregatedData.reduce((s, a) => s + (a.value || 0), 0));
  } catch (e) {
    console.error("[health] 讀步數失敗:", e);
    return null;
  }
}
