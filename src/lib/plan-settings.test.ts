import { describe, expect, it } from "vitest";
import {
  LIMIT_MAX,
  defaultPlanSettings,
  effectiveTier,
  featureBlock,
  featureBlockMessage,
  limitFor,
  normalizePlanSettings,
  pricingFeatures,
} from "./plan-settings";

describe("normalizePlanSettings", () => {
  it("沒存過＝預設值；只存一部分就只換那一部分", () => {
    expect(normalizePlanSettings(null)).toEqual(defaultPlanSettings());
    const s = normalizePlanSettings({ limits: { ask_daily: { free: 30 } }, features: { travel_mv: { enabled: false } } });
    expect(s.limits.ask_daily).toEqual({ free: 30, basic: 50, pro: 100 });
    expect(s.features.travel_mv).toEqual({ enabled: false, min_tier: "pro" });
    expect(s.limits.mv_monthly).toEqual(defaultPlanSettings().limits.mv_monthly);
  });

  it("亂填的值：負數變 0、太大變上限、不是數字用原本的、方案名稱不對用原本的", () => {
    const s = normalizePlanSettings({
      limits: { ask_daily: { free: -5, basic: 10 ** 9, pro: "abc" } },
      features: { ask: { enabled: "yes", min_tier: "vip" } },
      unknown: 1,
    });
    expect(s.limits.ask_daily).toEqual({ free: 0, basic: LIMIT_MAX, pro: 100 });
    expect(s.features.ask).toEqual({ enabled: true, min_tier: "free" });
  });
});

describe("featureBlock／limitFor", () => {
  const s = defaultPlanSettings();
  it("方案不夠、關掉、管理員", () => {
    expect(featureBlock(s, "basic", "travel_mv")).toBe("tier");
    expect(featureBlock(s, "pro", "travel_mv")).toBeNull();
    const off = normalizePlanSettings({ features: { travel_mv: { enabled: false } } });
    expect(featureBlock(off, "pro", "travel_mv")).toBe("disabled");
    expect(featureBlock(off, "admin", "travel_mv")).toBeNull();
    expect(featureBlockMessage(s, "travel_mv", "tier")).toBe("「遊記 MV」是專業版功能，升級後就可以使用");
    expect(featureBlockMessage(s, "ai_voice", "disabled")).toBe("「跟暖暖聊聊」暫時停用，請稍後再試");
  });

  it("個別開通：功能和次數照開通的方案；過期就失效；只影響那個功能", () => {
    const now = new Date("2026-10-13T00:00:00Z");
    const grants = [
      { feature: "travel_mv" as const, tier: "pro" as const, expires_at: "2026-11-01T00:00:00Z" },
      { feature: "weekly_report" as const, tier: "pro" as const, expires_at: "2026-10-01T00:00:00Z" },
    ];
    expect(effectiveTier("free", "travel_mv", grants, now)).toBe("pro");
    expect(featureBlock(s, "free", "travel_mv", grants, now)).toBeNull();
    expect(limitFor(s, "free", "mv_monthly", grants, now)).toBe(6);
    expect(limitFor(s, "free", "montage_monthly", grants, now)).toBe(0);
    expect(featureBlock(s, "free", "weekly_report", grants, now)).toBe("tier");
    // 開通的方案比自己的低：照自己的
    expect(effectiveTier("pro", "ask", [{ feature: "ask", tier: "basic", expires_at: null }], now)).toBe("pro");
  });

  it("管理員不限次數", () => {
    expect(limitFor(s, "admin", "ask_daily")).toBe(LIMIT_MAX);
  });
});

describe("pricingFeatures", () => {
  it("預設值：和原本方案頁一樣的數字", () => {
    const s = defaultPlanSettings();
    expect(pricingFeatures(s, "free")).toEqual(["基本記錄", "每天拍照問暖暖 5 次", "每天問暖暖 20 句（打字）", "每年 1 支年度回憶影片"]);
    expect(pricingFeatures(s, "basic")).toContain("每月 500 次 AI 拍照");
    expect(pricingFeatures(s, "basic")).toContain("每天問暖暖 50 句（打字或用說的）");
    expect(pricingFeatures(s, "basic")).toContain("每月 2 支出遊回憶影片");
    expect(pricingFeatures(s, "basic")).not.toContain("影片口白、故事用自己的聲音念");
    expect(pricingFeatures(s, "pro")).toContain("每月 6 首遊記 MV（寫成一首歌）");
  });
  it("後台關掉或改數字就跟著變", () => {
    const s = normalizePlanSettings({ features: { travel_mv: { enabled: false } }, limits: { ask_daily: { pro: 99999 } } });
    expect(pricingFeatures(s, "pro").some((x) => x.includes("MV"))).toBe(false);
    expect(pricingFeatures(s, "pro")).toContain("每天問暖暖 不限（打字或用說的）");
  });
});
