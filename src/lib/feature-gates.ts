// ────────────────────────────────────────────────
// 前端判斷功能能不能用：照後台「方案與次數」的設定（登入後載入一次，見 applyPlanSettings）
// 還沒載入時用預設值（＝原本寫死的規則）。伺服器端不要用這裡（設定是整個程式共用的），改用 plan-access-server
// ────────────────────────────────────────────────

import {
  defaultPlanSettings,
  featureBlock,
  tierLabel,
  type FeatureGrant,
  type FeatureKey,
  type PlanSettings,
  type SubscriptionTier,
} from "./plan-settings";

export type { FeatureKey, SubscriptionTier } from "./plan-settings";
export { tierLabel } from "./plan-settings";

let activeSettings: PlanSettings = defaultPlanSettings();
let activeGrants: FeatureGrant[] = [];

/** 前端：登入後載入的設定和自己的開通（只在瀏覽器呼叫） */
export function applyPlanSettings(settings: PlanSettings, grants: FeatureGrant[] = []) {
  activeSettings = settings;
  activeGrants = grants;
}

/** 每個功能最低要哪個方案（目前的設定） */
export function featureMinTier(feature: FeatureKey): SubscriptionTier {
  return activeSettings.features[feature].min_tier;
}

/** 整個功能有沒有開（關掉的入口直接不顯示） */
export function featureEnabled(feature: FeatureKey): boolean {
  return activeSettings.features[feature].enabled;
}

export function hasFeature(tier: SubscriptionTier | "admin" | null | undefined, feature: FeatureKey) {
  return featureBlock(activeSettings, tier ?? "free", feature, activeGrants) === null;
}

export function requiredTierLabel(feature: FeatureKey) {
  return tierLabel(featureMinTier(feature));
}
