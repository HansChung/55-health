// ────────────────────────────────────────────────
// SMART RADAR 五大構面 + SHI 智慧幸福指數
// 共用定義（API 伺服器端 + 前端畫面都用這份）
// ────────────────────────────────────────────────

export type SmartDimension = "S" | "M" | "A" | "R" | "T";

export interface DimensionMeta {
  key: SmartDimension;
  en: string;
  label: string; // 中文構面名
  color: string;
  desc: string;
}

export const DIMENSIONS: DimensionMeta[] = [
  { key: "S", en: "Sharing", label: "社會連結", color: "#E8845A", desc: "與他人的連結與分享" },
  { key: "M", en: "Meaning", label: "生命意義", color: "#D9A441", desc: "生活的目標與成長" },
  { key: "A", en: "Agency", label: "自主動力", color: "#7AA779", desc: "自我掌控與行動力" },
  { key: "R", en: "Resilience", label: "身心韌性", color: "#5BA0C9", desc: "面對壓力的調適力" },
  { key: "T", en: "Trust & Tech", label: "科技運用", color: "#C95B6E", desc: "對科技的運用與信任" },
];

export interface SmartQuestion {
  id: number;
  dim: SmartDimension;
  text: string;
}

// 每個構面 3 題，共 15 題，1-5 同意程度（1 非常不同意 ～ 5 非常同意）
export const QUESTIONS: SmartQuestion[] = [
  // S 社會連結與分享
  { id: 1, dim: "S", text: "我經常和家人或朋友聯絡、互動。" },
  { id: 2, dim: "S", text: "我願意把自己的經驗或想法分享給別人。" },
  { id: 3, dim: "S", text: "我覺得自己在家庭或群體中是被需要的。" },
  // M 生命意義與成長
  { id: 4, dim: "M", text: "我覺得每天的生活是有目標、有意義的。" },
  { id: 5, dim: "M", text: "我持續在學習新事物或培養興趣。" },
  { id: 6, dim: "M", text: "我對未來的生活感到期待。" },
  // A 自主掌控動力
  { id: 7, dim: "A", text: "我能自己安排和決定每天的生活。" },
  { id: 8, dim: "A", text: "遇到生活中的問題，我有能力處理。" },
  { id: 9, dim: "A", text: "我會主動為自己的健康做計畫（如飲食、運動）。" },
  // R 身心韌性
  { id: 10, dim: "R", text: "遇到挫折或壓力時，我能慢慢調適過來。" },
  { id: 11, dim: "R", text: "我的睡眠和體力大致良好。" },
  { id: 12, dim: "R", text: "我的情緒大多是平穩、愉快的。" },
  // T 科技運用與信任
  { id: 13, dim: "T", text: "我能自在地使用手機或 App 處理生活事務。" },
  { id: 14, dim: "T", text: "我願意嘗試新的科技工具。" },
  { id: 15, dim: "T", text: "我相信科技能讓我的生活更方便。" },
];

export const LIKERT_LABELS = [
  "非常不同意",
  "不太同意",
  "普通",
  "還算同意",
  "非常同意",
];

export interface SmartScores {
  S: number;
  M: number;
  A: number;
  R: number;
  T: number;
}

/**
 * 把 15 題答案（1-5）換算成五構面分數（0-100）
 * answers 以 question id 為 key，或長度 15 的陣列（index 0 = q1）
 */
export function computeDimensionScores(
  answers: Record<number, number> | number[]
): SmartScores {
  const get = (id: number): number => {
    const v = Array.isArray(answers) ? answers[id - 1] : answers[id];
    return typeof v === "number" ? v : 0;
  };

  const scores: SmartScores = { S: 0, M: 0, A: 0, R: 0, T: 0 };
  for (const dim of ["S", "M", "A", "R", "T"] as SmartDimension[]) {
    const qs = QUESTIONS.filter((q) => q.dim === dim);
    const sum = qs.reduce((acc, q) => acc + clampLikert(get(q.id)), 0);
    const avg = sum / qs.length; // 1-5
    // 1→0, 3→50, 5→100
    scores[dim] = Math.round(((avg - 1) / 4) * 100);
  }
  return scores;
}

/** SHI 智慧幸福指數 = 五構面平均（0-100） */
export function computeSHI(scores: SmartScores): number {
  const vals = [scores.S, scores.M, scores.A, scores.R, scores.T];
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** 找出最弱的構面（給「建議優先改善」用） */
export function weakestDimension(scores: SmartScores): DimensionMeta {
  let weakest = DIMENSIONS[0];
  let min = Infinity;
  for (const d of DIMENSIONS) {
    if (scores[d.key] < min) {
      min = scores[d.key];
      weakest = d;
    }
  }
  return weakest;
}

/** SHI 分數的文字評語 */
export function shiVerdict(shi: number): { label: string; color: string } {
  if (shi >= 80) return { label: "非常好", color: "#7AA779" };
  if (shi >= 65) return { label: "良好", color: "#D9A441" };
  if (shi >= 50) return { label: "普通", color: "#E8845A" };
  return { label: "需要關注", color: "#C95B6E" };
}

function clampLikert(v: number): number {
  if (v < 1) return 1;
  if (v > 5) return 5;
  return v;
}
