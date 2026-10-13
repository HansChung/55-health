// ────────────────────────────────────────────────
// 伺服器端：這個人能不能用某個功能、上限多少（照後台「方案與次數」的設定）
// 設定每個程式實例快取 30 秒（後台改完最多 30 秒生效）；還沒跑 add-plan-settings.sql 就用預設值
// 拍照、影片的預設上限沿用 subscription_plans 裡原本的數字（ai_photo_quota、ai_video_quota）
// ────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  LIMIT_MAX,
  defaultPlanSettings,
  featureBlock,
  featureBlockMessage,
  isTier,
  limitFor,
  normalizePlanSettings,
  type FeatureGrant,
  type FeatureKey,
  type LimitKey,
  type PlanSettings,
  type SubscriptionTier,
} from "@/lib/plan-settings";

type Admin = ReturnType<typeof createSupabaseAdmin>;

const CACHE_MS = 30_000;
let cached: { at: number; settings: PlanSettings; stored: unknown } | null = null;

/** 預設值：程式裡的數字，拍照／影片用 subscription_plans 原本的設定 */
export async function baseSettings(admin: Admin = createSupabaseAdmin()): Promise<PlanSettings> {
  const base = defaultPlanSettings();
  const { data, error } = await admin.from("subscription_plans").select("id, ai_photo_quota, ai_video_quota");
  if (error) {
    // 舊資料庫可能沒有 ai_video_quota：只查拍照
    const { data: photo } = await admin.from("subscription_plans").select("id, ai_photo_quota");
    for (const p of (photo ?? []) as { id: string; ai_photo_quota: number | null }[]) {
      if (isTier(p.id) && typeof p.ai_photo_quota === "number") base.limits.photo_monthly[p.id] = p.ai_photo_quota;
    }
    return base;
  }
  for (const p of (data ?? []) as { id: string; ai_photo_quota: number | null; ai_video_quota: number | null }[]) {
    if (!isTier(p.id)) continue;
    if (typeof p.ai_photo_quota === "number") base.limits.photo_monthly[p.id] = p.ai_photo_quota;
    if (typeof p.ai_video_quota === "number") base.limits.video_monthly[p.id] = p.ai_video_quota;
  }
  return base;
}

async function loadStoredPlan(admin: Admin): Promise<unknown> {
  const { data, error } = await admin.from("app_settings").select("value").eq("key", "plan").maybeSingle();
  if (error) console.warn("[plan] app_settings unavailable (add-plan-settings.sql 跑了嗎？):", error.message);
  return (data as { value: unknown } | null)?.value ?? null;
}

/** 目前的設定（快取 30 秒） */
export async function getPlanSettings(opts: { fresh?: boolean } = {}): Promise<PlanSettings> {
  if (!opts.fresh && cached && Date.now() - cached.at < CACHE_MS) return cached.settings;
  const admin = createSupabaseAdmin();
  const [base, stored] = await Promise.all([
    baseSettings(admin).catch(() => defaultPlanSettings()),
    loadStoredPlan(admin),
  ]);
  const settings = normalizePlanSettings(stored, base);
  cached = { at: Date.now(), settings, stored };
  return settings;
}

/** 後台存檔後清掉快取（這個實例馬上生效；其他實例最多 30 秒） */
export function invalidatePlanSettings() {
  cached = null;
}

export async function loadGrants(userId: string): Promise<FeatureGrant[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("user_feature_grants").select("feature, tier, expires_at").eq("user_id", userId);
  if (error) return []; // 還沒跑 SQL
  return (data ?? []) as FeatureGrant[];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return Boolean(email && adminEmails.includes(email));
}

export interface PlanAccess {
  /** 自己的方案；管理員是 "admin" */
  tier: SubscriptionTier | "admin";
  settings: PlanSettings;
  grants: FeatureGrant[];
  can(feature: FeatureKey): boolean;
  limit(key: LimitKey): number;
  /** 不能用時的回應內容（null＝可以用） */
  blocked(feature: FeatureKey): { status: number; error: string; upgradeUrl?: string } | null;
}

export function buildPlanAccess(tier: SubscriptionTier | "admin", settings: PlanSettings, grants: FeatureGrant[]): PlanAccess {
  return {
    tier,
    settings,
    grants,
    can: (feature) => featureBlock(settings, tier, feature, grants) === null,
    limit: (key) => (tier === "admin" ? LIMIT_MAX : limitFor(settings, tier, key, grants)),
    blocked: (feature) => {
      const why = featureBlock(settings, tier, feature, grants);
      if (!why) return null;
      return why === "disabled"
        ? { status: 503, error: featureBlockMessage(settings, feature, why) }
        : { status: 403, error: featureBlockMessage(settings, feature, why), upgradeUrl: "/pricing" };
    },
  };
}

/** 已經知道方案（例如 profiles 已經查過）時用 */
export async function planAccessFor(userId: string, tier: string | null | undefined): Promise<PlanAccess> {
  const t: SubscriptionTier | "admin" = tier === "admin" ? "admin" : isTier(tier) ? tier : "free";
  const [settings, grants] = await Promise.all([getPlanSettings(), t === "admin" ? Promise.resolve([]) : loadGrants(userId)]);
  return buildPlanAccess(t, settings, grants);
}

/** 功能關掉或方案不夠 → 直接回這個（null＝可以用） */
export function blockedResponse(access: PlanAccess, feature: FeatureKey): NextResponse | null {
  const b = access.blocked(feature);
  if (!b) return null;
  return NextResponse.json({ error: b.error, ...(b.upgradeUrl ? { upgradeUrl: b.upgradeUrl } : {}) }, { status: b.status });
}
