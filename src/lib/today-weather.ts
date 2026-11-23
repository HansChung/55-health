// ────────────────────────────────────────────────
// 今天天氣（功能 → 出門運動）：出門前看一眼——幾度、會不會下雨、適不適合出門、穿什麼、空氣好不好
// 資料跟每天早上的推播同一份（氣象署 36 小時預報＋環境部即時 AQI）；這裡只放不需要網路的整理邏輯
// ────────────────────────────────────────────────

import { airLevel, airQualityTip, type AirLevel, type CountyAir } from "./air-quality";
import { weatherAdviceFor, weatherHealthTip } from "./daily-weather";
import { weatherEmoji, type ForecastPeriod, type TaiwanCounty } from "./weather";

const HOUR = 3600 * 1000;
const TAIPEI = 8 * HOUR;

/** 台灣時間的「第幾天」和「幾點」 */
function taipeiParts(t: number): { day: number; hour: number } {
  const local = t + TAIPEI;
  return { day: Math.floor(local / (24 * HOUR)), hour: Math.floor((local % (24 * HOUR)) / HOUR) };
}

function isDaytime(p: ForecastPeriod): boolean {
  const { hour } = taipeiParts(new Date(p.start).getTime());
  return hour >= 6 && hour < 18;
}

function covers(p: ForecastPeriod, now: number): boolean {
  return new Date(p.start).getTime() <= now && now < new Date(p.end).getTime();
}

