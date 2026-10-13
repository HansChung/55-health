import { afterEach, describe, it, expect } from "vitest";
import { applyPlanSettings, featureEnabled, hasFeature, requiredTierLabel } from "./feature-gates";
import { defaultPlanSettings, FEATURE_DEFS } from "./plan-settings";

afterEach(() => applyPlanSettings(defaultPlanSettings()));

describe("hasFeature（預設值＝原本的規則）", () => {
  it("free 沒有需要 basic 的功能", () => {
    expect(hasFeature("free", "ai_photo")).toBe(false);
    expect(hasFeature("basic", "ai_photo")).toBe(true);
    expect(hasFeature("pro", "ai_photo")).toBe(true);
  });

  it("null/undefined 視為 free", () => {
    expect(hasFeature(null, "travel_mv")).toBe(false);
    expect(hasFeature(undefined, "travel_mv")).toBe(false);
  });

  it("pro 解鎖所有功能", () => {
    for (const f of FEATURE_DEFS) expect(hasFeature("pro", f.key)).toBe(true);
  });
});

describe("套用後台設定", () => {
  it("改最低方案、關掉功能、個別開通", () => {
    const s = defaultPlanSettings();
    s.features.travel_mv = { enabled: true, min_tier: "basic" };
    s.features.scam_check = { enabled: false, min_tier: "free" };
    applyPlanSettings(s, [{ feature: "weekly_report", tier: "pro", expires_at: null }]);
    expect(hasFeature("basic", "travel_mv")).toBe(true);
    expect(requiredTierLabel("travel_mv")).toBe("標準版");
    expect(hasFeature("pro", "scam_check")).toBe(false);
    expect(featureEnabled("scam_check")).toBe(false);
    expect(hasFeature("admin", "scam_check")).toBe(true);
    expect(hasFeature("free", "weekly_report")).toBe(true);
  });
});
