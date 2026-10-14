// ────────────────────────────────────────────────
// 後台「每月成本」（純計算，前後端共用）
// AI 花費：lk888 有回報實際算力的（影片、配音、做歌、我的聲音：metadata.platform_cost）用實際值；
//          只記 token 的（Gemini：拍照辨識、問暖暖…）用 lk888 公布的模型單價估（每百萬 token 幾算力）
// 另外每天記一次 lk888 金鑰的累計用量，相減＝這個月 lk888 實際扣了多少（拿來對帳）
// 固定費用（Vercel、Supabase…）、算力價格、匯率、金流手續費在後台設定（app_settings key = 'costs'）
// ────────────────────────────────────────────────

export interface FixedCost {
  name: string;
  /** 每月幾美元 */
  usd: number;
}

export interface CostSettings {
  /** 1 算力 = 幾台幣（20 點 NT$96 → 4.8） */
  pointNtd: number;
  /** 1 美元 = 幾台幣 */
  usdNtd: number;
  /** 金流手續費 %（訂閱收入的幾 %） */
  feePct: number;
  fixed: FixedCost[];
}

export const DEFAULT_COST_SETTINGS: CostSettings = {
  pointNtd: 4.8,
  usdNtd: 32,
  feePct: 3.5,
  fixed: [
    { name: "Vercel Pro", usd: 20 },
    { name: "Supabase Pro", usd: 25 },
  ],
};

const clampNum = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : fallback;

export function normalizeCostSettings(raw: unknown): CostSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const fixed = Array.isArray(r.fixed)
    ? (r.fixed as Record<string, unknown>[])
        .map((f) => ({ name: typeof f?.name === "string" ? f.name.trim().slice(0, 40) : "", usd: clampNum(f?.usd, 0, 100000, NaN) }))
        .filter((f) => f.name && Number.isFinite(f.usd))
        .slice(0, 20)
    : DEFAULT_COST_SETTINGS.fixed;
  return {
    pointNtd: clampNum(r.pointNtd, 0.01, 1000, DEFAULT_COST_SETTINGS.pointNtd),
    usdNtd: clampNum(r.usdNtd, 1, 1000, DEFAULT_COST_SETTINGS.usdNtd),
    feePct: clampNum(r.feePct, 0, 50, DEFAULT_COST_SETTINGS.feePct),
    fixed,
  };
}

/** 端點 → 功能名稱（後台看得懂的） */
export const FEATURE_LABELS: Record<string, string> = {
  "/api/ai/analyze-food": "拍照記餐",
  "/api/ai/analyze-prescription": "拍藥袋",
  "/api/ai/suggest": "暖暖的建議",
  "/api/ai/chat": "問暖暖（打字、語音、故事訪談、看診整理）",
  "/api/ai/voice-turn": "跟暖暖聊聊（語音）",
  "/api/ai/photo-ask": "拍照問暖暖",
  "/api/scam-check": "可疑訊息",
  "/api/clinic/report": "看懂檢驗報告",
  "/api/ai/transcribe": "用說的打字",
  "/api/ai/travel-video": "出遊影片（單張）",
  "/api/ai/travel-video/narration": "影片口白配音",
  "/api/ai/travel-video/script": "AI 寫口白",
  "/api/ai/travel-video/montage": "遊記配音",
  "/api/ai/travel-video/montage/script": "AI 寫遊記",
  "/api/ai/travel-video/mv": "MV 做歌",
  "/api/ai/travel-video/mv/lyrics": "AI 寫歌詞",
  "/api/ai/voice-clone": "錄「我的聲音」",
  "/api/stories/voice": "用我的聲音念故事",
};

export function featureLabel(endpoint: string | null | undefined): string {
  if (!endpoint) return "其他";
  return FEATURE_LABELS[endpoint] ?? endpoint;
}

/** lk888 模型單價（每百萬 token 幾算力） */
export interface TokenRate {
  input: number;
  output: number;
}

/** 抓不到單價時用（2026-10-14 從 lk888 /v1/skills/models/{model}/pricing 查到的） */
export const FALLBACK_TOKEN_RATES: Record<string, TokenRate> = {
  "gem-3.8-flash": { input: 0.396, output: 1.9642 },
  "gem-3.5-flash-lite": { input: 1.0296, output: 7.5398 },
};

/**
 * lk888 /pricing 回應 → 這把金鑰可以用的按 token 計價通道，取中位數（策略會在這些通道之間換）
 */
