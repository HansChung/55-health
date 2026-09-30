// ────────────────────────────────────────────────
// 中央氣象署開放資料：縣市 36 小時預報（只在伺服器用；需要 CWA_API_KEY）
// 沒設金鑰、網路不通、格式不對都回 null：行前提醒照發，只是不帶天氣
// ────────────────────────────────────────────────

import { guessCounty, isTaiwanCounty, parseCwa36h, periodAt, type ForecastPeriod, type TaiwanCounty } from "./weather";

/** CWA_API_BASE 只給本機測試指向假的氣象服務 */
function cwa36hUrl(): string {
  return `${(process.env.CWA_API_BASE || "https://opendata.cwa.gov.tw").replace(/\/+$/, "")}/api/v1/rest/datastore/F-C0032-001`;
}
const CACHE_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 6_000;

const cache = new Map<TaiwanCounty, { at: number; periods: ForecastPeriod[] }>();

export function isWeatherConfigured(): boolean {
  return Boolean(process.env.CWA_API_KEY);
}

/** 一個縣市的 36 小時預報（同一個縣市 30 分鐘內共用） */
export async function countyForecast(county: TaiwanCounty): Promise<ForecastPeriod[] | null> {
  const key = process.env.CWA_API_KEY;
  if (!key) return null;
  const hit = cache.get(county);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.periods;
  try {
    const url = `${cwa36hUrl()}?${new URLSearchParams({ Authorization: key, locationName: county, format: "JSON" })}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const periods = parseCwa36h(await res.json(), county);
    if (periods.length === 0) throw new Error("no forecast periods in response");
    cache.set(county, { at: Date.now(), periods });
    return periods;
  } catch (e) {
    console.warn(`[weather] ${county} forecast failed:`, e instanceof Error ? e.message : e);
    return null;
  }
}

/** 研學團要看哪個縣市：後台有選就用，沒有就從集合地點、活動名稱猜 */
export function tourCounty(tour: { weather_county?: string | null; meeting_point: string; title: string }): TaiwanCounty | null {
  return isTaiwanCounty(tour.weather_county) ? tour.weather_county : guessCounty(tour.meeting_point, tour.title);
}

/** 活動開始那個時段的預報（超過 36 小時或查不到就 null） */
export async function tourForecast(tour: {
  weather_county?: string | null;
  meeting_point: string;
  title: string;
  starts_at: string;
}): Promise<{ county: TaiwanCounty; period: ForecastPeriod } | null> {
  const county = tourCounty(tour);
  if (!county) return null;
  const periods = await countyForecast(county);
  const period = periods ? periodAt(periods, tour.starts_at) : null;
  return period ? { county, period } : null;
}
