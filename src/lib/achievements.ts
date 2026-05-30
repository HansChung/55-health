/**
 * 健康成就徽章定義 — 全部由現有資料即時計算，不需要 DB 表
 */

export interface AchievementDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
  category: "meal" | "exercise" | "metric" | "medication" | "voice" | "family" | "streak";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // 飲食類
  { id: "first_meal", emoji: "🍱", title: "踏出第一步", description: "完成第一筆餐點記錄", category: "meal" },
  { id: "10_meals", emoji: "🥗", title: "養成習慣", description: "累積 10 筆餐點", category: "meal" },
  { id: "50_meals", emoji: "🍲", title: "飲食達人", description: "累積 50 筆餐點", category: "meal" },
  { id: "100_meals", emoji: "👨‍🍳", title: "百餐紀錄", description: "累積 100 筆餐點", category: "meal" },

  // 連續打卡類
  { id: "streak_3", emoji: "🔥", title: "三日連勝", description: "連續 3 天有記錄", category: "streak" },
  { id: "streak_7", emoji: "🔥", title: "一週連勝", description: "連續 7 天有記錄", category: "streak" },
  { id: "streak_30", emoji: "🔥", title: "一月連勝", description: "連續 30 天有記錄", category: "streak" },
  { id: "streak_100", emoji: "👑", title: "百日連勝", description: "連續 100 天有記錄", category: "streak" },

  // 運動類
  { id: "first_exercise", emoji: "🚶", title: "動起來", description: "完成第一筆運動記錄", category: "exercise" },
  { id: "exercise_100min", emoji: "💪", title: "百分鐘", description: "累積運動 100 分鐘", category: "exercise" },
  { id: "exercise_500min", emoji: "🏃", title: "活力長者", description: "累積運動 500 分鐘", category: "exercise" },

  // 健康指標類
  { id: "first_metric", emoji: "🩺", title: "在意自己", description: "第一次記錄健康指標", category: "metric" },
  { id: "bp_7days", emoji: "❤️", title: "血壓週記", description: "7 天內量過血壓", category: "metric" },

  // 用藥
  { id: "first_prescription", emoji: "💊", title: "用藥管家", description: "第一次拍藥袋辨識", category: "medication" },

  // 語音
  { id: "first_voice", emoji: "🎙", title: "暖暖開口", description: "第一次跟暖暖語音聊天", category: "voice" },

  // 家人
  { id: "first_family", emoji: "👨‍👩‍👧", title: "家人陪伴", description: "邀請第一位家人", category: "family" },
];

export interface AchievementProgress {
  achievement: AchievementDef;
  unlocked: boolean;
  /** 已完成的百分比 0-100（用來顯示進度條） */
  progress: number;
  /** 給用戶看的進度文字，例如 "8/10 餐" */
  progress_text?: string;
}

export interface UserStats {
  total_meals: number;
  meal_streak: number;        // 連續有記錄餐點的天數（今天可選）
  longest_meal_streak: number;
  total_exercise_minutes: number;
  total_exercises: number;
  total_metrics: number;
  bp_records_last_7days: number;
  prescription_scans: number;  // 透過 medications 含 added_at 估算
  voice_sessions: number;       // 透過 conversations 不重複 session 數
  family_count: number;
}

/** 從用戶 stats 算出每個成就的進度 */
export function computeAchievementProgress(stats: UserStats): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => {
    const { progress, progress_text, unlocked } = evalAchievement(a, stats);
    return { achievement: a, progress, progress_text, unlocked };
  });
}

function evalAchievement(
  a: AchievementDef,
  s: UserStats
): { progress: number; progress_text?: string; unlocked: boolean } {
  switch (a.id) {
    case "first_meal":
      return done(s.total_meals >= 1, s.total_meals, 1, "餐");
    case "10_meals":
      return done(s.total_meals >= 10, s.total_meals, 10, "餐");
    case "50_meals":
      return done(s.total_meals >= 50, s.total_meals, 50, "餐");
    case "100_meals":
      return done(s.total_meals >= 100, s.total_meals, 100, "餐");

    case "streak_3":
      return done(s.longest_meal_streak >= 3, Math.min(s.meal_streak, 3), 3, "天");
    case "streak_7":
      return done(s.longest_meal_streak >= 7, Math.min(s.meal_streak, 7), 7, "天");
    case "streak_30":
      return done(s.longest_meal_streak >= 30, Math.min(s.meal_streak, 30), 30, "天");
    case "streak_100":
      return done(s.longest_meal_streak >= 100, Math.min(s.meal_streak, 100), 100, "天");

    case "first_exercise":
      return done(s.total_exercises >= 1, s.total_exercises, 1, "次");
    case "exercise_100min":
      return done(s.total_exercise_minutes >= 100, s.total_exercise_minutes, 100, "分");
    case "exercise_500min":
      return done(s.total_exercise_minutes >= 500, s.total_exercise_minutes, 500, "分");

    case "first_metric":
      return done(s.total_metrics >= 1, s.total_metrics, 1, "次");
    case "bp_7days":
      return done(s.bp_records_last_7days >= 7, s.bp_records_last_7days, 7, "次");

    case "first_prescription":
      return done(s.prescription_scans >= 1, s.prescription_scans, 1, "次");

    case "first_voice":
      return done(s.voice_sessions >= 1, s.voice_sessions, 1, "次");

    case "first_family":
      return done(s.family_count >= 1, s.family_count, 1, "位");

    default:
      return { progress: 0, unlocked: false };
  }
}

function done(unlocked: boolean, current: number, target: number, unit: string) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return {
    progress: pct,
    progress_text: `${Math.min(current, target)}/${target} ${unit}`,
    unlocked,
  };
}

/**
 * 從帶日期的記錄陣列算「最長連續天數」與「目前連續天數」
 * dates: ISO 字串陣列（已過濾出該用戶的紀錄）
 */
export function computeStreaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  // 取每天一筆（用日期 YYYY-MM-DD key）
  const uniqueDays = Array.from(
    new Set(dates.map((d) => new Date(d).toISOString().substring(0, 10)))
  ).sort();

  let longest = 1;
  let runningStreak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const cur = new Date(uniqueDays[i]);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      runningStreak++;
      if (runningStreak > longest) longest = runningStreak;
    } else {
      runningStreak = 1;
    }
  }

  // 目前連續：從最後一天往回算（包含今天或昨天才算「目前」）
  const today = new Date().toISOString().substring(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
  const lastDay = uniqueDays[uniqueDays.length - 1];

  let current = 0;
  if (lastDay === today || lastDay === yesterday) {
    current = 1;
    for (let i = uniqueDays.length - 2; i >= 0; i--) {
      const cur = new Date(uniqueDays[i + 1]);
      const prev = new Date(uniqueDays[i]);
      const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) current++;
      else break;
    }
  }

  return { current, longest };
}
