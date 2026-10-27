// ────────────────────────────────────────────────
// 環境部開放資料：全台測站即時 AQI（aqx_p_432，每小時更新；只在伺服器用；需要 MOENV_API_KEY）
// 沒設金鑰、網路不通、格式不對都回空的：天氣推播照發，只是不帶空氣品質
// ────────────────────────────────────────────────

import { parseAqx, type CountyAir } from "./air-quality";
import type { TaiwanCounty } from "./weather";

/** MOENV_API_BASE 只給本機測試指向假的服務 */
function aqxUrl(): string {
  return `${(process.env.MOENV_API_BASE || "https://data.moenv.gov.tw").replace(/\/+$/, "")}/api/v2/aqx_p_432`;
}
const CACHE_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 6_000;

let cache: { at: number; data: Map<TaiwanCounty, CountyAir> } | null = null;

export function isAirQualityConfigured(): boolean {
  return Boolean(process.env.MOENV_API_KEY);
}

/** 全部縣市一次拿（約 80 個測站，一個請求）；30 分鐘內共用 */
export async function countiesAir(): Promise<Map<TaiwanCounty, CountyAir>> {
  const key = process.env.MOENV_API_KEY;
  if (!key) return new Map();
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  try {
    const url = `${aqxUrl()}?${new URLSearchParams({ api_key: key, format: "JSON", limit: "1000" })}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // 金鑰錯了會回 200＋一行文字（例如「api_key 不存在。」）→ JSON 解析失敗，當作查不到
    const data = parseAqx(JSON.parse(await res.text()));
    if (data.size === 0) throw new Error("no AQI records in response");
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.warn("[air] AQI fetch failed:", e instanceof Error ? e.message : e);
    return new Map();
  }
}
