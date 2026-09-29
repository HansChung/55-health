import { describe, it, expect } from "vitest";
import { isPublicHttpsUrl, travelVideoNotifyUrl, webhookSecretMatches } from "./travel-video-webhook";

const SECRET = "a3f9c1e07b2d4e6f8a1b3c5d7e9f0a2b";

describe("isPublicHttpsUrl", () => {
  it("公網 https 可以", () => {
    expect(isPublicHttpsUrl("https://nuan55.com")).toBe(true);
    expect(isPublicHttpsUrl("https://x.supabase.co/storage/v1/object/public/a.jpg")).toBe(true);
  });

  it("http、本機、壞網址都不行", () => {
    expect(isPublicHttpsUrl("http://nuan55.com")).toBe(false);
    expect(isPublicHttpsUrl("https://localhost:3000")).toBe(false);
    expect(isPublicHttpsUrl("http://127.0.0.1:54321/x.jpg")).toBe(false);
    expect(isPublicHttpsUrl("not a url")).toBe(false);
  });
});

describe("travelVideoNotifyUrl", () => {
  it("有密鑰 + 公網網域 → 產生回呼網址", () => {
    expect(
      travelVideoNotifyUrl({ LK888_WEBHOOK_SECRET: SECRET, NEXT_PUBLIC_APP_URL: "https://nuan55.com/" })
    ).toBe(`https://nuan55.com/api/webhooks/lk888/${SECRET}`);
  });

  it("帶 video_id 讓 webhook 能對回影片", () => {
    expect(
      travelVideoNotifyUrl(
        { LK888_WEBHOOK_SECRET: SECRET, NEXT_PUBLIC_APP_URL: "https://nuan55.com" },
        "3f1c9a2e-8b4d-4c6e-9f0a-1b2c3d4e5f60"
      )
    ).toBe(`https://nuan55.com/api/webhooks/lk888/${SECRET}?video_id=3f1c9a2e-8b4d-4c6e-9f0a-1b2c3d4e5f60`);
  });

  it("沒密鑰、密鑰太短、本機開發 → 不送回呼", () => {
    expect(travelVideoNotifyUrl({ NEXT_PUBLIC_APP_URL: "https://nuan55.com" })).toBeNull();
    expect(travelVideoNotifyUrl({ LK888_WEBHOOK_SECRET: "short", NEXT_PUBLIC_APP_URL: "https://nuan55.com" })).toBeNull();
    expect(
      travelVideoNotifyUrl({ LK888_WEBHOOK_SECRET: SECRET, NEXT_PUBLIC_APP_URL: "http://localhost:3000" })
    ).toBeNull();
  });
});

describe("webhookSecretMatches", () => {
  it("完全相同才通過", () => {
    expect(webhookSecretMatches(SECRET, SECRET)).toBe(true);
    expect(webhookSecretMatches(SECRET.slice(0, -1) + "x", SECRET)).toBe(false);
    expect(webhookSecretMatches("short", SECRET)).toBe(false);
  });

  it("伺服器沒設定（或太短）一律拒絕", () => {
    expect(webhookSecretMatches("", undefined)).toBe(false);
    expect(webhookSecretMatches("abc", "abc")).toBe(false);
  });
});
