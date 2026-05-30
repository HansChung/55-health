import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { computeAchievementProgress, computeStreaks, type UserStats } from "@/lib/achievements";

/** GET：算當前用戶的成就進度 + streak */
export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  // 1. 餐點：拿所有 eaten_at 計算 streak + 總數
  const { data: meals } = await supabase
    .from("meals")
    .select("eaten_at")
    .eq("user_id", user.id)
    .order("eaten_at", { ascending: true });

  const totalMeals = meals?.length ?? 0;
  const { current: mealStreak, longest: longestMealStreak } = computeStreaks(
    (meals ?? []).map((m: { eaten_at: string }) => m.eaten_at)
  );

  // 2. 運動：總筆數 + 總分鐘
  const { data: exercises } = await supabase
    .from("exercises")
    .select("minutes")
    .eq("user_id", user.id);
  const totalExercises = exercises?.length ?? 0;
  const totalExerciseMinutes = (exercises ?? []).reduce(
    (s: number, e: { minutes: number }) => s + (e.minutes ?? 0),
    0
  );

  // 3. 健康指標：總筆數 + 過去 7 天血壓筆數
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const { data: metrics } = await supabase
    .from("health_metrics")
    .select("metric_type, measured_at")
    .eq("user_id", user.id);
  const totalMetrics = metrics?.length ?? 0;
  const bpLast7 = (metrics ?? []).filter(
    (m: { metric_type: string; measured_at: string }) =>
      m.metric_type === "blood_pressure" && new Date(m.measured_at) >= since7
  ).length;

  // 4. 用藥拍照：用 profile.medications 含 added_at 推估
  const { data: profile } = await supabase
    .from("profiles")
    .select("medications")
    .eq("id", user.id)
    .single();
  const meds = (profile?.medications as { added_at?: string }[]) ?? [];
  const prescriptionScans = meds.filter((m) => !!m.added_at).length;

  // 5. 語音對話：算不重複 session_id
  const { data: convs } = await supabase
    .from("conversations")
    .select("session_id")
    .eq("user_id", user.id);
  const voiceSessions = new Set(
    (convs ?? []).map((c: { session_id: string | null }) => c.session_id).filter(Boolean)
  ).size;

  // 6. 家人數
  const { data: family } = await supabase
    .from("family_links")
    .select("id")
    .eq("owner_id", user.id);
  const familyCount = family?.length ?? 0;

  const stats: UserStats = {
    total_meals: totalMeals,
    meal_streak: mealStreak,
    longest_meal_streak: longestMealStreak,
    total_exercise_minutes: totalExerciseMinutes,
    total_exercises: totalExercises,
    total_metrics: totalMetrics,
    bp_records_last_7days: bpLast7,
    prescription_scans: prescriptionScans,
    voice_sessions: voiceSessions,
    family_count: familyCount,
  };

  const achievements = computeAchievementProgress(stats);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return NextResponse.json({
    stats,
    achievements,
    unlocked_count: unlockedCount,
    total_count: achievements.length,
  });
}
