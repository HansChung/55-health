// 家人生日提醒：改一筆（整筆重送，跟新增一樣檢查）、刪一筆
// PUT { name, relation?, calendar, month, day, birthYear?, remind? } → { birthday }；DELETE → { ok }
// 改了日期（或重新打開提醒）→ 提醒記號清掉，新的日子會再提醒
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { normalizeBirthdayInput } from "@/lib/birthdays";
import { BIRTHDAY_COLUMNS, birthdayRow, toClientBirthday } from "@/lib/birthdays-server";

const UUID = /^[0-9a-f-]{36}$/i;
const NOT_FOUND = "找不到這筆生日";

async function auth() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await auth();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const id = (await ctx.params).id;
  if (!UUID.test(id)) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  const parsed = normalizeBirthdayInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;
  const admin = createSupabaseAdmin();
  const { data: old, error: readErr } = await admin.from("family_birthdays").select("calendar, month, day, remind").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (readErr) {
    console.error("[api] birthdays PUT read:", readErr);
    return NextResponse.json({ error: "沒存成功，請再試一次" }, { status: 500 });
  }
  if (!old) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  const o = old as { calendar: string; month: number; day: number; remind: boolean };
  const moved = o.calendar !== v.calendar || o.month !== v.month || o.day !== v.day || (!o.remind && v.remind);
  const { data, error } = await admin
    .from("family_birthdays")
    .update({ ...birthdayRow(v), updated_at: new Date().toISOString(), ...(moved ? { reminded_ahead_on: null, reminded_day_on: null } : {}) })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(BIRTHDAY_COLUMNS)
    .maybeSingle();
  if (error) {
    console.error("[api] birthdays PUT:", error);
    return NextResponse.json({ error: "沒存成功，請再試一次" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  return NextResponse.json({ birthday: toClientBirthday(data as Record<string, unknown>) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await auth();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const id = (await ctx.params).id;
  if (!UUID.test(id)) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  const { data, error } = await createSupabaseAdmin().from("family_birthdays").delete().eq("id", id).eq("user_id", user.id).select("id");
  if (error) return NextResponse.json({ error: "刪除沒成功，請再試一次" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true });
}
