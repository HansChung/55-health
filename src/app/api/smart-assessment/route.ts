// ────────────────────────────────────────────────
// SMART RADAR / SHI 檢測 API
// GET  → 歷史 + insights + nextQuiz（完整測／智慧複測）
// POST → 提交答案（完整 15 題或智慧短測）→ 存檔 → insights
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import {
  buildQuizPlan,
  buildSmartInsights,
  computeScoresFromResponses,
  computeSHI,
  extractAskedIds,
  normalizeAnswerMap,
  QUESTION_BY_ID,
  type QuizMode,
  type SmartScores,
  type SmartSignals,
  type StoredAnswers,
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
  answers: unknown;
  created_at: string;
};

function toScores(
  a: Pick<AssessmentRow, "score_s" | "score_m" | "score_a" | "score_r" | "score_t">
): SmartScores {
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

function recentAskedFromHistory(assessments: AssessmentRow[]): number[] {
  const ids: number[] = [];
  for (const row of assessments.slice(0, 2)) {
    ids.push(...extractAskedIds(row.answers));
  }
  return ids;
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
  const latestScores = assessments[0] ? toScores(assessments[0]) : null;

  if (assessments.length > 0) {
    previous = assessments[1] ? toScores(assessments[1]) : null;
    const signals = await loadSignals(supabase, user.id);
    insights = buildSmartInsights(latestScores!, previous, signals);
  }

  const nextQuiz = buildQuizPlan({
    previousScores: latestScores,
    recentAskedIds: recentAskedFromHistory(assessments),
    seed: user.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + assessments.length * 17,
  });

  return NextResponse.json({ assessments, insights, previous, nextQuiz });
}

const LegacyPostSchema = z.object({
  answers: z.array(z.number().int().min(1).max(5)).length(15),
});

const QuizPostSchema = z.object({
  mode: z.enum(["full", "quick"]),
  responses: z
    .array(
      z.object({
        id: z.number().int().positive(),
        value: z.number().int().min(1).max(5),
      })
    )
    .min(5)
    .max(15),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  let mode: QuizMode;
  let responseMap: Record<number, number>;

  const quizParsed = QuizPostSchema.safeParse(raw);
  const legacyParsed = LegacyPostSchema.safeParse(raw);

  if (quizParsed.success) {
    mode = quizParsed.data.mode;
    responseMap = {};
    for (const r of quizParsed.data.responses) {
      if (!QUESTION_BY_ID[r.id]) {
        return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
      }
      responseMap[r.id] = r.value;
    }
    if (mode === "full" && Object.keys(responseMap).length !== 15) {
      return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
    }
  } else if (legacyParsed.success) {
    mode = "full";
    responseMap = normalizeAnswerMap(legacyParsed.data.answers);
  } else {
    console.error("[api] 格式錯誤:", quizParsed.error ?? legacyParsed.error);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  // 取上一次完整五軸
  const { data: prevRows } = await supabase
    .from("smart_assessments")
    .select("shi, score_s, score_m, score_a, score_r, score_t")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const prevRow = prevRows?.[0] ?? null;
  const previous: SmartScores | null = prevRow ? toScores(prevRow) : null;
  const prevShi = prevRow?.shi ?? null;

  // 複測：沒答到的構面沿用上次；完整測：只依本次答案
  const scores = computeScoresFromResponses(
    responseMap,
    mode === "quick" ? previous : null
  );
  const shi = computeSHI(scores);

  const stored: StoredAnswers = {
    mode,
    responses: Object.fromEntries(
      Object.entries(responseMap).map(([k, v]) => [String(k), v])
    ),
  };

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
      answers: stored,
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
    mode,
  });
}
