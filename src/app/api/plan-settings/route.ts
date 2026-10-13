// ────────────────────────────────────────────────
// 前端用：目前的「方案與次數」設定＋自己的個別開通（哪些功能能用、入口要不要顯示、要升級到哪個方案）
// GET → { settings, grants, tier }；沒登入就給設定、不給開通
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { getPlanSettings } from "@/lib/plan-access-server";
import { activeGrants } from "@/lib/plan-settings";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ settings: await getPlanSettings(), grants: [], tier: "free" });
  const { access } = await loadAsker(user.id, user.email);
  return NextResponse.json({ settings: access.settings, grants: activeGrants(access.grants), tier: access.tier });
}
