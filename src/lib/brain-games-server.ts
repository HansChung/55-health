// 腦力小遊戲（只在 API route 用；service role）
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { brainStreak, taipeiDay } from "@/lib/brain-games";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export interface BrainStats {
  today: { day: string; played: boolean; correct: boolean | null };
  streak: number;
  longest: number;
  days: number;
  correctDays: number;
}

/** 自己的紀錄整理成統計；讀不到（還沒跑 SQL）就丟錯 */
export async function loadBrainStats(admin: Admin, userId: string, now = new Date()): Promise<BrainStats> {
  const { data, error } = await admin.from("brain_game_plays").select("day, correct").eq("user_id", userId).order("day", { ascending: true }).limit(5000);
  if (error) throw new Error(`load brain plays failed: ${error.message}`);
  const rows = (data ?? []) as { day: string; correct: boolean }[];
  const today = taipeiDay(now);
  const todayRow = rows.find((r) => r.day === today);
  const { current, longest } = brainStreak(rows.map((r) => r.day), today);
  return {
    today: { day: today, played: Boolean(todayRow), correct: todayRow ? todayRow.correct : null },
    streak: current,
    longest,
    days: rows.length,
    correctDays: rows.filter((r) => r.correct).length,
  };
}
