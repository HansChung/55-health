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

  const { data: current, error: readErr } = await supabase
    .from("profiles").select("medications").eq("id", user.id).single();
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

  const { data, error } = await supabase
    .from("profiles")
    .update({ medications: next, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();
  if (error) {
    console.error("[api] medications update:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}
