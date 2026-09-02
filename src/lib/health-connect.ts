/**
 * Health Connect 封裝（階段 1：只讀今日步數，不寫資料庫）
 * 失敗一律回傳友善訊息，不丟例外到 UI。
 */
import { isNativeAndroid } from "@/lib/native-platform";

export type PhoneHealthResult =
  | {
      ok: true;
      steps: number;
      /** YYYY-MM-DD（台灣日） */
      dayKey: string;
      sourceNote: string;
    }
  | {
      ok: false;
      code:
        | "not_android"
        | "unavailable"
        | "denied"
        | "empty"
        | "error";
      message: string;
    };

/** 台灣時間（UTC+8）今天 00:00 → Date */
export function taiwanDayStart(now = new Date()): Date {
  const tw = new Date(now.getTime() + 8 * 3600 * 1000);
  const y = tw.getUTCFullYear();
  const m = tw.getUTCMonth();
  const d = tw.getUTCDate();
  // 台灣 00:00 = UTC 前一天 16:00
  return new Date(Date.UTC(y, m, d) - 8 * 3600 * 1000);
}

export function taiwanDayKey(now = new Date()): string {
  const tw = new Date(now.getTime() + 8 * 3600 * 1000);
  const y = tw.getUTCFullYear();
  const m = String(tw.getUTCMonth() + 1).padStart(2, "0");
  const d = String(tw.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function loadHealthPlugin() {
  const mod = await import("@capgo/capacitor-health");
  return mod.Health;
}

/**
 * 向 Health Connect 請求讀取步數，並查詢「台灣今日」總步數。
 * 僅應在 Android App 呼叫；網頁請先用 isNativeAndroid() 擋掉。
 */
export async function readTodaySteps(): Promise<PhoneHealthResult> {
  if (!isNativeAndroid()) {
    return {
      ok: false,
      code: "not_android",
      message: "同步手機健康只能在暖暖 Android App 使用，網頁版無法讀取。",
    };
  }

  try {
    const Health = await loadHealthPlugin();

    const availability = await Health.isAvailable();
    if (!availability.available) {
      return {
        ok: false,
        code: "unavailable",
        message:
          availability.reason?.includes("install") || availability.reason?.includes("Install")
            ? "這支手機還沒安裝「Health Connect」。請到 Play 商店搜尋 Health Connect 安裝後再試。"
            : "目前無法使用手機健康資料。" +
              (availability.reason ? `（${availability.reason}）` : "請確認已安裝 Health Connect。"),
      };
    }

    const auth = await Health.requestAuthorization({
      read: ["steps"],
      write: [],
    });

    if (!auth.readAuthorized.includes("steps")) {
      return {
        ok: false,
        code: "denied",
        message:
          "還沒允許讀取步數。請在彈出的畫面勾選「步數／Steps」，或到系統設定 → Health Connect → 暖暖 開啟權限。",
      };
    }

    const start = taiwanDayStart();
    const end = new Date();
    const dayKey = taiwanDayKey();

    const { samples } = await Health.queryAggregated({
      dataType: "steps",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      bucket: "day",
      aggregation: "sum",
    });

    const todaySample =
      samples.find((s) => {
        const key = taiwanDayKey(new Date(s.startDate));
        return key === dayKey;
      }) ?? samples[samples.length - 1];

    const steps = Math.round(todaySample?.value ?? 0);

    if (!todaySample && samples.length === 0) {
      return {
        ok: false,
        code: "empty",
        message:
          "讀取成功，但今天還沒有步數資料。請確認 Google Fit 或其他運動 App 有把資料同步到 Health Connect，並先走幾步再試。",
      };
    }

    return {
      ok: true,
      steps,
      dayKey,
      sourceNote: "來自手機 Health Connect（尚未寫入暖暖資料庫）",
    };
  } catch (e) {
    console.error("[health-connect]", e);
    return {
      ok: false,
      code: "error",
      message: "讀取時出了點狀況，請稍後再試。不影響暖暖其他功能。",
    };
  }
}

/** 開啟系統 Health Connect 設定（方便使用者改權限） */
export async function openPhoneHealthSettings(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const Health = await loadHealthPlugin();
    await Health.openHealthConnectSettings();
    return true;
  } catch (e) {
    console.error("[health-connect] open settings", e);
    return false;
  }
}
