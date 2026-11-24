// ────────────────────────────────────────────────
// 家人生日提醒（前後端共用）
// 記下家人、朋友的生日（國曆或農曆）→ 3 天前和當天早上 7 點推播；首頁快到了也會出現
// 農曆用對照表換算（lunar-calendar.ts，2024～2100 年）；日期都是台北時間
// ────────────────────────────────────────────────

import { appointmentDayLabel, taipeiDate } from "./clinic-appointments";
import { lunarOf, lunarToSolar } from "./lunar-calendar";

export type BirthdayCalendar = "solar" | "lunar";

export const BIRTHDAY_MAX = 50;
export const BIRTHDAY_NAME_MAX = 20;
export const BIRTHDAY_RELATION_MAX = 10;
/** 幾天前先提醒一次（好準備紅包、禮物） */
export const BIRTHDAY_AHEAD_DAYS = 3;
/** 提醒的時間（台北時間，給畫面說明用；排程見 vercel.json） */
export const BIRTHDAY_REMIND_HOUR = 7;
/** 首頁：幾天內的生日會出現 */
export const BIRTHDAY_HOME_DAYS = 3;

export const BIRTHDAY_RELATIONS = ["兒子", "女兒", "媳婦", "女婿", "孫子", "孫女", "先生", "太太", "兄弟姊妹", "朋友"];

export interface BirthdayNext {
  /** 下一次生日的國曆日期 YYYY-MM-DD */
  date: string;
  /** 還有幾天（0＝今天） */
  days: number;
  /** 那天滿幾歲（沒填出生年就是 null） */
  age: number | null;
}

export interface Birthday {
  id: string;
  name: string;
  relation: string | null;
  calendar: BirthdayCalendar;
  month: number;
  day: number;
  /** 西元出生年（可以不填） */
  birth_year: number | null;
  remind: boolean;
  /** 伺服器算好的下一次生日；算不出來（超出農曆對照表的年份）就是 null */
  next: BirthdayNext | null;
}

export interface BirthdayInput {
  name: string;
  relation: string;
  calendar: BirthdayCalendar;
  month: number;
  day: number;
  birthYear: number | null;
  remind: boolean;
}

type BirthdayDate = Pick<Birthday, "calendar" | "month" | "day" | "birth_year">;

// ── 日期小工具 ──

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400_000);
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const SOLAR_MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 那一年的國曆生日；2/29 生的人平年過 2/28 */
function solarBirthday(year: number, month: number, day: number): string {
  return ymd(year, month, month === 2 && day === 29 && !isLeapYear(year) ? 28 : day);
}

// ── 下一次生日 ──

function ageOn(date: string, birthYear: number | null): number | null {
  if (!birthYear) return null;
  const age = Number(date.slice(0, 4)) - birthYear;
  return age >= 1 && age <= 130 ? age : null;
}

/** 下一次生日（今天生日就是今天）；today 是台北日期 */
export function nextBirthday(b: BirthdayDate, today: string = taipeiDate()): BirthdayNext | null {
  let date: string | null = null;
  if (b.calendar === "lunar") {
    // 今年（農曆年）的還沒過就是今年，過了就是明年；閏月不算，三十日遇到小月過廿九（lunarToSolar）
    const lunarYear = lunarOf(today)?.year;
    if (lunarYear === undefined) return null;
    for (const y of [lunarYear, lunarYear + 1]) {
      const d = lunarToSolar(y, b.month, b.day);
      if (d && d >= today) {
        date = d;
        break;
      }
    }
  } else {
    const year = Number(today.slice(0, 4));
    const thisYear = solarBirthday(year, b.month, b.day);
    date = thisYear >= today ? thisYear : solarBirthday(year + 1, b.month, b.day);
  }
  if (!date) return null;
  return { date, days: daysBetween(today, date), age: ageOn(date, b.birth_year) };
}

/** 排程用：這一天要找資料庫裡哪些月、日（國曆、農曆各一組；農曆閏月那天沒有人生日） */
export function birthdayKeysFor(date: string): { solar: { month: number; days: number[] }; lunar: { month: number; days: number[] } | null } {
  const [y, m, d] = date.split("-").map(Number);
  const solarDays = m === 2 && d === 28 && !isLeapYear(y) ? [28, 29] : [d];
  const l = lunarOf(date);
  // 小月的最後一天（廿九）：三十日生的人也是這天過
  const lunar = l && !l.leap ? { month: l.month, days: l.day === 29 && l.monthDays === 29 ? [29, 30] : [l.day] } : null;
  return { solar: { month: m, days: solarDays }, lunar };
}

// ── 檢查長輩填的內容 ──

function cleanLine(v: unknown, max: number): string {
  return typeof v === "string" ? [...v.replace(/\s+/g, " ").trim()].slice(0, max).join("") : "";
}

function toInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isInteger(n) ? n : null;
}

/** 民國年 → 西元年 */
export function rocToAd(roc: number): number {
  return roc + 1911;
}

export function adToRoc(ad: number): number {
  return ad - 1911;
}

export function normalizeBirthdayInput(raw: unknown, now: Date = new Date()): { ok: true; value: BirthdayInput } | { ok: false; error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = cleanLine(r.name, BIRTHDAY_NAME_MAX);
  if (!name) return { ok: false, error: "請寫是誰的生日（名字或稱呼）" };
  const calendar: BirthdayCalendar = r.calendar === "lunar" ? "lunar" : "solar";
  const month = toInt(r.month);
  if (month === null || month < 1 || month > 12) return { ok: false, error: "請選幾月" };
  const day = toInt(r.day);
  if (day === null || day < 1) return { ok: false, error: "請選幾號" };
  const maxDay = calendar === "lunar" ? 30 : SOLAR_MONTH_DAYS[month - 1];
  if (day > maxDay) return { ok: false, error: calendar === "lunar" ? "農曆一個月最多三十天" : `${month} 月沒有 ${day} 號` };
  let birthYear: number | null = null;
  if (r.birthYear !== null && r.birthYear !== undefined && r.birthYear !== "") {
    birthYear = toInt(r.birthYear);
    const thisYear = Number(taipeiDate(now).slice(0, 4));
    if (birthYear === null || birthYear < 1900 || birthYear > thisYear) return { ok: false, error: "出生年不對，不知道可以不填" };
  }
  return {
    ok: true,
    value: { name, relation: cleanLine(r.relation, BIRTHDAY_RELATION_MAX), calendar, month, day, birthYear, remind: r.remind !== false },
  };
}

// ── 給畫面、推播用的字 ──

const LUNAR_MONTHS = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const CN_DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** 初一、十五、二十、廿三、三十 */
export function lunarDayName(day: number): string {
  if (day <= 10) return day === 10 ? "初十" : `初${CN_DIGITS[day]}`;
  if (day < 20) return `十${CN_DIGITS[day - 10]}`;
  if (day === 20) return "二十";
  if (day < 30) return `廿${CN_DIGITS[day - 20]}`;
  return "三十";
}

/** 國曆 12 月 3 日／農曆十月十六 */
export function birthdayDateLabel(b: Pick<Birthday, "calendar" | "month" | "day">): string {
  return b.calendar === "lunar" ? `農曆${LUNAR_MONTHS[b.month - 1] ?? ""}${lunarDayName(b.day)}` : `國曆 ${b.month} 月 ${b.day} 日`;
}

/** 小美（女兒） */
export function birthdayWho(b: Pick<Birthday, "name" | "relation">): string {
  return b.relation && b.relation !== b.name ? `${b.name}（${b.relation}）` : b.name;
}

/** 今天／明天／後天／還有 12 天 */
export function daysLeftLabel(days: number): string {
  if (days <= 0) return "今天";
  if (days === 1) return "明天";
  if (days === 2) return "後天";
  return `還有 ${days} 天`;
}

/** 今天是小美（女兒）的生日／再 3 天是…／明天是… */
export function birthdayHeadline(b: Pick<Birthday, "name" | "relation">, days: number): string {
  const who = birthdayWho(b);
  if (days <= 0) return `今天是${who}的生日`;
  if (days === 1) return `明天是${who}的生日`;
  if (days === 2) return `後天是${who}的生日`;
  return `再 ${days} 天是${who}的生日`;
}

/** 推播：當天早上（day）、幾天前（ahead） */
export function birthdayPush(b: Pick<Birthday, "name" | "relation" | "calendar" | "month" | "day">, next: BirthdayNext): { title: string; body: string } {
  const title = `🎂 ${birthdayHeadline(b, next.days)}`;
  const age = next.age ? `${next.age} 歲生日。` : "";
  if (next.days <= 0) return { title, body: `${age}打個電話說聲生日快樂，或做一支祝福影片送過去` };
  const when = `${appointmentDayLabel(next.date)}${b.calendar === "lunar" ? `，${birthdayDateLabel(b)}` : ""}`;
  return { title, body: `${when}。${age}可以先準備紅包、禮物，或做一支祝福影片` };
}

/** 快到的排前面；算不出下次生日的放最後 */
export function sortBirthdays<T extends Pick<Birthday, "name" | "next">>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.next?.days ?? 9999) - (b.next?.days ?? 9999) || a.name.localeCompare(b.name, "zh-Hant"));
}

/** 首頁要顯示的：幾天內、有開提醒的 */
export function homeBirthdays<T extends Pick<Birthday, "name" | "next" | "remind">>(list: T[]): T[] {
  return sortBirthdays(list).filter((b) => b.remind && b.next !== null && b.next.days <= BIRTHDAY_HOME_DAYS);
}
