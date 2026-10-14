// ────────────────────────────────────────────────
// 腦力小遊戲（前後端共用，純計算，不靠 AI）
// 每日一題：同一天全台同一題（用日期當種子），題型每天輪流；練習題用亂數種子，不算連續天數
// 全部是選擇題（大按鈕），長輩不用打字
// ────────────────────────────────────────────────

export type BrainKind = "money" | "memory" | "odd" | "idiom" | "sequence";

export const BRAIN_KINDS: { id: BrainKind; label: string; emoji: string }[] = [
  { id: "money", label: "算錢", emoji: "💰" },
  { id: "memory", label: "記數字", emoji: "🔢" },
  { id: "odd", label: "找不同", emoji: "👀" },
  { id: "idiom", label: "成語填空", emoji: "📜" },
  { id: "sequence", label: "數字規律", emoji: "🧮" },
];

export interface BrainQuestion {
  kind: BrainKind;
  /** 題目（大字） */
  prompt: string;
  /** 記數字：先給看幾秒再藏起來的內容 */
  memorize?: string;
  options: string[];
  /** 正確答案在 options 的第幾個 */
  answer: number;
  /** 答完的說明 */
  explain: string;
}

/** 記數字給看幾秒 */
export const MEMORY_SECONDS = 5;

// ── 亂數（同一個種子永遠出同一題） ──

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const pick = <T,>(r: Rand, list: readonly T[]): T => list[Math.floor(r() * list.length)];

