// ────────────────────────────────────────────────
// 方案與次數（後台「方案與次數」可以改；前後端共用）
// ・每個功能：開／關（關掉＝所有人都不能用，管理員除外，方便測試），以及最低要哪個方案
// ・每個次數上限：免費／標準／專業各自多少
// ・個別帳號開通：某個功能當作某個方案（可設到期日），次數也照那個方案算
// 存在 app_settings（key = 'plan'）；沒存過、或少了哪一項，就用這裡的預設值（＝原本寫死在程式裡的數字）
// ────────────────────────────────────────────────

export type SubscriptionTier = "free" | "basic" | "pro";
export const TIERS: SubscriptionTier[] = ["free", "basic", "pro"];
const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, basic: 1, pro: 2 };

export function tierLabel(tier: SubscriptionTier) {
  return ({ free: "免費版", basic: "標準版", pro: "專業版" } as const)[tier];
}

export function isTier(v: unknown): v is SubscriptionTier {
  return v === "free" || v === "basic" || v === "pro";
}

export const FEATURE_DEFS = [
  // AI 功能（會花平台算力）
  { key: "ask", label: "問暖暖（打字）", group: "ai", minTier: "free", note: "和語音對話、故事訪談、看診整理共用每天題數" },
  { key: "ai_voice", label: "跟暖暖聊聊（語音對話）", group: "ai", minTier: "basic" },
  { key: "ai_photo", label: "拍照記餐、拍藥袋", group: "ai", minTier: "basic" },
  { key: "photo_ask", label: "拍照問暖暖", group: "ai", minTier: "free", note: "免費版每天幾次；標準版以上用每月拍照次數" },
  { key: "scam_check", label: "這則訊息可疑嗎？", group: "ai", minTier: "free" },
  { key: "clinic", label: "看診小幫手", group: "ai", minTier: "free" },
  { key: "life_stories", label: "我的故事集（AI 訪談、整理文章）", group: "ai", minTier: "free" },
  { key: "dictation", label: "用說的打字（App 裡、沒有內建語音辨識的瀏覽器）", group: "ai", minTier: "free", note: "每句約 0.001 算力；手機瀏覽器內建的語音辨識免費、不算次數" },
  { key: "travel_video", label: "出遊回憶影片（單張照片）", group: "video", minTier: "basic", note: "每支約 1 算力" },
  { key: "travel_montage", label: "多張照片遊記", group: "video", minTier: "basic", note: "每支約 0.1 算力（配音）" },
  { key: "travel_mv", label: "遊記 MV", group: "video", minTier: "pro", note: "每首約 0.54 算力" },
  { key: "travel_yearly", label: "年度回憶影片", group: "video", minTier: "free", note: "伺服器自己剪，不花算力" },
  { key: "voice_clone", label: "我的聲音（口白、念故事）", group: "video", minTier: "pro", note: "每個聲音第一次使用要 18.8 算力啟用費" },
  // 一般功能
  { key: "medication_reminders", label: "用藥提醒", group: "app", minTier: "basic" },
  { key: "favorite_meals", label: "常吃的餐點", group: "app", minTier: "basic" },
  { key: "health_alerts", label: "健康提醒", group: "app", minTier: "basic" },
  { key: "weekly_report", label: "每週報告", group: "app", minTier: "pro" },
  { key: "family_summary", label: "家人摘要", group: "app", minTier: "pro" },
  { key: "line_share", label: "分享到 LINE", group: "app", minTier: "pro" },
  { key: "partner_offers", label: "在地好康", group: "app", minTier: "pro" },
  { key: "alerts_center", label: "提醒中心", group: "app", minTier: "pro" },
] as const satisfies readonly { key: string; label: string; group: "ai" | "video" | "app"; minTier: SubscriptionTier; note?: string }[];

export type FeatureKey = (typeof FEATURE_DEFS)[number]["key"];
export const FEATURE_KEYS = FEATURE_DEFS.map((f) => f.key) as FeatureKey[];
export const FEATURE_GROUPS = [
  { id: "ai", label: "AI 功能" },
  { id: "video", label: "影片與聲音" },
  { id: "app", label: "一般功能" },
] as const;

export function featureLabel(key: FeatureKey): string {
  return FEATURE_DEFS.find((f) => f.key === key)?.label ?? key;
}

type Triple = Record<SubscriptionTier, number>;

