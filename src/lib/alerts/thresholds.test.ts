import { describe, expect, it } from "vitest";
import {
  chronicSuggestedThresholds,
  DEFAULT_ALERT_THRESHOLDS,
  resolveAlertThresholds,
} from "./thresholds";

describe("alert thresholds", () => {
  it("無慢性病時用系統預設", () => {
    expect(resolveAlertThresholds(null)).toEqual(DEFAULT_ALERT_THRESHOLDS);
    expect(resolveAlertThresholds({ chronic_conditions: [] })).toEqual(
      DEFAULT_ALERT_THRESHOLDS
    );
  });

  it("糖尿病建議放寬血糖警戒", () => {
    const s = chronicSuggestedThresholds(["diabetes"]);
    expect(s.glucoseFastingHigh).toBe(200);
    expect(s.glucoseHigh).toBe(280);
    const resolved = resolveAlertThresholds({ chronic_conditions: ["diabetes"] });
    expect(resolved.glucoseFastingHigh).toBe(200);
    expect(resolved.bpSystolicHigh).toBe(DEFAULT_ALERT_THRESHOLDS.bpSystolicHigh);
  });

  it("高血壓建議收緊血壓警戒", () => {
    const resolved = resolveAlertThresholds({
      chronic_conditions: ["hypertension"],
    });
    expect(resolved.bpSystolicHigh).toBe(150);
    expect(resolved.bpDiastolicHigh).toBe(95);
  });

  it("個人覆寫優先於慢性病建議", () => {
    const resolved = resolveAlertThresholds({
      chronic_conditions: ["diabetes"],
      alert_thresholds: { glucoseFastingHigh: 190, inactivityDays: 5 },
    });
    expect(resolved.glucoseFastingHigh).toBe(190);
    expect(resolved.glucoseHigh).toBe(280);
    expect(resolved.inactivityDays).toBe(5);
  });
});
