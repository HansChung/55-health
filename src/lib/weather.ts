// ────────────────────────────────────────────────
// 天氣（中央氣象署 F-C0032-001「今明 36 小時天氣預報」，以縣市為單位）：
// 研學團出發前的提醒、活動頁的天氣卡片。這裡只放不需要網路的整理邏輯
// ────────────────────────────────────────────────

/** 中央氣象署用的縣市名稱（一律「臺」） */
export const TAIWAN_COUNTIES = [
  "臺北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "苗栗縣", "臺中市",
  "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣",
  "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣",
] as const;
export type TaiwanCounty = (typeof TAIWAN_COUNTIES)[number];

export function isTaiwanCounty(v: unknown): v is TaiwanCounty {
  return typeof v === "string" && (TAIWAN_COUNTIES as readonly string[]).includes(v);
}

/** 簡稱 → 縣市（長的先比，「新竹縣」不會被當成「新竹」） */
const COUNTY_ALIASES: [string, TaiwanCounty][] = [
  ...TAIWAN_COUNTIES.map((c) => [c, c] as [string, TaiwanCounty]),
  // 「新北投」在臺北市，要排在「新北」前面比對（依長度排序）
  ["新北投", "臺北市"], ["北投", "臺北市"], ["陽明山", "臺北市"], ["淡水", "新北市"], ["九份", "新北市"],
  ["臺北", "臺北市"], ["新北", "新北市"], ["基隆", "基隆市"], ["桃園", "桃園市"],
  ["竹北", "新竹縣"], ["新竹", "新竹市"], ["苗栗", "苗栗縣"], ["臺中", "臺中市"],
  ["彰化", "彰化縣"], ["鹿港", "彰化縣"], ["南投", "南投縣"], ["日月潭", "南投縣"],
  ["雲林", "雲林縣"], ["嘉義", "嘉義市"], ["阿里山", "嘉義縣"], ["臺南", "臺南市"],
  ["高雄", "高雄市"], ["屏東", "屏東縣"], ["墾丁", "屏東縣"], ["宜蘭", "宜蘭縣"],
  ["花蓮", "花蓮縣"], ["太魯閣", "花蓮縣"], ["臺東", "臺東縣"], ["澎湖", "澎湖縣"],
  ["金門", "金門縣"], ["馬祖", "連江縣"],
];
COUNTY_ALIASES.sort((a, b) => b[0].length - a[0].length);

/** 從集合地點、活動名稱猜縣市（台／臺 都認得）；猜不出來回 null */
export function guessCounty(...texts: (string | null | undefined)[]): TaiwanCounty | null {
  for (const raw of texts) {
    const text = (raw ?? "").replace(/台/g, "臺");
    if (!text) continue;
    for (const [alias, county] of COUNTY_ALIASES) {
      if (text.includes(alias)) return county;
    }
  }
  return null;
}

export interface ForecastPeriod {
  /** ISO 時間（台灣時間換算過） */
  start: string;
  end: string;
  /** 天氣現象，例如「多雲時晴」 */
  wx: string;
  /** 降雨機率 % */
  pop: number | null;
  minT: number | null;
  maxT: number | null;
  /** 舒適度，例如「舒適至悶熱」 */
  comfort: string | null;
}

type Json = Record<string, unknown>;

