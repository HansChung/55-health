// ────────────────────────────────────────────────
// SMART RADAR / SHI 檢測 API
// GET  → 歷史記錄（新到舊）
// POST → 提交 15 題答案 → 伺服器計算分數 → 存檔 → 回傳含上次分數（算進步幅度）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import { computeDimensionScores, computeSHI, QUESTIONS } from "@/lib/smart";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("smart_assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assessments: data });
}

const PostSchema = z.object({
  // 15 個 1-5 的答案（依題目順序）
  answers: z.array(z.number().int().min(1).max(5)).length(QUESTIONS.length),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤", detail: String(e) }, { status: 400 });
  }

  const scores = computeDimensionScores(body.answers);
  const shi = computeSHI(scores);

  // 取上一次 SHI 算進步幅度
  const { data: prevRows } = await supabase
    .from("smart_assessments")
    .select("shi")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const prevShi = prevRows?.[0]?.shi ?? null;

  const { data, error } = await supabase
    .from("smart_assessments")
    .insert({
      user_id: user.id,
      score_s: scores.S,
      score_m: scores.M,
      score_a: scores.A,
      score_r: scores.R,
      score_t: scores.T,
      shi,
      answers: body.answers,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    assessment: data,
    previous_shi: prevShi,
    delta: prevShi != null ? shi - prevShi : null,
  });
}
