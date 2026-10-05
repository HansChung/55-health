// ────────────────────────────────────────────────
// 每天早上的天氣＋健康提醒（推播）：選好縣市就開，提醒通知裡可以關
// 這裡只放不需要網路的整理邏輯；發送在 /api/cron/daily-weather
// ────────────────────────────────────────────────

import { isTaiwanCounty, weatherAdvice, weatherEmoji, type ForecastPeriod, type TaiwanCounty } from "./weather";

/** 台灣時間幾點發（Vercel Cron 23:00 UTC；Hobby 方案會在這個小時內的某一刻觸發） */
export const DAILY_WEATHER_HOUR = 7;

/** notification_settings.daily_weather */
export interface DailyWeatherSetting {
  on: boolean;
  county: string | null;
}

/** 有開、縣市也對 → 回縣市；否則 null */
export function dailyWeatherCounty(settings: { daily_weather?: Partial<DailyWeatherSetting> | null } | null | undefined): TaiwanCounty | null {
  const dw = settings?.daily_weather;
  if (!dw || dw.on === false) return null;
  return isTaiwanCounty(dw.county) ? dw.county : null;
}

/** 首頁要不要問縣市：還沒設定過（按過「不用了」也算設定過） */
export function shouldOfferDailyWeather(settings: { daily_weather?: unknown } | null | undefined): boolean {
  return !settings?.daily_weather;
}

/** 台灣今天的日期（YYYY-MM-DD），當作「今天發過了沒」的記號 */
export function taipeiDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 白天（現在所在的時段）和接下來那一段（今晚） */
export function todayAndTonight(periods: ForecastPeriod[], now: Date = new Date()): { today: ForecastPeriod; tonight: ForecastPeriod | null } | null {
  if (periods.length === 0) return null;
  const t = now.getTime();
  let i = periods.findIndex((p) => new Date(p.start).getTime() <= t && t < new Date(p.end).getTime());
  if (i < 0) i = periods.findIndex((p) => new Date(p.start).getTime() > t);
  if (i < 0) return null;
  return { today: periods[i], tonight: periods[i + 1] ?? null };
}

/**
 * 慢性病：profiles.chronic_conditions 存的是英文 id（慢性病頁的 hypertension、diabetes…）；
 * 中文字也認（舊資料、其他地方寫進來的）
 */
const CONDITION_WORDS = {
  bloodPressure: ["hypertension", "血壓", "心臟"],
  diabetes: ["diabetes", "糖尿", "血糖"],
  kidney: ["kidney", "腎"],
} as const;

function has(conditions: string[], kind: keyof typeof CONDITION_WORDS): boolean {
  return conditions.some((c) => CONDITION_WORDS[kind].some((w) => c.toLowerCase().includes(w)));
}

/**
 * 跟天氣有關的健康提醒（只講一件，跟天氣那句不重複）：
 * 冷＋高血壓 > 早晚溫差大（早上涼） > 熱＋腎臟病（喝水照醫師交代） > 熱＋糖尿病 > 熱 > 冷 > 下雨在家動一動 > 天氣好去走走
 */
export function weatherHealthTip(today: ForecastPeriod, tonight: ForecastPeriod | null, conditions: string[] = []): string {
  const lows = [today.minT, tonight?.minT].filter((n): n is number => n != null);
  const low = lows.length ? Math.min(...lows) : null;
  const high = today.maxT;
  const rainy = (today.pop ?? 0) >= 50 || /雨/.test(today.wx);

  if (low != null && low <= 15 && has(conditions, "bloodPressure")) return "天冷血壓容易升高，起床慢慢來，早上記得量血壓";
  // 溫差大但早上不冷（熱天）不叫人帶外套
  if (low != null && high != null && high - low >= 8 && low <= 20) return "早晚溫差大，穿脫方便的外套，隨時加減衣服";
  // 腎臟病常要限水：熱天不叫他多喝水
  if (high != null && high >= 30 && has(conditions, "kidney")) return "天熱流汗多，喝水量照醫師交代的就好，出門找陰涼處";
  if (high != null && high >= 30 && has(conditions, "diabetes")) return "天熱多喝白開水，別用含糖飲料解渴";
  if (high != null && high >= 32) return "中午太陽大，少在 10 點到 2 點出門，小心中暑";
  if (high != null && high >= 30) return "出門帶瓶水，傍晚涼一點再去散步";
  if (low != null && low <= 12) return "冷天出門戴帽子、圍巾，頭頸保暖最要緊";
  // 下雨：天氣那句已經提醒帶傘、路滑 → 這裡講在家也能動
  if (rainy) return "雨天待在家，也可以原地踏步、伸展 10 分鐘";
  return "天氣不錯，飯後出去走走 10 分鐘吧";
}

/** 推播：「🌤️ 早安！臺北市今天多雲時晴」／「22～29 度，降雨 20%。有點熱，記得多喝水。早晚溫差大…」 */
export function buildDailyWeatherPush(opts: {
  county: TaiwanCounty;
  today: ForecastPeriod;
  tonight: ForecastPeriod | null;
  conditions?: string[];
}): { title: string; body: string } {
  const { county, today, tonight } = opts;
  const facts: string[] = [];
  if (today.minT != null && today.maxT != null) facts.push(`${today.minT}～${today.maxT} 度`);
  if (today.pop != null) facts.push(`降雨機率 ${today.pop}%`);
  const conditions = opts.conditions ?? [];
  let advice = weatherAdvice(today);
  // 腎臟病：天氣那句的「多喝水」拿掉（健康提醒會說照醫師交代的量）
  if (advice?.includes("多喝水") && has(conditions, "kidney")) advice = "天氣熱，戴帽子、擦防曬";
  const sentences = [facts.join("，"), advice, weatherHealthTip(today, tonight, conditions)].filter(Boolean);
  return {
    title: `${weatherEmoji(today.wx)} 早安！${county}今天${today.wx}`,
    body: sentences.join("。") + "。",
  };
}