function shuffle<T>(r: Rand, list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 正確答案＋干擾選項 → 打亂、記下答案位置 */
function choices(r: Rand, correct: string, wrong: string[]): { options: string[]; answer: number } {
  const unique = [...new Set(wrong.filter((w) => w !== correct))].slice(0, 3);
  const options = shuffle(r, [correct, ...unique]);
  return { options, answer: options.indexOf(correct) };
}

// ── 題型 ──

const GOODS = [
  { name: "蘋果", unit: "顆" }, { name: "饅頭", unit: "個" }, { name: "豆漿", unit: "杯" },
  { name: "肉包", unit: "個" }, { name: "茶葉蛋", unit: "顆" }, { name: "香蕉", unit: "根" },
  { name: "飯糰", unit: "個" }, { name: "地瓜", unit: "條" },
] as const;

function money(r: Rand): BrainQuestion {
  const g = pick(r, GOODS);
  const qty = int(r, 2, 4);
  const price = int(r, 2, 9) * 5;
  const total = qty * price;
  const pay = total <= 100 ? 100 : 500;
  const change = pay - total;
  const { options, answer } = choices(r, `${change} 元`, [change - 5, change + 5, change - 10, change + 10, change + 15, change + 20].filter((n) => n > 0).map((n) => `${n} 元`));
  return {
    kind: "money",
    prompt: `${g.name}一${g.unit} ${price} 元，買 ${qty} ${g.unit}，給老闆 ${pay} 元，要找多少錢？`,
    options,
    answer,
    explain: `${price} × ${qty} = ${total} 元，${pay} − ${total} = ${change} 元`,
  };
}

function memory(r: Rand): BrainQuestion {
  const len = int(r, 4, 5);
  const digits = Array.from({ length: len }, () => int(r, 0, 9));
  // 第一個數字不要是 0（看起來比較像一個號碼）
  if (digits[0] === 0) digits[0] = int(r, 1, 9);
  const correct = digits.join("");
  const swap = (i: number) => {
    const d = [...digits];
    [d[i], d[i + 1]] = [d[i + 1], d[i]];
    return d.join("");
  };
  const change = (i: number) => {
    const d = [...digits];
    d[i] = (d[i] + int(r, 1, 8)) % 10;
    return d.join("");
  };
  // 像的號碼：換兩個相鄰數字、改一個數字（一樣的不算），湊滿 3 個
  const wrong = new Set<string>();
  for (let i = 0; wrong.size < 3 && i < 50; i++) {
    const w = i % 2 === 0 ? swap(int(r, 0, len - 2)) : change(int(r, 0, len - 1));
    if (w !== correct) wrong.add(w);
  }
  const { options, answer } = choices(r, correct, [...wrong]);
  return {
    kind: "memory",
    prompt: "剛剛看到的號碼是哪一個？",
    memorize: correct,
    options,
    answer,
    explain: `剛剛的號碼是 ${correct}。記號碼可以兩個兩個一組記，比較好記`,
  };
}

const ODD_PAIRS = [
  ["🍎", "🍏"], ["🐶", "🐱"], ["🌞", "🌝"], ["🚗", "🚕"], ["🌷", "🌹"], ["🐟", "🐠"],
  ["⚽", "🏀"], ["🍊", "🍋"], ["🐔", "🐤"], ["🌲", "🌳"], ["🍵", "☕"], ["🐢", "🐸"],
] as const;

function odd(r: Rand): BrainQuestion {
  const [common, different] = pick(r, ODD_PAIRS);
  const count = 6;
  const at = int(r, 0, count - 1);
  const options = Array.from({ length: count }, (_, i) => (i === at ? different : common));
  return {
    kind: "odd",
    prompt: "哪一個跟別人不一樣？點它",
    options,
    answer: at,
    explain: `第 ${at + 1} 個是 ${different}，其他都是 ${common}`,
  };
}

/** 常見成語：text、要挖掉第幾個字、干擾字、白話意思 */
const IDIOMS: { text: string; blank: number; wrong: string[]; meaning: string }[] = [
  { text: "一石二鳥", blank: 3, wrong: ["馬", "魚", "雞"], meaning: "做一件事得到兩個好處" },
  { text: "三心二意", blank: 2, wrong: ["一", "四", "五"], meaning: "心意不定，想東想西" },
  { text: "畫蛇添足", blank: 3, wrong: ["手", "腳", "頭"], meaning: "多做了反而壞事" },
  { text: "對牛彈琴", blank: 1, wrong: ["馬", "羊", "豬"], meaning: "講話不看對象" },
  { text: "半途而廢", blank: 1, wrong: ["路", "道", "中"], meaning: "做到一半就放棄" },
  { text: "守株待兔", blank: 3, wrong: ["鳥", "鹿", "鼠"], meaning: "不努力，只想等好運" },
  { text: "馬馬虎虎", blank: 2, wrong: ["牛", "狗", "貓"], meaning: "隨便、不認真" },
  { text: "七上八下", blank: 2, wrong: ["六", "九", "十"], meaning: "心裡很不安" },
  { text: "千鈞一髮", blank: 3, wrong: ["線", "絲", "毛"], meaning: "非常危險、很緊急" },
  { text: "井底之蛙", blank: 3, wrong: ["魚", "龜", "蛇"], meaning: "見識很少" },
  { text: "亡羊補牢", blank: 1, wrong: ["牛", "馬", "豬"], meaning: "出了問題趕快補救" },
  { text: "百聞不如一見", blank: 4, wrong: ["看", "聽", "說"], meaning: "聽很多次不如親眼看一次" },
  { text: "一舉兩得", blank: 2, wrong: ["三", "一", "四"], meaning: "一個動作得到兩個好處" },
  { text: "四面八方", blank: 2, wrong: ["六", "九", "十"], meaning: "到處、各個方向" },
  { text: "笑口常開", blank: 1, wrong: ["嘴", "手", "眼"], meaning: "常常開心地笑" },
  { text: "老當益壯", blank: 3, wrong: ["強", "健", "大"], meaning: "年紀大了更有精神" },
  { text: "活到老學到老", blank: 3, wrong: ["做", "玩", "看"], meaning: "一輩子都在學習" },
  { text: "眉開眼笑", blank: 2, wrong: ["嘴", "鼻", "臉"], meaning: "非常高興" },
  { text: "一帆風順", blank: 1, wrong: ["船", "路", "舟"], meaning: "事情都很順利" },
  { text: "如魚得水", blank: 1, wrong: ["鳥", "龍", "蝦"], meaning: "到了很適合自己的地方" },
  { text: "狐假虎威", blank: 2, wrong: ["獅", "狼", "熊"], meaning: "靠別人的勢力嚇人" },
  { text: "水滴石穿", blank: 2, wrong: ["山", "木", "鐵"], meaning: "持之以恆就能成功" },
  { text: "雪中送炭", blank: 3, wrong: ["米", "柴", "衣"], meaning: "在別人需要時幫忙" },
  { text: "錦上添花", blank: 3, wrong: ["草", "葉", "果"], meaning: "好上加好" },
  { text: "入鄉隨俗", blank: 1, wrong: ["城", "家", "國"], meaning: "到一個地方就照當地的習慣" },
  { text: "飲水思源", blank: 3, wrong: ["鄉", "親", "恩"], meaning: "不忘記別人的恩情" },
  { text: "同心協力", blank: 1, wrong: ["意", "手", "情"], meaning: "大家一起努力" },
  { text: "精益求精", blank: 2, wrong: ["要", "需", "追"], meaning: "好了還要更好" },
];

function idiom(r: Rand): BrainQuestion {
  const it = pick(r, IDIOMS);
  const chars = [...it.text];
  const correct = chars[it.blank];
  const shown = chars.map((c, i) => (i === it.blank ? "＿" : c)).join("");
  const { options, answer } = choices(r, correct, it.wrong);
  return {
    kind: "idiom",
    prompt: `「${shown}」空格要填哪個字？`,
    options,
    answer,
    explain: `${it.text}：${it.meaning}`,
  };
}

function sequence(r: Rand): BrainQuestion {
  const doubling = r() < 0.25;
  const start = doubling ? int(r, 1, 5) : int(r, 1, 20);
  const step = doubling ? 2 : int(r, 2, 9);
  const nums = Array.from({ length: 4 }, (_, i) => (doubling ? start * step ** i : start + step * i));
  const next = doubling ? nums[3] * step : nums[3] + step;
  const wrong = doubling ? [next - nums[3], next + start, nums[3] + nums[2], next + 2] : [next + 1, next - 1, next + step, next - 2, next + 2];
  const { options, answer } = choices(r, String(next), wrong.filter((n) => n > 0).map(String));
  return {
    kind: "sequence",
    prompt: `${nums.join("、")}、？　下一個是多少？`,
    options,
    answer,
    explain: doubling ? `每次乘以 2，${nums[3]} × 2 = ${next}` : `每次加 ${step}，${nums[3]} + ${step} = ${next}`,
  };
}

const MAKERS: Record<BrainKind, (r: Rand) => BrainQuestion> = { money, memory, odd, idiom, sequence };

export function makeQuestion(kind: BrainKind, seed: number): BrainQuestion {
  return MAKERS[kind](rng(seed));
}

/** 台北日期 YYYY-MM-DD */
export function taipeiDay(now: Date = new Date()): string {
  return new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
}

/** 今天輪到哪一種（每天換一種，五天一輪） */
export function dailyKind(day: string): BrainKind {
  const days = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400_000);
  return BRAIN_KINDS[((days % BRAIN_KINDS.length) + BRAIN_KINDS.length) % BRAIN_KINDS.length].id;
}

/** 每日一題：同一天全台同一題 */
export function dailyQuestion(day: string): BrainQuestion {
  return makeQuestion(dailyKind(day), hashSeed(`brain:${day}`));
}

/** 連續天數（台北日期，今天還沒玩也算昨天以前的連續） */
export function brainStreak(days: string[], today: string): { current: number; longest: number } {
  const set = [...new Set(days)].sort();
  if (set.length === 0) return { current: 0, longest: 0 };
  const toN = (d: string) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 86400_000);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < set.length; i++) {
    run = toN(set[i]) - toN(set[i - 1]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const t = toN(today);
  const last = toN(set[set.length - 1]);
  if (t - last > 1) return { current: 0, longest };
  let current = 1;
  for (let i = set.length - 1; i > 0 && toN(set[i]) - toN(set[i - 1]) === 1; i--) current++;
  return { current, longest };
}
