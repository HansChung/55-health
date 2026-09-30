export type SubscriptionTier = "free" | "basic" | "pro";

export type FeatureKey =
  | "ai_photo"
  | "ai_voice"
  | "medication_reminders"
  | "favorite_meals"
  | "health_alerts"
  | "weekly_report"
  | "family_summary"
  | "line_share"
  | "partner_offers"
  | "alerts_center"
  | "travel_video"
  | "voice_clone";

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
};

export const FEATURE_MIN_TIER: Record<FeatureKey, SubscriptionTier> = {
  ai_photo: "basic",
  ai_voice: "basic",
  medication_reminders: "basic",
  favorite_meals: "basic",
  health_alerts: "basic",
  weekly_report: "pro",
  family_summary: "pro",
  line_share: "pro",
  partner_offers: "pro",
  alerts_center: "pro",
  travel_video: "basic",
  // 出遊影片用自己的聲音念：每個聲音第一次使用平台要收一筆啟用費，只開給專業版
  voice_clone: "pro",
};

export function hasFeature(tier: SubscriptionTier | null | undefined, feature: FeatureKey) {
  const current = tier ?? "free";
  return TIER_RANK[current] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

export function tierLabel(tier: SubscriptionTier) {
  return ({ free: "免費版", basic: "標準版", pro: "專業版" } as const)[tier];
}

export function requiredTierLabel(feature: FeatureKey) {
  return tierLabel(FEATURE_MIN_TIER[feature]);
}
