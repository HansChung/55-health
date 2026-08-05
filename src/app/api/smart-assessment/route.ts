// ────────────────────────────────────────────────
// SMART RADAR / SHI 檢測 API
// GET  → 歷史記錄（新到舊）+ 最新一筆 insights
// POST → 提交 15 題答案 → 伺服器計算分數 → 存檔 → 回傳 insights／上次五軸
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import {
  buildSmartInsights,
  computeDimensionScores,
  computeSHI,
  QUESTIONS,
  type SmartScores,
  type SmartSignals,
} from "@/lib/smart";

type AssessmentRow = {
  id: string;
  user_id: string;
  score_s: number;
  score_m: number;
  score_a: number;
  score_r: number;
  score_t: number;
  shi: number;
  answers: number[];
  created_at: string;
};

function toScores(a: Pick<AssessmentRow, "score_s" | "score_m" | "score_a" | "score_r" | "score_t">): SmartScores {
  return { S: a.score_s, M: a.score_m, A: a.score_a, R: a.score_r, T: a.score_t };
}

/** 組裝近 7 日 App 行為訊號（失敗時給安全預設，不阻斷檢測） */
async function loadSignals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<SmartSignals> {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const empty: SmartSignals = {
    mealDaysLast7: 0,
    exerciseCountLast7: 0,
    hasAcceptedFamily: false,
    hasMetricsLast7: false,
  };

  try {
    const [mealsRes, exercisesRes, familyRes, metricsRes] = await Promise.all([
      supabase
        .from("meals")
        .select("eaten_at")
        .eq("user_id", userId)
        .gte("eaten_at", since),
      supabase
        .from("exercises")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("performed_at", since),
      supabase
        .from("family_links")
        .select("id")
        .eq("owner_id", userId)
        .eq("status", "accepted")
        .limit(1),
      supabase
        .from("health_metrics")
        .select("id")
        .eq("user_id", userId)
        .gte("measured_at", since)
        .limit(1),
    ]);

    const mealDays = new Set(
      ((mealsRes.data ?? []) as { eaten_at: string }[]).map((m) =>
        // 用台灣時間（UTC+8）算「記錄天數」
        new Date(new Date(m.eaten_at).getTime() + 8 * 3600 * 1000)
          .toISOString()
          .substring(0, 10)
      )
    );

    return {
      mealDaysLast7: mealDays.size,
      exerciseCountLast7: exercisesRes.count ?? 0,
      hasAcceptedFamily: (familyRes.data ?? []).length > 0,
      hasMetricsLast7: (metricsRes.data ?? []).length > 0,
    };
  } catch (e) {
    console.error("[smart-assessment] signals load failed:", e);
    return empty;
  }
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("smart_assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    console.error("[api] DB error:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  const assessments = (data ?? []) as AssessmentRow[];
  let insights = null;
  let previous: SmartScores | null = null;

  if (assessments.length > 0) {
    const latest = assessments[0];
    previous = assessments[1] ? toScores(assessments[1]) : null;
    const signals = await loadSignals(supabase, user.id);
    insights = buildSmartInsights(toScores(latest), previous, signals);
  }

  return NextResponse.json({ assessments, insights, previous });
}

const PostSchema = z.object({
  // 15 個 1-5 的答案（依題目順序）
  answers: z.array(z.number().int().min(1).max(5)).length(QUESTIONS.length),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const scores = computeDimensionScores(body.answers);
  const shi = computeSHI(scores);

  // 取上一次完整五軸（算進步幅度 + 雷達對比）
  const { data: prevRows } = await supabase
    .from("smart_assessments")
    .select("shi, score_s, score_m, score_a, score_r, score_t")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const prevRow = prevRows?.[0] ?? null;
  const previous: SmartScores | null = prevRow ? toScores(prevRow) : null;
  const prevShi = prevRow?.shi ?? null;

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

  if (error) {
    console.error("[api] DB error:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  const signals = await loadSignals(supabase, user.id);
  const insights = buildSmartInsights(scores, previous, signals);

  return NextResponse.json({
    assessment: data,
    previous_shi: prevShi,
    previous,
    delta: prevShi != null ? shi - prevShi : null,
    insights,
  });
}
