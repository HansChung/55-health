// ────────────────────────────────────────────────
// 今天天氣（功能 → 出門運動）：氣象署 36 小時預報＋環境部即時 AQI，整理成一頁
// GET ?county=臺北市 → { weather }；沒帶縣市就用「每天早上天氣」選過的；都沒有 → { weather: null }（畫面請他選）
// 沒設 CWA_API_KEY → 503（入口也不會出現，見 /api/plan-settings 的 services.weather）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { blockedResponse } from "@/lib/plan-access-server";
import { countiesAir } from "@/lib/air-quality-server";
import { buildTodayWeather } from "@/lib/today-weather";
import { isTaiwanCounty, type TaiwanCounty } from "@/lib/weather";
import { countyForecast, isWeatherConfigured } from "@/lib/weather-server";

function toCounty(v: unknown): TaiwanCounty | null {
  if (typeof v !== "string") return null;
  const c = v.trim().replace(/台/g, "臺");
  return isTaiwanCounty(c) ? c : null;
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { profile, access } = await loadAsker(user.id, user.email);
  const blocked = blockedResponse(access, "weather");
  if (blocked) return blocked;
  if (!isWeatherConfigured()) return NextResponse.json({ error: "天氣還在準備中" }, { status: 503 });

  let county = toCounty(req.nextUrl.searchParams.get("county"));
  if (!county) {
    // 每天早上天氣選過的縣市（關掉了也還留著）
    const { data } = await createSupabaseAdmin().from("profiles").select("notification_settings").eq("id", user.id).maybeSingle();
    const saved = (data?.notification_settings as { daily_weather?: { county?: unknown } } | null)?.daily_weather?.county;
    county = toCounty(saved);
  }
  if (!county) return NextResponse.json({ weather: null });

  const [periods, air] = await Promise.all([countyForecast(county), countiesAir()]);
  const weather = periods
    ? buildTodayWeather({ county, periods, air: air.get(county) ?? null, conditions: profile?.chronic_conditions ?? [] })
    : null;
  if (!weather) return NextResponse.json({ error: "氣象署的資料暫時拿不到，等一下再試" }, { status: 502 });
  return NextResponse.json({ weather });
}
