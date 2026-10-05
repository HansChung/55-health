// ────────────────────────────────────────────────
// 每天早上天氣提醒能不能用（伺服器有氣象署金鑰＋推播金鑰）：首頁卡片、提醒通知頁決定要不要顯示
// GET → { available }
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { isWebPushConfigured } from "@/lib/push/send";
import { isWeatherConfigured } from "@/lib/weather-server";

export async function GET() {
  return NextResponse.json({ available: isWeatherConfigured() && isWebPushConfigured() });
}