export function rateFromPricing(json: unknown): TokenRate | null {
  const groups = Array.isArray((json as { channel_groups?: unknown })?.channel_groups)
    ? ((json as { channel_groups: Record<string, unknown>[] }).channel_groups)
    : [];
  const usable = groups.filter(
    (g) => g.is_active === true && g.in_key_whitelist !== false && g.excluded_for_this_key !== true && g.billing_method === "按token" &&
      typeof g.input_token_price === "number" && typeof g.output_token_price === "number"
  );
  if (usable.length === 0) return null;
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return {
    input: median(usable.map((g) => (g.input_token_price as number) * ((g.current_time_discount as number) || 1))),
    output: median(usable.map((g) => (g.output_token_price as number) * ((g.current_time_discount as number) || 1))),
  };
}

/** 沒有 token、平台也沒回報算力，但價格固定的呼叫（每次幾算力） */
export const FIXED_CALL_POINTS: Record<string, number> = {
  // lk888 POST /v1/skills/voices/clone：每次 0.1 算力（第一次拿來配音的 18.8 啟用費算在配音那一筆的 platform_cost）
  "/api/ai/voice-clone": 0.1,
};

export interface UsageRow {
  user_id: string | null;
  endpoint: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  success: boolean | null;
  metadata: Record<string, unknown> | null;
  /** 依官方單價估的美元（Google 直連時用這個換算） */
  cost_usd?: number | string | null;
  created_at: string;
}

/**
 * 一筆紀錄的算力：{ points, actual }；先佔位還沒用的（reserved）、失敗的（平台會退）都算 0。
 * 順序：平台回報的實際算力 → 固定價格 → lk888 模型單價 × token → 沒有 lk888 單價（Google 直連）就用 cost_usd 換算。
 * usdToPoints＝1 美元等於幾算力（台幣匯率 ÷ 算力價格）
 */
export function rowPoints(
  row: UsageRow,
  rates: Record<string, TokenRate>,
  usdToPoints = 0
): { points: number; actual: boolean; external?: boolean } {
  if (row.success === false || row.metadata?.reserved === true) return { points: 0, actual: true };
  const pc = row.metadata?.platform_cost;
  if (typeof pc === "number" && Number.isFinite(pc) && pc >= 0) return { points: pc, actual: true };
  const fixed = row.endpoint ? FIXED_CALL_POINTS[row.endpoint] : undefined;
  if (fixed !== undefined && !row.input_tokens && !row.output_tokens) return { points: fixed, actual: false };
  const viaGoogle = row.metadata?.provider === "google";
  const rate = row.model && !viaGoogle ? rates[row.model] ?? FALLBACK_TOKEN_RATES[row.model] : undefined;
  if (rate) {
    return { points: ((row.input_tokens ?? 0) * rate.input + (row.output_tokens ?? 0) * rate.output) / 1_000_000, actual: false };
  }
  // 不是 lk888 扣的（Google 直連）：external，lk888 的實際扣點裡沒有這一筆
  const usd = Number(row.cost_usd ?? 0);
  return { points: Number.isFinite(usd) && usd > 0 ? usd * usdToPoints : 0, actual: false, external: true };
}

export interface FeatureCost {
  feature: string;
  calls: number;
  failed: number;
  points: number;
  /** 其中有幾成是估算的（0～1） */
  estimatedShare: number;
}

export interface CostSummary {
  calls: number;
  failed: number;
  points: number;
  actualPoints: number;
  estimatedPoints: number;
  /** 不是 lk888 扣的（Google 直連，用 cost_usd 換算）：總額用 lk888 實際扣點時要另外加上 */
  externalPoints: number;
  byFeature: FeatureCost[];
  daily: { day: string; points: number }[];
  topUsers: { user_id: string; points: number; calls: number }[];
}

/** 台北日期 */
export function taipeiDay(iso: string): string {
  return new Date(new Date(iso).getTime() + 8 * 3600_000).toISOString().slice(0, 10);
}

