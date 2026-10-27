// ────────────────────────────────────────────────
// 每日平安打卡（前後端共用）：長輩每天按一下「我今天很好」
// 設定 notification_settings.daily_checkin = { on, deadline }：
//   到 deadline 點還沒按 → 推播提醒長輩；兩個小時後還沒按 → 通知家人（Vercel 免費方案的排程在那個小時內某個時間跑，隔兩小時才保證至少差一小時）
// 通知過家人之後長輩才按 → 再告訴家人「剛剛報平安了」
// ────────────────────────────────────────────────

/** 可以選的截止時間（台北時間幾點）；每個時間各有兩個排程（提醒長輩、通知家人），見 vercel.json */
export const CHECKIN_DEADLINES = [9, 12, 15, 18] as const;
export type CheckinDeadline = (typeof CHECKIN_DEADLINES)[number];
export const DEFAULT_CHECKIN_DEADLINE: CheckinDeadline = 12;

export interface DailyCheckinSetting {
  on: boolean;
  deadline: CheckinDeadline;
}

export function isCheckinDeadline(v: unknown): v is CheckinDeadline {
  return typeof v === "number" && (CHECKIN_DEADLINES as readonly number[]).includes(v);
}

/** 存在 notification_settings 裡的設定（可能沒有、或格式不對）→ 正規化 */
export function checkinSetting(raw: unknown): DailyCheckinSetting {
  const r = (raw && typeof raw === "object" ? raw : {}) as { on?: unknown; deadline?: unknown };
  const deadline = typeof r.deadline === "string" ? Number(r.deadline) : r.deadline;
  return { on: r.on === true, deadline: isCheckinDeadline(deadline) ? deadline : DEFAULT_CHECKIN_DEADLINE };
}

/** 台北日期 YYYY-MM-DD */
export function taipeiDay(now: Date = new Date()): string {
  return new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
}

/** 台北時間幾點幾分 */
export function taipeiClock(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 8 * 3600_000);
  return `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function deadlineLabel(h: number): string {
  return h < 12 ? `早上 ${h} 點` : h === 12 ? "中午 12 點" : h < 18 ? `下午 ${h - 12} 點` : `晚上 ${h - 12} 點`;
}

/** 今天的狀態：done＝報過了；waiting＝還沒到時間；late＝過了時間還沒報（有開通知才會 late） */
export function checkinState(setting: DailyCheckinSetting, checkedAt: string | null, now: Date = new Date()): "done" | "waiting" | "late" {
  if (checkedAt) return "done";
  if (!setting.on) return "waiting";
  const hour = new Date(now.getTime() + 8 * 3600_000).getUTCHours();
  return hour >= setting.deadline ? "late" : "waiting";
}

export function checkinReminderPush(): { title: string; body: string } {
  return { title: "👋 今天還沒報平安喔", body: "打開暖暖按一下「我今天很好」，讓家人放心" };
}

export function checkinFamilyAlertPush(opts: { elderName: string; deadline: number }): { title: string; body: string } {
  return {
    title: `${opts.elderName}今天還沒報平安`,
    body: `已經過了${deadlineLabel(opts.deadline)}還沒按「我今天很好」，打個電話問候一下吧`,
  };
}

export function checkinFamilyRelievedPush(opts: { elderName: string; checkedAt: string }): { title: string; body: string } {
  return { title: `✅ ${opts.elderName}報平安了`, body: `${taipeiClock(opts.checkedAt)} 按了「我今天很好」，可以放心了` };
}

/** 排程網址的參數：step=remind（提醒長輩）／alert（通知家人），slot＝截止時間 */
export function parseCheckinCronParams(step: string | null, slot: string | null): { step: "remind" | "alert"; slot: CheckinDeadline } | null {
  const n = Number(slot);
  if ((step !== "remind" && step !== "alert") || !isCheckinDeadline(n)) return null;
  return { step, slot: n };
}
