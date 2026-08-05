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

export type QuizMode = "full" | "quick";

export interface QuizPlan {
  mode: QuizMode;
  questions: SmartQuestion[];
  focusDims: SmartDimension[];
  estimatedMinutes: number;
  title: string;
  subtitle: string;
}

export interface StoredAnswers {
  mode: QuizMode;
  responses: Record<string, number>; // questionId → 1-5
}

/** 完整題庫：每構面 6 題（前 3 題為首次完整測固定題） */
export const QUESTIONS: SmartQuestion[] = [
  // S 社會連結與分享
  { id: 1, dim: "S", text: "我經常和家人或朋友聯絡、互動。" },
  { id: 2, dim: "S", text: "我願意把自己的經驗或想法分享給別人。" },
  { id: 3, dim: "S", text: "我覺得自己在家庭或群體中是被需要的。" },
  { id: 16, dim: "S", text: "這週我有跟關心的人聊過天或見一面。" },
  { id: 17, dim: "S", text: "有事時，我知道可以找誰商量或幫忙。" },
  { id: 18, dim: "S", text: "跟別人相處時，我大多感到自在、被接納。" },
  // M 生命意義與成長
  { id: 4, dim: "M", text: "我覺得每天的生活是有目標、有意義的。" },
  { id: 5, dim: "M", text: "我持續在學習新事物或培養興趣。" },
  { id: 6, dim: "M", text: "我對未來的生活感到期待。" },
  { id: 19, dim: "M", text: "這陣子有事情讓我覺得「今天過得值得」。" },
  { id: 20, dim: "M", text: "我會為自己安排喜歡的活動或小目標。" },
  { id: 21, dim: "M", text: "回想這一年，我覺得自己有成長或改變。" },
  // A 自主掌控動力
  { id: 7, dim: "A", text: "我能自己安排和決定每天的生活。" },
  { id: 8, dim: "A", text: "遇到生活中的問題，我有能力處理。" },
  { id: 9, dim: "A", text: "我會主動為自己的健康做計畫（如飲食、運動）。" },
  { id: 22, dim: "A", text: "今天或這週，我有主動完成一件對自己好的事。" },
  { id: 23, dim: "A", text: "面對選擇時，我多半能做出決定，而不是一直猶豫。" },
  { id: 24, dim: "A", text: "我會為自己的飲食或作息做小小的調整。" },
  // R 身心韌性
  { id: 10, dim: "R", text: "遇到挫折或壓力時，我能慢慢調適過來。" },
  { id: 11, dim: "R", text: "我的睡眠和體力大致良好。" },
  { id: 12, dim: "R", text: "我的情緒大多是平穩、愉快的。" },
  { id: 25, dim: "R", text: "累的時候，我知道怎麼讓自己休息一下。" },
  { id: 26, dim: "R", text: "這陣子身體狀況大致讓我放心。" },
  { id: 27, dim: "R", text: "心情不好時，我有方法讓自己慢慢好一點。" },
  // T 科技運用與信任
  { id: 13, dim: "T", text: "我能自在地使用手機或 App 處理生活事務。" },
  { id: 14, dim: "T", text: "我願意嘗試新的科技工具。" },
  { id: 15, dim: "T", text: "我相信科技能讓我的生活更方便。" },
  { id: 28, dim: "T", text: "用手機查資料、傳訊息或看健康資訊，對我來說不困難。" },
  { id: 29, dim: "T", text: "有人教一次之後，我願意再自己試用 App。" },
  { id: 30, dim: "T", text: "我覺得科技可以幫我照顧健康、連結家人。" },
];

/** 首次完整測固定 15 題（每構面前 3 題） */
export const CORE_QUESTION_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

export const QUESTION_BY_ID: Record<number, SmartQuestion> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q])
);

export function questionsForDimension(dim: SmartDimension): SmartQuestion[] {
  return QUESTIONS.filter((q) => q.dim === dim);
}

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

/** App 近期行為訊號（由 API 組裝，給個人化建議用） */
export interface SmartSignals {
  mealDaysLast7: number;
  exerciseCountLast7: number;
  hasAcceptedFamily: boolean;
  hasMetricsLast7: boolean;
}

export type InsightCta =
  | "family"
  | "exercise"
  | "voice"
  | "camera"
  | "achievements"
  | "metrics";

export interface TipEntry {
  tip: string;
  cta: InsightCta;
  ctaLabel: string;
}

