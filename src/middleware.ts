import { NextRequest, NextResponse } from "next/server";
import {
  bucketForApiPath,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitExceededResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";

/**
 * 全站 API rate limit（依 IP）
 * cron／Stripe webhook 略過；AI／checkout／telemetry 用較嚴或較寬 bucket
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const bucket = bucketForApiPath(pathname);
  if (!bucket) return NextResponse.next();

  const ip = clientIpFromHeaders(req.headers);
  const result = await checkRateLimit(ip, bucket);

  if (!result.success) {
    return rateLimitExceededResponse(result);
  }

  const res = NextResponse.next();
  const headers = rateLimitHeaders(result);
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v);
  }
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
