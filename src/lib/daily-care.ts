// ────────────────────────────────────────────────
// 每天早上的關懷問候：有推播就推播（免費）；沒推播才寄 Email，而且每天寄的封數有上限
// Resend 免費版每天只能寄 100 封（還要留給登入驗證碼、異常通知、週報），超過的信會寄不出去
// 已經開「每天早上天氣」的人，同一時間已經收到一則早安推播 → 不再多推一則
// ────────────────────────────────────────────────

/** 每天最多寄幾封關懷 Email（DAILY_CARE_EMAIL_MAX 可以改；0＝完全不寄） */
export const DAILY_CARE_EMAIL_MAX_DEFAULT = 60;

export function dailyCareEmailMax(env: Record<string, string | undefined> = process.env): number {
  const raw = env.DAILY_CARE_EMAIL_MAX;
  if (raw === undefined || raw.trim() === "") return DAILY_CARE_EMAIL_MAX_DEFAULT;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DAILY_CARE_EMAIL_MAX_DEFAULT;
}

export type DailyCareChannel = "off" | "weather" | "push" | "email";

export function dailyCareChannel(opts: {
  /** notification_settings.daily_care.on === false */
  off: boolean;
  /** 這個人有推播訂閱 */
  hasPush: boolean;
  /** 這個人今天早上會收到天氣推播（有開、選了縣市，而且伺服器有設氣象署金鑰） */
  getsWeatherPush: boolean;
}): DailyCareChannel {
  if (opts.off) return "off";
  if (opts.hasPush) return opts.getsWeatherPush ? "weather" : "push";
  return "email";
}

/** 推播只放得下兩三行：第一句（昨天記了幾餐）＋最多一句提醒＋今日小叮嚀 */
export function buildDailyCarePush(opts: { name: string; lines: string[]; tip: string }): { title: string; body: string } {
  const body = [...opts.lines.slice(0, 2), `💡${opts.tip}`].join("\n");
  return { title: `早安，${opts.name} ☀️`, body };
}

/** 寄 Email 的名額不夠時，先給最近還有在用的人 */
export function byLatestActivity(latest: Map<string, string>): string[] {
  return [...latest.entries()].sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0)).map(([id]) => id);
}