/** 每構面建議文案庫（長者口語、可執行） */
export const TIP_BANK: Record<SmartDimension, TipEntry[]> = {
  S: [
    {
      tip: "這週打一通電話或傳一則訊息給家人朋友，聊聊近況就很好。",
      cta: "family",
      ctaLabel: "可到首頁 → 家人共享",
    },
    {
      tip: "邀請一位家人一起看您的健康狀況，互相關心會更安心。",
      cta: "family",
      ctaLabel: "可到首頁 → 家人共享",
    },
  ],
  M: [
    {
      tip: "每天做一件小小的事（散步、看書、聽音樂），幫自己找到生活節奏。",
      cta: "achievements",
      ctaLabel: "可到首頁 → 健康成就",
    },
    {
      tip: "持續記錄飲食與活動，看自己一步步進步，會更有目標感。",
      cta: "achievements",
      ctaLabel: "可到首頁 → 健康成就",
    },
  ],
  A: [
    {
      tip: "今天先拍一餐飯記錄下來，從小行動開始掌握自己的健康。",
      cta: "camera",
      ctaLabel: "可到首頁 → 拍照記錄",
    },
    {
      tip: "替自己訂一個簡單目標，例如這週記錄三天飲食。",
      cta: "camera",
      ctaLabel: "可到首頁 → 拍照記錄",
    },
  ],
  R: [
    {
      tip: "今天記一筆走路或伸展，活動一下身體，心情也會跟著穩。",
      cta: "exercise",
      ctaLabel: "可到首頁 → 運動記錄",
    },
    {
      tip: "量一下血壓或體重，關心身體狀態，有變化就能早點發現。",
      cta: "metrics",
      ctaLabel: "可到首頁 → 健康指標",
    },
  ],
  T: [
    {
      tip: "試著跟暖暖說說話，用語音問飲食或健康問題，會越來越上手。",
      cta: "voice",
      ctaLabel: "可到首頁 → 語音對話",
    },
    {
      tip: "拍一張餐點照片讓 App 幫忙辨識，熟悉一次就會輕鬆很多。",
      cta: "camera",
      ctaLabel: "可到首頁 → 拍照記錄",
    },
  ],
};

export interface DimensionTip {
  key: SmartDimension;
  label: string;
  color: string;
  desc: string;
  score: number;
  delta: number | null;
  tip: string;
  cta: InsightCta;
  ctaLabel: string;
}

export interface SmartInsights {
  verdict: { label: string; color: string };
  shi: number;
  strength: DimensionMeta;
  focus: DimensionMeta;
  strengthNote: string;
  focusNote: string;
  personalizedNote: string;
  dimensionTips: DimensionTip[];
  deltas: SmartScores | null;
}

/** 正規化答案：舊格式 number[15]（對應 id 1–15）或 id→分數 map */
export function normalizeAnswerMap(
  answers: Record<number, number> | Record<string, number> | number[]
): Record<number, number> {
  if (Array.isArray(answers)) {
    const map: Record<number, number> = {};
    answers.forEach((v, i) => {
      if (typeof v === "number") map[i + 1] = v;
    });
    return map;
  }
  const map: Record<number, number> = {};
  for (const [k, v] of Object.entries(answers)) {
    const id = Number(k);
    if (Number.isFinite(id) && typeof v === "number") map[id] = v;
  }
  return map;
}

/**
 * 依已答題目算五構面分數。
 * 某構面沒答到 → 沿用 previous；沒有 previous 則 0。
 */
export function computeScoresFromResponses(
  responses: Record<number, number> | Record<string, number> | number[],
  previous?: SmartScores | null
): SmartScores {
  const map = normalizeAnswerMap(responses);
  const scores: SmartScores = previous
    ? { ...previous }
    : { S: 0, M: 0, A: 0, R: 0, T: 0 };

  for (const dim of ["S", "M", "A", "R", "T"] as SmartDimension[]) {
    const answered = questionsForDimension(dim).filter(
      (q) => typeof map[q.id] === "number" && map[q.id] >= 1
    );
    if (answered.length === 0) continue;
    const avg =
      answered.reduce((acc, q) => acc + clampLikert(map[q.id]), 0) / answered.length;
    // 1→0, 3→50, 5→100
    scores[dim] = Math.round(((avg - 1) / 4) * 100);
  }
  return scores;
}

/**
 * 把答案換算成五構面分數（0-100）
 * - number[15]：視為 id 1–15 的完整測（向後相容）
 * - Record：只平均有作答的題
 */
export function computeDimensionScores(
  answers: Record<number, number> | number[]
): SmartScores {
  return computeScoresFromResponses(answers, null);
}

