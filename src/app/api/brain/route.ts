// ────────────────────────────────────────────────
// 腦力小遊戲
// GET  → { stats }（今天玩了沒、連續天數、累積天數）
// POST { kind, correct } → { stats, first }：今天的每日一題作答（一天只記第一次；題目在前端用日期算，跟伺服器一樣）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { dailyKind, taipeiDay } from "@/lib/brain-games";
import { loadBrainStats } from "@/lib/brain-games-server";

const Schema = z.object({ kind: z.string().max(20), correct: z.boolean() });

async function currentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  try {
    return NextResponse.json({ stats: await loadBrainStats(createSupabaseAdmin(), user.id) });
  } catch (e) {
    console.warn("[api] brain GET (add-brain-games.sql 跑了嗎？):", e);
    return NextResponse.json({ error: "動動腦還沒準備好" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "格式不對" }, { status: 400 });
  const day = taipeiDay();
  // 題型以伺服器的日期為準（半夜跨日送出就記成今天那一題的種類）
  const kind = dailyKind(day);
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("brain_game_plays")
    .upsert({ user_id: user.id, day, kind, correct: parsed.data.correct }, { onConflict: "user_id,day", ignoreDuplicates: true })
    .select("day");
  if (error) {
    console.error("[api] brain POST:", error);
    return NextResponse.json({ error: "沒記到，請再試一次" }, { status: 500 });
  }
  try {
    return NextResponse.json({ stats: await loadBrainStats(admin, user.id), first: ((data ?? []) as unknown[]).length > 0 });
  } catch {
    return NextResponse.json({ error: "沒記到，請再試一次" }, { status: 500 });
  }
}
