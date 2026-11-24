// ────────────────────────────────────────────────
// 農曆對照表（2024～2100 年），給生日提醒算「農曆生日今年是國曆哪一天」
// 為什麼不用 Intl 的 chinese 曆法：ICU 自己用天文公式算，朔的時間剛好在半夜附近的月份會差一天
// （Node 24：2027 年春節算成 2/7、2030 年算成 2/2，正確是 2/6、2/3），整個正月的生日都會晚一天或早一天。
// 這張表是 2026-11 用 lunar-javascript 1.7.8 一次產生的（跟 ICU 逐日比對，77 年只差上面那種月份共 3 個月），
// 執行時不需要那個套件。
// 每一年：[春節的國曆「月-日」, 閏幾月（0＝沒有）, 各月大小（第 i 個月是大月 30 天 → 第 i 個 bit 是 1；閏月也算一個月，照順序排）]
// ────────────────────────────────────────────────

const TABLE: Record<number, [string, number, number]> = {
  2024: ["02-10", 0, 0x06d2],
  2025: ["01-29", 6, 0x0ea5],
  2026: ["02-17", 0, 0x0725],
  2027: ["02-06", 0, 0x064b],
  2028: ["01-26", 5, 0x0c97],
  2029: ["02-13", 0, 0x0cab],
  2030: ["02-03", 0, 0x055a],
  2031: ["01-23", 3, 0x0ad6],
  2032: ["02-11", 0, 0x0b69],
  2033: ["01-31", 11, 0x1752],
  2034: ["02-19", 0, 0x0b52],
  2035: ["02-08", 0, 0x0b25],
  2036: ["01-28", 6, 0x1a4b],
  2037: ["02-15", 0, 0x0a4b],
  2038: ["02-04", 0, 0x04ab],
  2039: ["01-24", 5, 0x055b],
  2040: ["02-12", 0, 0x05ad],
  2041: ["02-01", 0, 0x0b6a],
  2042: ["01-22", 2, 0x1b52],
  2043: ["02-10", 0, 0x0d92],
  2044: ["01-30", 7, 0x1d25],
  2045: ["02-17", 0, 0x0d25],
  2046: ["02-06", 0, 0x0a55],
  2047: ["01-26", 5, 0x14ad],
  2048: ["02-14", 0, 0x04b6],
  2049: ["02-02", 0, 0x05b5],
  2050: ["01-23", 3, 0x0daa],
  2051: ["02-11", 0, 0x0ec9],
  2052: ["02-01", 8, 0x1e92],
  2053: ["02-19", 0, 0x0e92],
  2054: ["02-08", 0, 0x0d26],
  2055: ["01-28", 6, 0x0a56],
  2056: ["02-15", 0, 0x0a57],
  2057: ["02-04", 0, 0x04d6],
  2058: ["01-24", 4, 0x06d5],
  2059: ["02-12", 0, 0x0755],
  2060: ["02-02", 0, 0x0749],
  2061: ["01-21", 3, 0x0e93],
  2062: ["02-09", 0, 0x0693],
  2063: ["01-29", 7, 0x152b],
  2064: ["02-17", 0, 0x052b],
  2065: ["02-05", 0, 0x0a5b],
  2066: ["01-26", 5, 0x155a],
  2067: ["02-14", 0, 0x056a],
  2068: ["02-03", 0, 0x0b65],
  2069: ["01-23", 4, 0x174a],
  2070: ["02-11", 0, 0x0b4a],
  2071: ["01-31", 8, 0x1a95],
  2072: ["02-19", 0, 0x0a95],
  2073: ["02-07", 0, 0x052d],
  2074: ["01-27", 6, 0x0aad],
  2075: ["02-15", 0, 0x0ab5],
  2076: ["02-05", 0, 0x05aa],
  2077: ["01-24", 4, 0x0ba5],
  2078: ["02-12", 0, 0x0da5],
  2079: ["02-02", 0, 0x0d4a],
  2080: ["01-22", 3, 0x1c95],
  2081: ["02-09", 0, 0x0c96],
  2082: ["01-29", 7, 0x194e],
  2083: ["02-17", 0, 0x0556],
  2084: ["02-06", 0, 0x0ab5],
  2085: ["01-26", 5, 0x15b2],
  2086: ["02-14", 0, 0x06d2],
  2087: ["02-03", 0, 0x0ea5],
  2088: ["01-24", 4, 0x0e4a],
  2089: ["02-10", 0, 0x068b],
  2090: ["01-30", 8, 0x0c97],
  2091: ["02-18", 0, 0x04ab],
  2092: ["02-07", 0, 0x055b],
  2093: ["01-27", 6, 0x0ad6],
  2094: ["02-15", 0, 0x0b6a],
  2095: ["02-05", 0, 0x0752],
  2096: ["01-25", 4, 0x1725],
  2097: ["02-12", 0, 0x0b45],
  2098: ["02-01", 0, 0x0a8b],
  2099: ["01-21", 2, 0x149b],
  2100: ["02-09", 0, 0x04ab],
};

