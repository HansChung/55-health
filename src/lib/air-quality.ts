// ────────────────────────────────────────────────
// 空氣品質（環境部 aqx_p_432 測站即時 AQI；前後端共用的整理邏輯，抓資料在 air-quality-server.ts）
// 每天早上的天氣推播：空氣不好（AQI 超過 100）就加一句，並拿掉「出去走走」那種建議
// 長輩本來就算「敏感族群」：AQI 101 起就提醒戴口罩、少激烈運動
// ────────────────────────────────────────────────

import { isTaiwanCounty, type TaiwanCounty } from "./weather";

export interface CountyAir {
  county: TaiwanCounty;
  /** 縣市內有數字的測站平均（四捨五入） */
  aqi: number;
  /** 最差的那一站 */
  worst: { site: string; aqi: number };
  stations: number;
  /** 主要污染物（最差那一站的，例如 細懸浮微粒、臭氧） */
  pollutant: string | null;
  publishedAt: string | null;
}

export type AirLevel = "good" | "moderate" | "sensitive" | "unhealthy" | "very_unhealthy" | "hazardous";

/** 環境部 AQI 分級 */
export function airLevel(aqi: number): AirLevel {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very_unhealthy";
  return "hazardous";
}

export const AIR_LEVEL_LABEL: Record<AirLevel, string> = {
  good: "良好",
  moderate: "普通",
  sensitive: "對敏感族群不健康",
  unhealthy: "對所有族群不健康",
  very_unhealthy: "非常不健康",
  hazardous: "危害",
};

/** 數字欄位：環境部給的是字串，空的、"-"、"ND" 都當沒有 */
function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || !v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeCounty(v: unknown): TaiwanCounty | null {
  if (typeof v !== "string") return null;
  const c = v.trim().replace(/^台/, "臺");
  return isTaiwanCounty(c) ? c : null;
}

/**
 * 解析 aqx_p_432：{ records: [...] }（有時候整包就是陣列）→ 每個縣市一筆。
 * 測站維修、沒數字的不算；一個縣市都沒數字就不放
 */
export function parseAqx(json: unknown): Map<TaiwanCounty, CountyAir> {
  const records = Array.isArray(json) ? json : Array.isArray((json as { records?: unknown })?.records) ? (json as { records: unknown[] }).records : [];
  const byCounty = new Map<TaiwanCounty, { site: string; aqi: number; pollutant: string | null; published: string | null }[]>();
  for (const r of records as Record<string, unknown>[]) {
    const county = normalizeCounty(r?.county);
    const aqi = num(r?.aqi);
    if (!county || aqi === null || aqi < 0) continue;
    const list = byCounty.get(county) ?? [];
    list.push({
      site: typeof r.sitename === "string" ? r.sitename : "",
      aqi,
      pollutant: typeof r.pollutant === "string" && r.pollutant.trim() ? r.pollutant.trim() : null,
      published: typeof r.publishtime === "string" ? r.publishtime : null,
    });
    byCounty.set(county, list);
  }
  const out = new Map<TaiwanCounty, CountyAir>();
  for (const [county, list] of byCounty) {
    const worst = list.reduce((a, b) => (b.aqi > a.aqi ? b : a));
    out.set(county, {
      county,
      aqi: Math.round(list.reduce((n, s) => n + s.aqi, 0) / list.length),
      worst: { site: worst.site, aqi: worst.aqi },
      stations: list.length,
      pollutant: worst.pollutant,
      publishedAt: list.map((s) => s.published).filter(Boolean).sort().at(-1) ?? null,
    });
  }
  return out;
}

const LUNG_HEART_WORDS = ["asthma", "copd", "氣喘", "哮喘", "肺", "心臟", "心血管", "冠狀動脈"];

export function hasLungOrHeart(conditions: string[]): boolean {
  return conditions.some((c) => LUNG_HEART_WORDS.some((w) => c.toLowerCase().includes(w)));
}

/** 推播用的一句；空氣還可以（AQI ≤ 100）就不說 */
export function airQualityTip(air: Pick<CountyAir, "aqi">, conditions: string[] = []): string | null {
  const level = airLevel(air.aqi);
  const extra = hasLungOrHeart(conditions) ? "，氣喘、心臟病的藥隨身帶" : "";
  switch (level) {
    case "good":
    case "moderate":
      return null;
    case "sensitive":
      return `空氣品質不太好（AQI ${air.aqi}），出門戴口罩，今天別做激烈運動${extra}`;
    case "unhealthy":
      return `空氣不好（AQI ${air.aqi}），盡量待在室內、關窗，出門一定戴口罩${extra}`;
    default:
      return `空氣非常差（AQI ${air.aqi}），請待在室內關好門窗；胸悶、喘不過氣要就醫${extra}`;
  }
}

/** 空氣不好時標題加一點提示 */
export function airTitleSuffix(air: Pick<CountyAir, "aqi"> | null | undefined): string {
  if (!air) return "";
  const level = airLevel(air.aqi);
  if (level === "good" || level === "moderate") return "";
  return level === "sensitive" ? "，空氣不太好" : "，空氣不好😷";
}