export const LIMIT_DEFS = [
  { key: "ask_daily", label: "問暖暖題數", period: "每天", feature: "ask", defaults: { free: 20, basic: 50, pro: 100 }, note: "打字、語音、故事訪談、看診整理共用" },
  { key: "photo_monthly", label: "拍照次數", period: "每月", feature: "ai_photo", defaults: { free: 100, basic: 500, pro: 2000 }, note: "拍照記餐、藥袋、檢驗報告、拍照問暖暖（標準版以上）共用" },
  { key: "photo_ask_free_daily", label: "拍照問暖暖（免費版）", period: "每天", feature: "photo_ask", defaults: { free: 5, basic: 5, pro: 5 }, note: "只有免費版用這個；標準版以上用每月拍照次數" },
  { key: "clinic_report_free_daily", label: "看懂檢驗報告（免費版）", period: "每天", feature: "clinic", defaults: { free: 3, basic: 3, pro: 3 }, note: "只有免費版用這個；標準版以上用每月拍照次數" },
  { key: "scam_check_daily", label: "可疑訊息檢查", period: "每天", feature: "scam_check", defaults: { free: 10, basic: 10, pro: 10 } },
  { key: "dictation_daily", label: "用說的打字（伺服器聽寫）", period: "每天", feature: "dictation", defaults: { free: 30, basic: 80, pro: 150 } },
  { key: "video_monthly", label: "出遊回憶影片", period: "每月", feature: "travel_video", defaults: { free: 0, basic: 2, pro: 6 } },
  { key: "montage_monthly", label: "多張照片遊記", period: "每月", feature: "travel_montage", defaults: { free: 0, basic: 10, pro: 30 } },
  { key: "mv_monthly", label: "遊記 MV", period: "每月", feature: "travel_mv", defaults: { free: 0, basic: 0, pro: 6 } },
  { key: "yearly_per_year", label: "年度回憶影片", period: "每年", feature: "travel_yearly", defaults: { free: 1, basic: 3, pro: 5 } },
  { key: "story_voice_monthly", label: "用我的聲音念故事", period: "每月", feature: "voice_clone", defaults: { free: 4, basic: 4, pro: 4 } },
  { key: "voice_clones_30d", label: "錄「我的聲音」", period: "每 30 天", feature: "voice_clone", defaults: { free: 2, basic: 2, pro: 2 } },
  { key: "story_audio_daily", label: "聲音故事上傳", period: "每天", feature: "life_stories", defaults: { free: 10, basic: 10, pro: 10 } },
] as const satisfies readonly { key: string; label: string; period: string; feature: FeatureKey; defaults: Triple; note?: string }[];

export type LimitKey = (typeof LIMIT_DEFS)[number]["key"];
export const LIMIT_KEYS = LIMIT_DEFS.map((l) => l.key) as LimitKey[];
/** 一個上限最多填多少（再多就當作不限） */
export const LIMIT_MAX = 99999;

export interface FeatureSetting {
  enabled: boolean;
  min_tier: SubscriptionTier;
}

export interface PlanSettings {
  features: Record<FeatureKey, FeatureSetting>;
  limits: Record<LimitKey, Triple>;
}

export function defaultPlanSettings(): PlanSettings {
  return {
    features: Object.fromEntries(FEATURE_DEFS.map((f) => [f.key, { enabled: true, min_tier: f.minTier }])) as Record<FeatureKey, FeatureSetting>,
    limits: Object.fromEntries(LIMIT_DEFS.map((l) => [l.key, { ...l.defaults }])) as Record<LimitKey, Triple>,
  };
}

function clampLimit(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(LIMIT_MAX, Math.max(0, Math.round(n)));
}

/** 存在資料庫的設定（可能只有一部分、或是舊版）→ 補齊預設值、檢查格式 */
export function normalizePlanSettings(raw: unknown, base: PlanSettings = defaultPlanSettings()): PlanSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as { features?: Record<string, unknown>; limits?: Record<string, unknown> };
  const features = { ...base.features };
  for (const key of FEATURE_KEYS) {
    const f = r.features?.[key] as Partial<FeatureSetting> | undefined;
    if (!f || typeof f !== "object") continue;
    features[key] = {
      enabled: typeof f.enabled === "boolean" ? f.enabled : base.features[key].enabled,
      min_tier: isTier(f.min_tier) ? f.min_tier : base.features[key].min_tier,
    };
  }
  const limits = { ...base.limits };
  for (const key of LIMIT_KEYS) {
    const l = r.limits?.[key] as Partial<Triple> | undefined;
    if (!l || typeof l !== "object") continue;
    limits[key] = {
      free: clampLimit(l.free, base.limits[key].free),
      basic: clampLimit(l.basic, base.limits[key].basic),
      pro: clampLimit(l.pro, base.limits[key].pro),
    };
  }
  return { features, limits };
}

