// ────────────────────────────────────────────────
// 每日平安打卡
// GET  → { checkedAt }（今天報過平安的時間，沒有是 null）
// POST → { checkedAt, first }：按「我今天很好」（今天第一次按才記；已經通知過家人的話，回應之後再告訴家人報平安了）
// 設定（幾點前沒按要通知家人）存在 profiles.notification_settings.daily_checkin，用原本的個人資料 API 改
// ────────────────────────────────────────────────
import { NextResponse, after } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { notifyFamilyRelieved, recordCheckin, todayCheckin } from "@/lib/daily-checkin-server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  return NextResponse.json({ checkedAt: await todayCheckin(createSupabaseAdmin(), user.id) });
}

export async function POST() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  const now = new Date();
  try {
    const result = await recordCheckin(admin, user.id, now);
    if (result.first) {
      after(() => notifyFamilyRelieved(admin, user.id, result.checkedAt, now).catch((e) => console.warn("[checkin] relieved:", e)));
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api] checkin:", e);
    return NextResponse.json({ error: "沒記到，請再按一次" }, { status: 500 });
  }
}
