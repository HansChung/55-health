import { describe, it, expect } from "vitest";
import { buildCampaignPatch, campaignPatchSchema, campaignCreateSchema } from "./partner-campaigns";

const NOW = "2026-09-11T00:00:00.000Z";

describe("buildCampaignPatch", () => {
  // 回歸測試：以前按「停用／啟用」會把活動連結與圖片清成 null
  it("只切換啟用狀態時，不會動到圖片與連結", () => {
    const patch = buildCampaignPatch({ active: false }, NOW);
    expect(patch).toEqual({ active: false, updated_at: NOW });
    expect(patch).not.toHaveProperty("image_url");
    expect(patch).not.toHaveProperty("cta_url");
  });

  it("有送圖片網址就更新", () => {
    expect(buildCampaignPatch({ image_url: "https://x.com/a.jpg" }, NOW).image_url).toBe("https://x.com/a.jpg");
  });

  it("送空字串＝移除圖片（存成 null）", () => {
    expect(buildCampaignPatch({ image_url: "" }, NOW).image_url).toBeNull();
    expect(buildCampaignPatch({ cta_url: null }, NOW).cta_url).toBeNull();
  });
});

describe("網址欄位安全", () => {
  it("圖片與活動連結只接受 http(s)", () => {
    expect(campaignPatchSchema.safeParse({ image_url: "javascript:alert(1)" }).success).toBe(false);
    expect(campaignPatchSchema.safeParse({ cta_url: "javascript:alert(1)" }).success).toBe(false);
    expect(campaignPatchSchema.safeParse({ cta_url: "https://shop.example.com" }).success).toBe(true);
    expect(campaignPatchSchema.safeParse({ image_url: "" }).success).toBe(true);
  });

  it("新增活動必填標題、說明、合作方", () => {
    expect(campaignCreateSchema.safeParse({ title: "t" }).success).toBe(false);
    expect(campaignCreateSchema.safeParse({ title: "t", description: "d", partner_name: "p" }).success).toBe(true);
  });
});