/** 氣象署的時間沒有時區（"2026-10-01 06:00:00"）＝台灣時間 */
function taipeiIso(t: unknown): string | null {
  if (typeof t !== "string" || !t) return null;
  const s = /[zZ]|[+-]\d{2}:?\d{2}$/.test(t) ? t : `${t.replace(" ", "T")}+08:00`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** 大小寫兩種欄位名都收（氣象署部分資料集改過欄位名稱的大小寫） */
function pick(o: unknown, ...keys: string[]): unknown {
  if (!o || typeof o !== "object") return undefined;
  for (const k of keys) if (k in (o as Json)) return (o as Json)[k];
  return undefined;
}

/** 解析 F-C0032-001：取出指定縣市的 3 個 12 小時時段；格式不對就回空陣列 */
export function parseCwa36h(json: unknown, county: string): ForecastPeriod[] {
  const records = pick(json, "records", "Records");
  const locations = pick(records, "location", "Location", "locations", "Locations");
  if (!Array.isArray(locations)) return [];
  const loc = locations.find((l) => pick(l, "locationName", "LocationName") === county);
  const elements = pick(loc, "weatherElement", "WeatherElement");
  if (!Array.isArray(elements)) return [];

  const byName = new Map<string, unknown[]>();
  for (const el of elements) {
    const name = pick(el, "elementName", "ElementName");
    const times = pick(el, "time", "Time");
    if (typeof name === "string" && Array.isArray(times)) byName.set(name, times);
  }
  const wxTimes = byName.get("Wx") ?? [];
  const valueAt = (name: string, i: number) => {
    const t = (byName.get(name) ?? [])[i];
    return pick(pick(t, "parameter", "Parameter"), "parameterName", "ParameterName");
  };

  const periods: ForecastPeriod[] = [];
  wxTimes.forEach((t, i) => {
    const start = taipeiIso(pick(t, "startTime", "StartTime"));
    const end = taipeiIso(pick(t, "endTime", "EndTime"));
    const wx = valueAt("Wx", i);
    if (!start || !end || typeof wx !== "string") return;
    const comfort = valueAt("CI", i);
    periods.push({
      start,
      end,
      wx,
      pop: num(valueAt("PoP", i)),
      minT: num(valueAt("MinT", i)),
      maxT: num(valueAt("MaxT", i)),
      comfort: typeof comfort === "string" ? comfort : null,
    });
  });
  return periods;
}

/** 涵蓋某個時間點的時段（活動開始那一刻） */
export function periodAt(periods: ForecastPeriod[], at: Date | string): ForecastPeriod | null {
  const t = new Date(at).getTime();
  return periods.find((p) => new Date(p.start).getTime() <= t && t < new Date(p.end).getTime()) ?? null;
}

export function weatherEmoji(wx: string): string {
  if (/雷/.test(wx)) return "⛈️";
  if (/雨/.test(wx)) return "🌧️";
  if (/晴/.test(wx) && /雲/.test(wx)) return "🌤️";
  if (/晴/.test(wx)) return "☀️";
  if (/陰/.test(wx)) return "☁️";
  return "⛅";
}

/** 「多雲時晴，降雨機率 20%，22～29 度」 */
export function weatherSummary(p: ForecastPeriod): string {
  const parts = [p.wx];
  if (p.pop != null) parts.push(`降雨機率 ${p.pop}%`);
  if (p.minT != null && p.maxT != null) parts.push(`${p.minT}～${p.maxT} 度`);
  return parts.join("，");
}

/** 給長輩的一句提醒：下雨 > 很熱 > 很冷，只講最重要的一件 */
export function weatherAdvice(p: ForecastPeriod): string | null {
  if ((p.pop ?? 0) >= 50 || /雨/.test(p.wx)) return "記得帶傘或輕便雨衣，走路小心地滑";
  if ((p.pop ?? 0) >= 30) return "可能會下雨，帶把傘比較安心";
  if ((p.maxT ?? 0) >= 32) return "天氣很熱，多喝水、戴帽子、擦防曬";
  if ((p.maxT ?? 0) >= 30) return "有點熱，記得多喝水";
  if (p.minT != null && p.minT <= 12) return "天氣冷，穿暖一點、帶件外套";
  if (p.minT != null && p.minT <= 16) return "早晚涼，帶件薄外套";
  return null;
}

/** 行前提醒推播的天氣那一句 */
export function weatherReminderText(p: ForecastPeriod): string {
  const advice = weatherAdvice(p);
  return `${weatherEmoji(p.wx)} ${weatherSummary(p)}${advice ? `，${advice}` : ""}`;
}

/** 活動頁的天氣卡片 */
export interface TourWeather {
  county: TaiwanCounty;
  emoji: string;
  summary: string;
  advice: string | null;
}

export function toTourWeather(county: TaiwanCounty, p: ForecastPeriod): TourWeather {
  return { county, emoji: weatherEmoji(p.wx), summary: weatherSummary(p), advice: weatherAdvice(p) };
}