export function summarizeUsage(rows: UsageRow[], rates: Record<string, TokenRate>, usdToPoints = 0): CostSummary {
  const byFeature = new Map<string, { calls: number; failed: number; points: number; est: number }>();
  const daily = new Map<string, number>();
  const users = new Map<string, { points: number; calls: number }>();
  let points = 0;
  let actualPoints = 0;
  let externalPoints = 0;
  let calls = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.metadata?.reserved === true) continue;
    const { points: p, actual, external } = rowPoints(row, rates, usdToPoints);
    if (external) externalPoints += p;
    const f = featureLabel(row.endpoint);
    const cur = byFeature.get(f) ?? { calls: 0, failed: 0, points: 0, est: 0 };
    cur.calls++;
    if (row.success === false) {
      cur.failed++;
      failed++;
    }
    cur.points += p;
    if (!actual) cur.est += p;
    byFeature.set(f, cur);
    calls++;
    points += p;
    if (actual) actualPoints += p;
    const d = taipeiDay(row.created_at);
    daily.set(d, (daily.get(d) ?? 0) + p);
    if (row.user_id) {
      const u = users.get(row.user_id) ?? { points: 0, calls: 0 };
      u.points += p;
      u.calls++;
      users.set(row.user_id, u);
    }
  }
  return {
    calls,
    failed,
    points,
    actualPoints,
    estimatedPoints: points - actualPoints,
    externalPoints,
    byFeature: [...byFeature.entries()]
      .map(([feature, v]) => ({ feature, calls: v.calls, failed: v.failed, points: v.points, estimatedShare: v.points > 0 ? v.est / v.points : 0 }))
      .sort((a, b) => b.points - a.points || b.calls - a.calls),
    daily: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, p]) => ({ day, points: p })),
    topUsers: [...users.entries()]
      .map(([user_id, v]) => ({ user_id, ...v }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10),
  };
}

/** 'YYYY-MM' → 台北時間這個月的開始、結束（ISO） */
export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1) - 8 * 3600_000).toISOString(),
    end: new Date(Date.UTC(y, m, 1) - 8 * 3600_000).toISOString(),
  };
}

export function taipeiMonth(now: Date = new Date()): string {
  return taipeiDay(now.toISOString()).slice(0, 7);
}

export function isMonth(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

/** 最近幾個月（新的在前） */
export function recentMonths(now: Date = new Date(), count = 6): string[] {
  const [y, m] = taipeiMonth(now).split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    return d.toISOString().slice(0, 7);
  });
}

/**
 * 每天一筆：**那一天（台北）最後看到的累計用量**——排程在台北晚上 11 點多記，打開後台也會用當下的值覆蓋今天那一筆。
 * 所以「某一天那筆」＝那一天結束時的累計；上個月最後一天那筆＝這個月開始時的累計
 */
export interface UsageSnapshot {
  day: string;
  used: number;
  balance: number;
}

/**
 * lk888 這個月實際扣了多少：這個月最後一筆（或現在）的累計 − 上個月最後一天那筆。
 * 沒有月初以前的紀錄就從這個月第一筆算（標示為「從 X 日起」，那一天當天的用量算不到）；
 * 區間裡累計有變小（金鑰換過）就算不出來
 */
export function lk888MonthUsed(snapshots: UsageSnapshot[], month: string, live?: { used: number } | null): { used: number; since: string } | null {
  const sorted = [...snapshots].sort((a, b) => a.day.localeCompare(b.day));
  const before = sorted.filter((s) => s.day < `${month}-01`).at(-1);
  const inMonth = sorted.filter((s) => s.day.startsWith(month));
  const isCurrent = Boolean(live) && month === taipeiMonth();
  const series = [...(before ? [before.used] : []), ...inMonth.map((s) => s.used), ...(isCurrent ? [live!.used] : [])];
  if (series.length < 2) return null;
  for (let i = 1; i < series.length; i++) if (series[i] < series[i - 1]) return null;
  // 沒有月初以前的紀錄：從這個月第一筆（那一天結束時）算起
  return { used: series[series.length - 1] - series[0], since: before ? `${month}-01` : nextDay(inMonth[0].day) };
}

function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10);
}

/** 照最近 7 天平均，剩下的算力大約還能用幾天（用量是 0 就回 null） */
export function daysLeft(balance: number, snapshots: UsageSnapshot[], live?: { used: number } | null): number | null {
  const sorted = [...snapshots].sort((a, b) => a.day.localeCompare(b.day));
  const last = live?.used ?? sorted.at(-1)?.used;
  const weekAgo = sorted.filter((s) => s.day <= taipeiDay(new Date(Date.now() - 7 * 86400_000).toISOString())).at(-1) ?? sorted[0];
  if (last === undefined || !weekAgo) return null;
  const days = Math.max(1, (Date.now() - Date.parse(`${weekAgo.day}T16:00:00Z`)) / 86400_000);
  const perDay = (last - weekAgo.used) / days;
  if (perDay <= 0) return null;
  return Math.floor(balance / perDay);
}
