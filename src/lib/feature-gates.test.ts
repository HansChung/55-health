import { describe, it, expect } from "vitest";
import { hasFeature, FEATURE_MIN_TIER, type FeatureKey } from "./feature-gates";

describe("hasFeature", () => {
  it("free 沒有需要 basic 的功能", () => {
    // 找一個最低需 basic 的功能
    const basicFeature = (Object.keys(FEATURE_MIN_TIER) as FeatureKey[]).find(
      (k) => FEATURE_MIN_TIER[k] === "basic"
    );
    if (basicFeature) {
      expect(hasFeature("free", basicFeature)).toBe(false);
      expect(hasFeature("basic", basicFeature)).toBe(true);
      expect(hasFeature("pro", basicFeature)).toBe(true);
    }
  });

  it("null/undefined 視為 free", () => {
    const proFeature = (Object.keys(FEATURE_MIN_TIER) as FeatureKey[]).find(
      (k) => FEATURE_MIN_TIER[k] === "pro"
    );
    if (proFeature) {
      expect(hasFeature(null, proFeature)).toBe(false);
      expect(hasFeature(undefined, proFeature)).toBe(false);
    }
  });

  it("pro 解鎖所有功能", () => {
    for (const key of Object.keys(FEATURE_MIN_TIER) as FeatureKey[]) {
      expect(hasFeature("pro", key)).toBe(true);
    }
  });
});
