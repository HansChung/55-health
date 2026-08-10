/**
 * 全站 API rate limit
 * - 有 UPSTASH_REDIS_REST_URL + TOKEN → Upstash（多實例一致，正式站用）
 * - 未設定 → 行程內記憶體後備（本機／CI；serverless 多實例不共享）
 * - RATE_LIMIT_DISABLED=1 → 完全關閉（測試用）
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateBucket = "api" | "ai" | "checkout" | "telemetry";

type BucketConfig = {
  /** 視窗內允許次數 */
  requests: number;
  /** Upstash 視窗字串，如 "1 m" */
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  windowMs: number;
};

export const RATE_BUCKETS: Record<RateBucket, BucketConfig> = {
  /** 一般已登入 API */
  api: { requests: 120, window: "1 m", windowMs: 60_000 },
  /** AI／昂貴代理 */
  ai: { requests: 30, window: "1 m", windowMs: 60_000 },
  /** 結帳建立 */
  checkout: { requests: 8, window: "1 m", windowMs: 60_000 },
  /** 遙測（允許未登入，略寬） */
  telemetry: { requests: 60, window: "1 m", windowMs: 60_000 },
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  backend: "upstash" | "memory" | "disabled";
};

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function rateLimitDisabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === "1";
}

const upstashLimiters = new Map<RateBucket, Ratelimit>();

function getUpstashLimiter(bucket: RateBucket): Ratelimit {
  let limiter = upstashLimiters.get(bucket);
  if (!limiter) {
    const cfg = RATE_BUCKETS[bucket];
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(cfg.requests, cfg.window),
      prefix: `nuannuan:rl:${bucket}`,
      analytics: true,
    });
    upstashLimiters.set(bucket, limiter);
  }
  return limiter;
}

/** 行程內記憶體（僅單一實例可靠） */
type MemEntry = { hits: number[] };
const memoryStore = new Map<string, MemEntry>();

function memoryLimit(
  key: string,
  requests: number,
  windowMs: number
): Omit<RateLimitResult, "backend"> {
  const now = Date.now();
  const entry = memoryStore.get(key) ?? { hits: [] };
  entry.hits = entry.hits.filter((t) => now - t < windowMs);
  if (entry.hits.length >= requests) {
    const oldest = entry.hits[0] ?? now;
    memoryStore.set(key, entry);
    return {
      success: false,
      limit: requests,
      remaining: 0,
      reset: oldest + windowMs,
    };
  }
  entry.hits.push(now);
  memoryStore.set(key, entry);
  return {
    success: true,
    limit: requests,
    remaining: Math.max(0, requests - entry.hits.length),
    reset: now + windowMs,
  };
}

/** 測試用：清空記憶體計數 */
export function resetMemoryRateLimitForTests(): void {
  memoryStore.clear();
}

export async function checkRateLimit(
  identifier: string,
  bucket: RateBucket
): Promise<RateLimitResult> {
  const cfg = RATE_BUCKETS[bucket];
  if (rateLimitDisabled()) {
    return {
      success: true,
      limit: cfg.requests,
      remaining: cfg.requests,
      reset: Date.now() + cfg.windowMs,
      backend: "disabled",
    };
  }

  const id = `${bucket}:${identifier || "anonymous"}`;

  if (upstashConfigured()) {
    try {
      const { success, limit, remaining, reset } = await getUpstashLimiter(bucket).limit(id);
      return {
        success,
        limit,
        remaining,
        reset,
        backend: "upstash",
      };
    } catch (e) {
      console.error("[rate-limit] Upstash 失敗，改用記憶體後備:", e);
    }
  }

  return { ...memoryLimit(id, cfg.requests, cfg.windowMs), backend: "memory" };
}

/** 依 API 路徑選 bucket；回傳 null 表示略過（cron／webhook） */
export function bucketForApiPath(pathname: string): RateBucket | null {
  if (!pathname.startsWith("/api/")) return null;
  if (pathname.startsWith("/api/cron/")) return null;
  if (pathname === "/api/stripe/webhook") return null;
  if (pathname.startsWith("/api/ai/")) return "ai";
  if (pathname === "/api/stripe/checkout") return "checkout";
  if (pathname === "/api/telemetry") return "telemetry";
  return "api";
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(result.reset),
    ...(result.success ? {} : { "Retry-After": String(retryAfter || 1) }),
  };
}

export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "請求過於頻繁，請稍後再試" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...rateLimitHeaders(result),
      },
    }
  );
}