/** 從歷史 answers 欄位抽出曾問過的題目 id */
export function extractAskedIds(answers: unknown): number[] {
  if (Array.isArray(answers)) {
    return answers.map((_, i) => i + 1);
  }
  if (answers && typeof answers === "object") {
    const obj = answers as { responses?: Record<string, number> };
    if (obj.responses && typeof obj.responses === "object") {
      return Object.keys(obj.responses).map(Number).filter(Number.isFinite);
    }
    // 純 id→value map
    return Object.keys(answers as object)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  return [];
}

/** 分數最低的 N 個構面（同分依 DIMENSIONS 順序） */
export function weakestDimensions(scores: SmartScores, n = 2): SmartDimension[] {
  return [...DIMENSIONS]
    .sort((a, b) => {
      const diff = scores[a.key] - scores[b.key];
      if (diff !== 0) return diff;
      return DIMENSIONS.findIndex((d) => d.key === a.key) -
        DIMENSIONS.findIndex((d) => d.key === b.key);
    })
    .slice(0, n)
    .map((d) => d.key);
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFromBank(
  dim: SmartDimension,
  count: number,
  avoid: Set<number>,
  rng: () => number
): SmartQuestion[] {
  const bank = questionsForDimension(dim);
  const fresh = bank.filter((q) => !avoid.has(q.id));
  const pool = fresh.length >= count ? fresh : bank;
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 出題計畫：
 * - 無上次分數 → 完整 15 題
 * - 有上次 → 智慧複測約 7 題（最弱 2 構面各 2 題，其餘各 1 題），題目輪替避開最近問過的
 */
export function buildQuizPlan(opts: {
  previousScores: SmartScores | null;
  recentAskedIds?: number[];
  seed?: number;
}): QuizPlan {
  const { previousScores, recentAskedIds = [], seed = Date.now() } = opts;
  const rng = mulberry32(seed);

  if (!previousScores) {
    const questions = CORE_QUESTION_IDS.map((id) => QUESTION_BY_ID[id]);
    return {
      mode: "full",
      questions,
      focusDims: [],
      estimatedMinutes: 3,
      title: "開始檢測",
      subtitle: "第一次完整檢測，約 15 題、3 分鐘",
    };
  }

  const focusDims = weakestDimensions(previousScores, 2);
  const focusSet = new Set(focusDims);
  const avoid = new Set(recentAskedIds);
  const picked: SmartQuestion[] = [];

  for (const d of DIMENSIONS) {
    const count = focusSet.has(d.key) ? 2 : 1;
    picked.push(...pickFromBank(d.key, count, avoid, rng));
  }

  const focusLabels = focusDims
    .map((k) => DIMENSIONS.find((d) => d.key === k)?.label)
    .filter(Boolean)
    .join("、");

  return {
    mode: "quick",
    questions: picked,
    focusDims,
    estimatedMinutes: 2,
    title: "智慧複測",
    subtitle: `針對上次較弱的「${focusLabels}」多關心一點，約 ${picked.length} 題、2 分鐘`,
  };
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

/** 找出最強的構面 */
export function strongestDimension(scores: SmartScores): DimensionMeta {
  let strongest = DIMENSIONS[0];
  let max = -Infinity;
  for (const d of DIMENSIONS) {
    if (scores[d.key] > max) {
      max = scores[d.key];
      strongest = d;
    }
  }
  return strongest;
}

/** 五軸分數差（本次 − 上次） */
export function dimensionDeltas(
  curr: SmartScores,
  prev: SmartScores | null | undefined
): SmartScores | null {
  if (!prev) return null;
  return {
    S: curr.S - prev.S,
    M: curr.M - prev.M,
    A: curr.A - prev.A,
    R: curr.R - prev.R,
    T: curr.T - prev.T,
  };
}

/** SHI 分數的文字評語 */
export function shiVerdict(shi: number): { label: string; color: string } {
  if (shi >= 80) return { label: "非常好", color: "#7AA779" };
  if (shi >= 65) return { label: "良好", color: "#D9A441" };
  if (shi >= 50) return { label: "普通", color: "#E8845A" };
  return { label: "需要關注", color: "#C95B6E" };
}

function pickTip(dim: SmartDimension, index = 0): TipEntry {
  const bank = TIP_BANK[dim];
  return bank[Math.min(index, bank.length - 1)] ?? bank[0];
}

/** 依焦點構面 + App 訊號，產出個人化焦點建議 */
export function personalizeFocusNote(
  focus: DimensionMeta,
  scores: SmartScores,
  signals?: SmartSignals | null
): string {
  const score = scores[focus.key];
  const base = `這是目前分數較低的面向（${score} 分）。`;

  if (!signals) {
    return `${base}${pickTip(focus.key, 0).tip}`;
  }

  if (focus.key === "S" && !signals.hasAcceptedFamily) {
    return `${base}先邀請一位家人一起關心，互相看得到狀況會更安心。`;
  }
  if (focus.key === "R" && signals.exerciseCountLast7 === 0) {
    return `${base}這週還沒有運動記錄，今天記一筆走路或伸展就很好。`;
  }
  if (focus.key === "R" && !signals.hasMetricsLast7) {
    return `${base}這週還沒量血壓或體重，記一筆健康指標，有變化能早點發現。`;
  }
  if (focus.key === "A" && signals.mealDaysLast7 < 3) {
    return `${base}這週飲食記錄還不多，今天先拍一餐，從小行動開始。`;
  }
  if (focus.key === "M" && signals.mealDaysLast7 < 2) {
    return `${base}持續記錄飲食幾天，看自己一步步進步，會更有目標感。`;
  }
  if (focus.key === "T" && signals.mealDaysLast7 === 0) {
    return `${base}先試一次拍照辨識餐點，熟悉一次就會輕鬆很多。`;
  }

  return `${base}${pickTip(focus.key, 0).tip}`;
}

/**
 * 結構化解讀：優勢／優先加強／五軸建議／個人化焦點
 * 規則式、不呼叫 LLM，伺服器與前端皆可重用。
 */
export function buildSmartInsights(
  scores: SmartScores,
  prev?: SmartScores | null,
  signals?: SmartSignals | null
): SmartInsights {
  const shi = computeSHI(scores);
  const verdict = shiVerdict(shi);
  const strength = strongestDimension(scores);
  const focus = weakestDimension(scores);
  const deltas = dimensionDeltas(scores, prev);

  const strengthNote = `您在「${strength.label}」表現最好（${scores[strength.key]} 分），這是很好的優勢，請繼續保持。`;
  const personalizedNote = personalizeFocusNote(focus, scores, signals);
  const focusTip = pickTip(focus.key, 0);
  const focusNote = personalizedNote;

  const dimensionTips: DimensionTip[] = DIMENSIONS.map((d, i) => {
    const tip = pickTip(d.key, i % TIP_BANK[d.key].length);
    // 焦點構面優先用個人化文案的 tip 段落（去掉分數前綴時仍附 cta）
    const isFocus = d.key === focus.key;
    return {
      key: d.key,
      label: d.label,
      color: d.color,
      desc: d.desc,
      score: scores[d.key],
      delta: deltas ? deltas[d.key] : null,
      tip: isFocus ? pickTip(d.key, 0).tip : tip.tip,
      cta: isFocus ? focusTip.cta : tip.cta,
      ctaLabel: isFocus ? focusTip.ctaLabel : tip.ctaLabel,
    };
  });

  // 依 signals 微調焦點構面的 tip／cta（與 personalizedNote 一致）
  if (signals) {
    const focusIdx = dimensionTips.findIndex((t) => t.key === focus.key);
    if (focusIdx >= 0) {
      const t = dimensionTips[focusIdx];
      if (focus.key === "S" && !signals.hasAcceptedFamily) {
        dimensionTips[focusIdx] = {
          ...t,
          tip: "先邀請一位家人一起關心，互相看得到狀況會更安心。",
          cta: "family",
          ctaLabel: "可到首頁 → 家人共享",
        };
      } else if (focus.key === "R" && signals.exerciseCountLast7 === 0) {
        dimensionTips[focusIdx] = {
          ...t,
          tip: "這週還沒有運動記錄，今天記一筆走路或伸展就很好。",
          cta: "exercise",
          ctaLabel: "可到首頁 → 運動記錄",
        };
      } else if (focus.key === "R" && !signals.hasMetricsLast7) {
        dimensionTips[focusIdx] = {
          ...t,
          tip: "這週還沒量血壓或體重，記一筆健康指標，有變化能早點發現。",
          cta: "metrics",
          ctaLabel: "可到首頁 → 健康指標",
        };
      } else if (focus.key === "A" && signals.mealDaysLast7 < 3) {
        dimensionTips[focusIdx] = {
          ...t,
          tip: "這週飲食記錄還不多，今天先拍一餐，從小行動開始。",
          cta: "camera",
          ctaLabel: "可到首頁 → 拍照記錄",
        };
      } else if (focus.key === "T" && signals.mealDaysLast7 === 0) {
        dimensionTips[focusIdx] = {
          ...t,
          tip: "先試一次拍照辨識餐點，熟悉一次就會輕鬆很多。",
          cta: "camera",
          ctaLabel: "可到首頁 → 拍照記錄",
        };
      }
    }
  }

  return {
    verdict,
    shi,
    strength,
    focus,
    strengthNote,
    focusNote,
    personalizedNote,
    dimensionTips,
    deltas,
  };
}

function clampLikert(v: number): number {
  if (v < 1) return 1;
  if (v > 5) return 5;
  return v;
}