/** 個別帳號開通：這個功能當作 tier 方案（到期日之後失效；null＝不會過期） */
export interface FeatureGrant {
  feature: FeatureKey;
  tier: SubscriptionTier;
  expires_at: string | null;
}

export function activeGrants(grants: FeatureGrant[] | null | undefined, now = new Date()): FeatureGrant[] {
  return (grants ?? []).filter((g) => !g.expires_at || new Date(g.expires_at).getTime() > now.getTime());
}

/** 這個人用這個功能時算哪個方案：自己的方案和開通的方案取高的 */
export function effectiveTier(tier: string | null | undefined, feature: FeatureKey, grants: FeatureGrant[] | null | undefined, now = new Date()): SubscriptionTier {
  let best: SubscriptionTier = isTier(tier) ? tier : "free";
  for (const g of activeGrants(grants, now)) {
    if (g.feature === feature && TIER_RANK[g.tier] > TIER_RANK[best]) best = g.tier;
  }
  return best;
}

/** 為什麼不能用：null＝可以用；disabled＝整個功能關掉；tier＝方案不夠 */
export function featureBlock(
  settings: PlanSettings,
  tier: string | null | undefined,
  feature: FeatureKey,
  grants?: FeatureGrant[] | null,
  now = new Date()
): null | "disabled" | "tier" {
  if (tier === "admin") return null;
  const f = settings.features[feature];
  if (!f.enabled) return "disabled";
  return TIER_RANK[effectiveTier(tier, feature, grants, now)] >= TIER_RANK[f.min_tier] ? null : "tier";
}

export function canUseFeature(settings: PlanSettings, tier: string | null | undefined, feature: FeatureKey, grants?: FeatureGrant[] | null): boolean {
  return featureBlock(settings, tier, feature, grants) === null;
}

/** 這個人的上限：管理員不限；有開通的功能照開通的方案算 */
export function limitFor(settings: PlanSettings, tier: string | null | undefined, key: LimitKey, grants?: FeatureGrant[] | null, now = new Date()): number {
  if (tier === "admin") return LIMIT_MAX;
  const def = LIMIT_DEFS.find((l) => l.key === key)!;
  return settings.limits[key][effectiveTier(tier, def.feature, grants, now)];
}

/** 不能用時給長輩看的話 */
export function featureBlockMessage(settings: PlanSettings, feature: FeatureKey, why: "disabled" | "tier"): string {
  const label = featureLabel(feature).replace(/（.*?）/g, "");
  if (why === "disabled") return `「${label}」暫時停用，請稍後再試`;
  return `「${label}」是${tierLabel(settings.features[feature].min_tier)}功能，升級後就可以使用`;
}

/** 方案頁每個方案列出的項目（照目前的開關與次數，免得後台改了方案頁還是舊數字） */
export function pricingFeatures(settings: PlanSettings, tier: SubscriptionTier): string[] {
  const can = (f: FeatureKey) => featureBlock(settings, tier, f) === null;
  const n = (k: LimitKey) => settings.limits[k][tier];
  const count = (v: number, unit: string) => (v >= LIMIT_MAX ? "不限" : `${v} ${unit}`);
  const out: string[] = [];
  if (tier === "free") out.push("基本記錄");
  if (can("ai_photo") && n("photo_monthly") > 0) out.push(`每月 ${count(n("photo_monthly"), "次")} AI 拍照`);
  else if (can("photo_ask") && n("photo_ask_free_daily") > 0) out.push(`每天拍照問暖暖 ${count(n("photo_ask_free_daily"), "次")}`);
  if (can("ask") && n("ask_daily") > 0) out.push(`每天問暖暖 ${count(n("ask_daily"), "句")}（${can("ai_voice") ? "打字或用說的" : "打字"}）`);
  if (can("travel_video") && n("video_monthly") > 0) out.push(`每月 ${count(n("video_monthly"), "支")}出遊回憶影片`);
  if (can("travel_montage") && n("montage_monthly") > 0) out.push(`每月 ${count(n("montage_monthly"), "支")}多張照片遊記影片`);
  if (can("voice_clone")) out.push("影片口白、故事用自己的聲音念");
  if (can("travel_mv") && n("mv_monthly") > 0) out.push(`每月 ${count(n("mv_monthly"), "首")}遊記 MV（寫成一首歌）`);
  if (can("travel_yearly") && n("yearly_per_year") > 0) out.push(`每年 ${count(n("yearly_per_year"), "支")}年度回憶影片`);
  if (tier === "basic") out.push("完整營養分析", "雲端備份");
  if (tier === "pro") out.push("家人共享", "進階健康報告", "優先支援");
  return out;
}