/** 還沒過完的時段（照時間排） */
export function upcomingPeriods(periods: ForecastPeriod[], now: Date = new Date()): ForecastPeriod[] {
  const t = now.getTime();
  return periods
    .filter((p) => new Date(p.end).getTime() > t)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** 「今天」「明天」「後天」：這個時段開始那天（已經開始的算今天） */
export function periodDayWord(p: ForecastPeriod, now: Date = new Date()): string {
  const start = Math.max(new Date(p.start).getTime(), now.getTime());
  const diff = taipeiParts(start).day - taipeiParts(now.getTime()).day;
  return diff <= 0 ? "今天" : diff === 1 ? "明天" : "後天";
}

/** 「今天白天」「今天晚上」「半夜到清晨」「明天白天」… */
export function periodLabel(p: ForecastPeriod, now: Date = new Date()): string {
  const day = periodDayWord(p, now);
  if (isDaytime(p)) return `${day}白天`;
  // 晚上那一段跨過半夜：過了 12 點還在同一段，就不叫「今天晚上」
  if (covers(p, now.getTime()) && taipeiParts(now.getTime()).hour < 6) return "半夜到清晨";
  return `${day}晚上`;
}

export type OutingLevel = "good" | "care" | "stay";

export interface OutingVerdict {
  level: OutingLevel;
  /** 「今天適合出門走走」 */
  title: string;
  /** 要注意的事（最重要的排前面）；適合出門時是空的 */
  reasons: string[];
}

/**
 * 適不適合出門：空氣 > 雨 > 熱 > 冷，每一類只講一句。
 * air 只在「現在」那個時段給（即時 AQI 不能拿來說明天）
 */
export function outingVerdict(p: ForecastPeriod, air: Pick<CountyAir, "aqi"> | null, dayWord = "今天"): OutingVerdict {
  const care: string[] = [];
  const stay: string[] = [];
  const pop = p.pop ?? 0;

  if (air && air.aqi > 150) stay.push("😷 空氣不好，待在室內、關好窗戶");
  else if (air && air.aqi > 100) care.push("😷 空氣不太好，出門戴口罩");

  if (/雷/.test(p.wx) && pop >= 70) stay.push("⛈️ 會打雷下大雨，先別出門");
  else if (/雷/.test(p.wx)) care.push("⛈️ 可能打雷下雨，聽到雷聲就進屋裡");
  else if (pop >= 70) care.push("☔ 很可能下雨，帶傘、穿防滑的鞋");
  else if (pop >= 30 || /雨/.test(p.wx)) care.push("🌂 可能下雨，帶把傘比較安心");

  if (p.maxT != null && p.maxT >= 36) stay.push("🥵 非常熱，白天別出門，小心中暑");
  else if (p.maxT != null && p.maxT >= 32) care.push("☀️ 中午很熱，早上或傍晚再出門");

  if (p.minT != null && p.minT <= 8) stay.push("🥶 非常冷，沒事別出門，在家也要保暖");
  else if (p.minT != null && p.minT <= 12) care.push("🧣 天氣冷，穿暖了再出門");

  if (stay.length) return { level: "stay", title: `${dayWord}盡量待在家`, reasons: [...stay, ...care] };
  if (care.length) return { level: "care", title: `${dayWord}出門要注意`, reasons: care };
  return { level: "good", title: `${dayWord}適合出門走走`, reasons: [] };
}

export interface ClothingAdvice {
  emoji: string;
  text: string;
}

/** 穿什麼：看這一段的最高、最低溫（長輩怕冷，寧可多帶一件） */
export function clothingAdvice(p: Pick<ForecastPeriod, "minT" | "maxT">): ClothingAdvice | null {
  const high = p.maxT ?? p.minT;
  const low = p.minT ?? p.maxT;
  if (high == null || low == null) return null;
  if (high >= 28 && low >= 24) return { emoji: "👕", text: "短袖就可以，出門戴帽子遮太陽" };
  if (high >= 28) return { emoji: "👕", text: "白天穿短袖，早晚加一件薄外套" };
  if (high >= 23 && low >= 20) return { emoji: "👕", text: "薄長袖，或短袖加一件薄外套" };
  if (high >= 23) return { emoji: "🧥", text: "穿長袖，帶一件外套，早晚會涼" };
  if (high >= 18) return { emoji: "🧥", text: "長袖加外套，怕冷再多一件背心" };
  if (high >= 13) return { emoji: "🧥", text: "毛衣加厚外套，脖子圍起來" };
  return { emoji: "🧣", text: "厚外套、圍巾、帽子、手套都穿上" };
}

export interface WeatherSlot {
  label: string;
  emoji: string;
  wx: string;
  pop: number | null;
  minT: number | null;
  maxT: number | null;
  /** 這一段的一句提醒（帶傘、多喝水…） */
  advice: string | null;
}

/** 空氣好不好，用長輩聽得懂的說法（環境部的正式名稱是「對敏感族群不健康」那種） */
export const AIR_PLAIN_LABEL: Record<AirLevel, string> = {
  good: "很好",
  moderate: "普通",
  sensitive: "不太好",
  unhealthy: "不好",
  very_unhealthy: "很不好",
  hazardous: "非常差",
};

export interface AirView {
  aqi: number;
  level: AirLevel;
  label: string;
  /** 一句話：空氣好也給一句 */
  tip: string;
  /** 最差的那一站（跟平均差很多時才有） */
  worst: { site: string; aqi: number } | null;
}

export interface TodayWeather {
  county: TaiwanCounty;
  /** 最上面那一大張：現在這個時段 */
  now: WeatherSlot;
  /** 接下來的時段 */
  later: WeatherSlot[];
  /** 「適不適合出門」說的是哪一段（現在是晚上就說明天白天） */
  outing: OutingVerdict & { label: string };
  clothing: ClothingAdvice | null;
  healthTip: string;
  air: AirView | null;
  /** 「念給我聽」的句子 */
  speech: string[];
}

function toSlot(p: ForecastPeriod, now: Date, conditions: string[]): WeatherSlot {
  return {
    label: periodLabel(p, now),
    emoji: weatherEmoji(p.wx),
    wx: p.wx,
    pop: p.pop,
    minT: p.minT,
    maxT: p.maxT,
    advice: weatherAdviceFor(p, conditions),
  };
}

export function toAirView(air: CountyAir, conditions: string[] = []): AirView {
  const level = airLevel(air.aqi);
  const tip =
    airQualityTip(air, conditions) ??
    (level === "good" ? "空氣很好，可以開窗、出門走走" : "空氣普通，一般活動沒問題");
  return {
    aqi: air.aqi,
    level,
    label: AIR_PLAIN_LABEL[level],
    tip,
    worst: air.worst.site && air.worst.aqi - air.aqi >= 20 ? air.worst : null,
  };
}

/** 「22～29 度」；只有一個數字就講那一個 */
export function tempText(p: Pick<ForecastPeriod, "minT" | "maxT">): string | null {
  if (p.minT != null && p.maxT != null) return p.minT === p.maxT ? `${p.minT} 度` : `${p.minT}～${p.maxT} 度`;
  const one = p.minT ?? p.maxT;
  return one != null ? `${one} 度` : null;
}

/** 整頁要的東西；預報都過期了（或沒有）回 null */
export function buildTodayWeather(opts: {
  county: TaiwanCounty;
  periods: ForecastPeriod[];
  air?: CountyAir | null;
  conditions?: string[];
  now?: Date;
}): TodayWeather | null {
  const now = opts.now ?? new Date();
  const conditions = opts.conditions ?? [];
  const upcoming = upcomingPeriods(opts.periods, now);
  if (upcoming.length === 0) return null;

  const [first, ...rest] = upcoming;
  // 出門建議看「下一個白天」：現在是白天就看現在，晚上打開就看明天白天
  const focusIndex = Math.max(0, upcoming.findIndex(isDaytime));
  const focus = upcoming[focusIndex];
  const focusIsNow = covers(focus, now.getTime());
  const air = opts.air ? toAirView(opts.air, conditions) : null;
  const airForFocus = focusIsNow ? opts.air ?? null : null;

  const verdict = outingVerdict(focus, airForFocus, periodDayWord(focus, now));
  // 空氣不好（那一句在空氣那張卡片）：健康提醒不能叫人出去走走、去散步
  const airTip = airForFocus ? airQualityTip(airForFocus, conditions) : null;
  let healthTip = weatherHealthTip(focus, upcoming[focusIndex + 1] ?? null, conditions);
  if (airTip && /出去走走|去散步/.test(healthTip)) healthTip = "今天在家動一動：原地踏步、伸展 10 分鐘";
  const clothing = clothingAdvice(focus);
  const nowSlot = toSlot(first, now, conditions);

  const speech = [
    `${opts.county}${nowSlot.label}${nowSlot.wx}`,
    tempText(first),
    first.pop != null ? `降雨機率百分之 ${first.pop}` : null,
    verdict.title,
    // 念的時候不念圖示
    ...verdict.reasons.map((r) => r.replace(/^\S+\s/, "")),
    clothing ? `穿衣服：${clothing.text}` : null,
    healthTip,
    air ? airTip ?? `現在空氣${air.label}` : null,
  ].filter((s): s is string => Boolean(s));

  return {
    county: opts.county,
    now: nowSlot,
    later: rest.map((p) => toSlot(p, now, conditions)),
    outing: { ...verdict, label: periodLabel(focus, now) },
    clothing,
    healthTip,
    air,
    speech,
  };
}
