// ────────────────────────────────────────────────
// 家人生日提醒
// GET  → { birthdays }（快到的排前面；每筆帶伺服器算好的下一次生日）
// POST { name, relation?, calendar, month, day, birthYear?, remind? } → { birthday }
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { blockedResponse } from "@/lib/plan-access-server";
import { BIRTHDAY_MAX, normalizeBirthdayInput } from "@/lib/birthdays";
import { BIRTHDAY_COLUMNS, birthdayRow, listBirthdays, toClientBirthday } from "@/lib/birthdays-server";

async function currentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  try {
    return NextResponse.json({ birthdays: await listBirthdays(createSupabaseAdmin(), user.id) });
  } catch (e) {
    console.warn("[api] birthdays GET (add-family-birthdays.sql 跑了嗎？):", e);
    return NextResponse.json({ error: "生日提醒還沒準備好" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { access } = await loadAsker(user.id, user.email);
  const blocked = blockedResponse(access, "birthday_reminder");
  if (blocked) return blocked;
  const parsed = normalizeBirthdayInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const admin = createSupabaseAdmin();
  const { count, error: countErr } = await admin.from("family_birthdays").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (countErr) {
    console.warn("[api] birthdays count:", countErr.message);
    return NextResponse.json({ error: "生日提醒還沒準備好" }, { status: 503 });
  }
  if ((count ?? 0) >= BIRTHDAY_MAX) {
    return NextResponse.json({ error: `最多記 ${BIRTHDAY_MAX} 個人的生日，先刪掉用不到的` }, { status: 429 });
  }
  const { data, error } = await admin
    .from("family_birthdays")
    .insert({ user_id: user.id, ...birthdayRow(parsed.value) })
    .select(BIRTHDAY_COLUMNS)
    .single();
  if (error || !data) {
    console.error("[api] birthdays POST:", error);
    return NextResponse.json({ error: "沒存成功，請再試一次" }, { status: 500 });
  }
  return NextResponse.json({ birthday: toClientBirthday(data as Record<string, unknown>) });
}
