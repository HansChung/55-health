// ────────────────────────────────────────────────
// 用藥清單的單一動作：伺服器讀最新的清單再改，不用手機上可能過期的那份整包蓋回去
// POST { action: "take", name, added_at?, time? }  → 標記這一次吃了（time 不給＝今天全部）
// POST { action: "add", medications: [...] }       → 把拍藥袋讀到的藥接在後面
// → { profile }
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { MedicationListSchema } from "@/lib/medication-schema";
import { markDoseTaken, sameMedication } from "@/lib/medication-utils";
import type { ProfileMedication } from "@/lib/api-client";

const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("take"),
    name: z.string().max(200),
    added_at: z.string().max(40).optional(),
    time: z.string().max(10).optional(),
  }),
  z.object({ action: z.literal("add"), medications: MedicationListSchema.min(1) }),
]);

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  const body = parsed.data;

  // 讀最新清單 → 改 → 只有在這段時間沒人改過（updated_at 沒變）才寫回；被搶先就重讀再做一次
  // （同時按兩個「已吃」、兩支手機同時按，兩次都會留下來，不會互相蓋掉）
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: current, error: readErr } = await supabase
      .from("profiles").select("medications, updated_at").eq("id", user.id).single();
    if (readErr) {
      console.error("[api] medications read:", readErr);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    const meds = (Array.isArray(current?.medications) ? current.medications : []) as ProfileMedication[];

    let next: ProfileMedication[];
    if (body.action === "take") {
      const target = { name: body.name, added_at: body.added_at };
      if (!meds.some((m) => sameMedication(m, target))) {
        return NextResponse.json({ error: "找不到這個藥，可能已經從清單刪掉了" }, { status: 404 });
      }
      next = meds.map((m) => (sameMedication(m, target) ? markDoseTaken(m, body.time ?? null) : m));
    } else {
      next = [...meds, ...body.medications].slice(0, 50);
    }

    const prev = (current?.updated_at as string | null) ?? null;
    // 新的 updated_at 一定要比舊的晚（時鐘差一點也不會寫出一樣的值）
    const stamp = new Date(Math.max(Date.now(), prev ? new Date(prev).getTime() + 1 : 0)).toISOString();
    const update = supabase
      .from("profiles")
      .update({ medications: next, updated_at: stamp })
      .eq("id", user.id);
    const { data, error } = await (prev === null ? update.is("updated_at", null) : update.eq("updated_at", prev))
      .select()
      .maybeSingle();
    if (error) {
      console.error("[api] medications update:", error);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (data) return NextResponse.json({ profile: data });
  }
  return NextResponse.json({ error: "現在有點忙，請再按一次" }, { status: 409 });
}
