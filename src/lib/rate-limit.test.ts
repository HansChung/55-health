import { afterEach, describe, expect, it } from "vitest";
import {
  bucketForApiPath,
  checkRateLimit,
  clientIpFromHeaders,
  RATE_BUCKETS,
  resetMemoryRateLimitForTests,
} from "./rate-limit";

describe("rate-limit", () => {
  afterEach(() => {
    resetMemoryRateLimitForTests();
    delete process.env.RATE_LIMIT_DISABLED;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("bucketForApiPath 分類正確", () => {
    expect(bucketForApiPath("/api/cron/check-anomalies")).toBeNull();
    expect(bucketForApiPath("/api/stripe/webhook")).toBeNull();
    expect(bucketForApiPath("/api/ai/analyze-food")).toBe("ai");
    expect(bucketForApiPath("/api/stripe/checkout")).toBe("checkout");
    expect(bucketForApiPath("/api/telemetry")).toBe("telemetry");
    expect(bucketForApiPath("/api/meals")).toBe("api");
    expect(bucketForApiPath("/smart/radar")).toBeNull();
  });

  it("clientIpFromHeaders 取第一個 forwarded IP", () => {
    const h = new Headers({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      "x-real-ip": "9.9.9.9",
    });
    expect(clientIpFromHeaders(h)).toBe("1.2.3.4");
  });

  it("記憶體後備在超限後回傳 success=false", async () => {
    process.env.RATE_LIMIT_DISABLED = "0";
    delete process.env.UPSTASH_REDIS_REST_URL;
    const max = RATE_BUCKETS.checkout.requests;
    for (let i = 0; i < max; i++) {
      const r = await checkRateLimit("test-ip", "checkout");
      expect(r.success).toBe(true);
      expect(r.backend).toBe("memory");
    }
    const blocked = await checkRateLimit("test-ip", "checkout");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("RATE_LIMIT_DISABLED=1 時永遠放行", async () => {
    process.env.RATE_LIMIT_DISABLED = "1";
    for (let i = 0; i < RATE_BUCKETS.checkout.requests + 5; i++) {
      const r = await checkRateLimit("disabled-ip", "checkout");
      expect(r.success).toBe(true);
      expect(r.backend).toBe("disabled");
    }
  });
});
