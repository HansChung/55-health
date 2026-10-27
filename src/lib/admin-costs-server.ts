// ────────────────────────────────────────────────
// 後台「每月成本」（只在 API route 用；service role）
// lk888：/v1/skills/balance（餘額＋這把金鑰累計用量）、/v1/skills/models/{model}/pricing（每百萬 token 幾算力）——都是查詢，不扣點
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { lk888ApiKey, lk888BaseUrl } from "@/lib/ai/lk888";
import {
  DEFAULT_COST_SETTINGS,
  normalizeCostSettings,
  rateFromPricing,
  taipeiDay,
  type CostSettings,
  type TokenRate,
  type UsageSnapshot,
} from "@/lib/admin-costs";

type Admin = ReturnType<typeof createSupabaseAdmin>;

const TIMEOUT_MS = 8_000;
const RATE_CACHE_MS = 6 * 3600_000;
const rateCache = new Map<string, { at: number; rate: TokenRate | null }>();

export interface Lk888Balance {
  balance: number;
  used: number;
}

/** 目前餘額、這把金鑰累計用了多少；沒設金鑰或查不到就 null */
export async function fetchLk888Balance(): Promise<Lk888Balance | null> {
  const key = lk888ApiKey();
  if (!key) return null;
  try {
    const res = await fetch(`${lk888BaseUrl()}/v1/skills/balance`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { balance?: unknown; api_key_quota?: { used?: unknown } };
    const balance = Number(json.balance);
    const used = Number(json.api_key_quota?.used);
    if (!Number.isFinite(balance) || !Number.isFinite(used)) throw new Error("unexpected balance response");
    return { balance, used };
  } catch (e) {
    console.warn("[costs] lk888 balance failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** 幾個模型的單價（每個模型 6 小時內共用）；查不到的不放（用內建的備用單價） */
export async function fetchTokenRates(models: string[]): Promise<Record<string, TokenRate>> {
  const key = lk888ApiKey();
  const out: Record<string, TokenRate> = {};
  if (!key) return out;
  await Promise.all(
    [...new Set(models)].filter((m) => /^[\w.-]{1,60}$/.test(m)).map(async (model) => {
      const hit = rateCache.get(model);
      if (hit && Date.now() - hit.at < RATE_CACHE_MS) {
        if (hit.rate) out[model] = hit.rate;
        return;
      }
      let rate: TokenRate | null = null;
      try {
        const res = await fetch(`${lk888BaseUrl()}/v1/skills/models/${encodeURIComponent(model)}/pricing`, {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        });
        if (res.ok) rate = rateFromPricing(await res.json());
      } catch { /* 用備用單價 */ }
      rateCache.set(model, { at: Date.now(), rate });
      if (rate) out[model] = rate;
    })
  );
  return out;
}

/** 記今天的累計用量：同一天後面的覆蓋前面的，所以每一筆＝那一天最後看到的值（見 UsageSnapshot）；還沒跑 SQL 就略過 */
export async function saveSnapshot(admin: Admin, b: Lk888Balance, now = new Date()): Promise<void> {
  const { error } = await admin
    .from("lk888_usage_snapshots")
    .upsert({ day: taipeiDay(now.toISOString()), used: b.used, balance: b.balance, updated_at: now.toISOString() }, { onConflict: "day" });
  if (error) console.warn("[costs] save snapshot failed (add-cost-tracking.sql 跑了嗎？):", error.message);
}

export async function loadSnapshots(admin: Admin): Promise<UsageSnapshot[]> {
  const { data, error } = await admin.from("lk888_usage_snapshots").select("day, used, balance").order("day", { ascending: true }).limit(1000);
  if (error) return [];
  return ((data ?? []) as { day: string; used: number | string; balance: number | string }[]).map((r) => ({
    day: r.day,
    used: Number(r.used),
    balance: Number(r.balance),
  }));
}

export async function loadCostSettings(admin: Admin): Promise<CostSettings> {
  const { data, error } = await admin.from("app_settings").select("value").eq("key", "costs").maybeSingle();
  if (error || !data) return DEFAULT_COST_SETTINGS;
  return normalizeCostSettings((data as { value: unknown }).value);
}

/** 付費會員數（不含管理員）和月費 → 訂閱收入估算 */
export async function loadRevenue(admin: Admin): Promise<{ basic: number; pro: number; prices: { basic: number; pro: number } }> {
  const [{ count: basic }, { count: pro }, { data: plans }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_tier", "basic").or("is_admin.is.null,is_admin.eq.false"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_tier", "pro").or("is_admin.is.null,is_admin.eq.false"),
    admin.from("subscription_plans").select("id, price_monthly_twd"),
  ]);
  const price = (id: string, fallback: number) =>
    Number(((plans ?? []) as { id: string; price_monthly_twd: number | null }[]).find((p) => p.id === id)?.price_monthly_twd) || fallback;
  return { basic: basic ?? 0, pro: pro ?? 0, prices: { basic: price("basic", 199), pro: price("pro", 399) } };
}
