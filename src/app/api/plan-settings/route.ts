// ────────────────────────────────────────────────
// 前端用：目前的「方案與次數」設定＋自己的個別開通（哪些功能能用、入口要不要顯示、要升級到哪個方案）
// GET → { settings, grants, tier, services }；沒登入就給設定、不給開通
// services：要外部金鑰才能用的功能（沒設金鑰 → 入口不顯示）
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { getPlanSettings } from "@/lib/plan-access-server";
import { activeGrants } from "@/lib/plan-settings";
import { isWeatherConfigured } from "@/lib/weather-server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const services = { weather: isWeatherConfigured() };
  if (!user) return NextResponse.json({ settings: await getPlanSettings(), grants: [], tier: "free", services });
  const { access } = await loadAsker(user.id, user.email);
  return NextResponse.json({ settings: access.settings, grants: activeGrants(access.grants), tier: access.tier, services });
}