export const LUNAR_FIRST_YEAR = 2024;
export const LUNAR_LAST_YEAR = 2100;

export interface LunarDay {
  /** 農曆年（用春節那一年的西元年表示） */
  year: number;
  month: number;
  day: number;
  /** 閏月 */
  leap: boolean;
  /** 這個月有幾天（29 或 30） */
  monthDays: number;
}

interface LunarMonth {
  month: number;
  leap: boolean;
  days: number;
}

const DAY_MS = 86400_000;

function parseDay(date: string): number {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
}

function newYearMs(year: number): number | null {
  const row = TABLE[year];
  return row ? Date.parse(`${year}-${row[0]}T00:00:00Z`) : null;
}

/** 那一年的每個月（照順序，閏月排在同名的月後面） */
function monthsOf(year: number): LunarMonth[] | null {
  const row = TABLE[year];
  if (!row) return null;
  const [, leapMonth, bits] = row;
  const out: LunarMonth[] = [];
  let index = 0;
  for (let month = 1; month <= 12; month++) {
    out.push({ month, leap: false, days: bits & (1 << index++) ? 30 : 29 });
    if (month === leapMonth) out.push({ month, leap: true, days: bits & (1 << index++) ? 30 : 29 });
  }
  return out;
}

/** 國曆 YYYY-MM-DD → 農曆；超出對照表的年份回 null */
export function lunarOf(date: string): LunarDay | null {
  const t = parseDay(date);
  if (Number.isNaN(t)) return null;
  let year = Number(date.slice(0, 4));
  let start = newYearMs(year);
  if (start === null || t < start) {
    year -= 1;
    start = newYearMs(year);
  }
  const months = monthsOf(year);
  if (start === null || !months || t < start) return null;
  let offset = Math.round((t - start) / DAY_MS);
  for (const m of months) {
    if (offset < m.days) return { year, month: m.month, day: offset + 1, leap: m.leap, monthDays: m.days };
    offset -= m.days;
  }
  return null;
}

/**
 * 農曆某年某月某日（不是閏月）→ 國曆 YYYY-MM-DD。
 * 三十日遇到只有 29 天的月 → 那個月的最後一天（廿九）。超出對照表回 null。
 */
export function lunarToSolar(year: number, month: number, day: number): string | null {
  const start = newYearMs(year);
  const months = monthsOf(year);
  if (start === null || !months || !(month >= 1 && month <= 12) || !(day >= 1 && day <= 30)) return null;
  let offset = 0;
  for (const m of months) {
    if (m.month === month && !m.leap) {
      return new Date(start + (offset + Math.min(day, m.days) - 1) * DAY_MS).toISOString().slice(0, 10);
    }
    offset += m.days;
  }
  return null;
}
