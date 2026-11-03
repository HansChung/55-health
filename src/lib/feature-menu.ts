// ────────────────────────────────────────────────
// 功能目錄：「功能」分頁（生活羅盤＋全部功能清單）和首頁「常用」都從這裡讀（名稱、圖示、分類）
// 能不能用（後台開關、方案）由 page.tsx 給每個 id 一個動作；沒給動作的就不顯示
// 新功能：加一個 MenuId、在 MENU_ITEMS 寫名稱、放進某一組和羅盤的某個方向，再到 page.tsx 接上動作
// ────────────────────────────────────────────────

import { blueprintDim } from "@/lib/smart-blueprint";
import type { SmartDimension } from "@/lib/smart";

export type MenuId =
  | "clinic" | "health_metrics" | "chronic" | "exercise" | "weekly_report"
  | "ask" | "voice" | "photo_ask"
  | "travel_video" | "greeting_video" | "stories"
  | "study_tours" | "study_passport" | "blueprint" | "book"
  | "caregiver" | "scam_check" | "iot" | "family" | "business_card"
  | "brain_game" | "achievements" | "smart";

export interface MenuItem {
  label: string;
  emoji: string;
  /** 一行說明（全部功能頁用） */
  desc: string;
  /** 找功能用的別名（名稱、說明裡沒有的說法，例如「詐騙」） */
  keywords?: string[];
}

export const MENU_ITEMS: Record<MenuId, MenuItem> = {
  clinic: { label: "看診小幫手", emoji: "🩺", desc: "回診提醒、看懂報告", keywords: ["看醫生", "醫院", "回診", "掛號", "檢驗", "報告"] },
  health_metrics: { label: "血壓血糖", emoji: "📈", desc: "記錄和看趨勢", keywords: ["量血壓", "血糖", "體重", "趨勢"] },
  chronic: { label: "慢性病用藥", emoji: "💊", desc: "病史、藥物時間", keywords: ["吃藥", "藥", "用藥", "高血壓", "糖尿病"] },
  exercise: { label: "運動記錄", emoji: "🚶", desc: "散步、太極", keywords: ["走路", "散步", "運動"] },
  weekly_report: { label: "每週報告", emoji: "📊", desc: "這週吃得怎樣", keywords: ["飲食", "吃飯", "報告"] },
  ask: { label: "問暖暖", emoji: "💬", desc: "打字或用說的", keywords: ["問問題", "打字", "聊天"] },
  voice: { label: "跟暖暖聊聊", emoji: "🎙️", desc: "按著說話", keywords: ["說話", "聊天", "語音"] },
  photo_ask: { label: "拍照問暖暖", emoji: "🔍", desc: "花草、古蹟、菜單", keywords: ["拍照", "照片", "看不懂", "植物", "菜單"] },
  travel_video: { label: "出遊影片", emoji: "🎬", desc: "照片變影片、遊記", keywords: ["影片", "遊記", "MV", "年度回憶", "出遊"] },
  greeting_video: { label: "祝福影片", emoji: "🎁", desc: "生日、過年送家人", keywords: ["生日", "過年", "祝福", "卡片"] },
  stories: { label: "我的故事集", emoji: "📖", desc: "回憶錄、有聲書", keywords: ["回憶", "回憶錄", "故事", "錄音", "有聲書"] },
  study_tours: { label: "研學團", emoji: "🧭", desc: "報名、集章", keywords: ["旅遊", "報名", "出遊", "參加活動"] },
  study_passport: { label: "研學護照", emoji: "🏮", desc: "章和結業證書", keywords: ["集章", "證書", "護照"] },
  blueprint: { label: "圓夢藍圖", emoji: "✨", desc: "點亮 SMART 光點", keywords: ["光點", "SMART", "目標"] },
  book: { label: "書本練習", emoji: "📚", desc: "一拍、二問、三記下", keywords: ["書", "上課", "練習", "學"] },
  caregiver: { label: "家人狀況", emoji: "👨‍👩‍👧", desc: "看長輩、輸入邀請碼", keywords: ["邀請碼", "看爸媽", "長輩"] },
  scam_check: { label: "可疑訊息", emoji: "🛡️", desc: "截圖給暖暖看", keywords: ["詐騙", "防詐", "簡訊", "LINE", "假訊息", "165"] },
  iot: { label: "居家守護", emoji: "🏠", desc: "感測器通知家人", keywords: ["感測器", "跌倒", "居家"] },
  family: { label: "家人共享", emoji: "🤝", desc: "邀請家人", keywords: ["邀請家人", "分享", "家人"] },
  business_card: { label: "數位名片", emoji: "📇", desc: "掃一下就認識我", keywords: ["名片", "QR", "自我介紹"] },
  brain_game: { label: "每日一題", emoji: "🧩", desc: "算錢、記數字、成語", keywords: ["遊戲", "腦力", "算錢", "成語"] },
  achievements: { label: "健康成就", emoji: "🏅", desc: "徽章、連續天數", keywords: ["徽章", "成就"] },
  smart: { label: "幸福檢測", emoji: "🧠", desc: "智慧幸福指數", keywords: ["幸福", "檢測", "問卷"] },
};

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuId[];
}

export const MENU_GROUPS: MenuGroup[] = [
  { id: "health", label: "🩺 健康照顧", items: ["clinic", "health_metrics", "chronic", "exercise", "weekly_report"] },
  { id: "ask", label: "💬 問暖暖", items: ["ask", "voice", "photo_ask"] },
  { id: "memory", label: "🎬 回憶與影片", items: ["travel_video", "greeting_video", "stories"] },
  { id: "outing", label: "🧭 出門走走", items: ["study_tours", "study_passport", "blueprint", "book"] },
  { id: "family", label: "👨‍👩‍👧 家人與安心", items: ["caregiver", "scam_check", "iot", "family", "business_card"] },
  { id: "brain", label: "🧠 動動腦", items: ["brain_game", "smart", "achievements"] },
];

// ── 生活羅盤（功能分頁）：書本第三章 SMART RADAR 的五個方向，中間是暖暖 ──
// 只決定「功能分頁」怎麼找；首頁常用的排序還是照 MENU_GROUPS

export interface CompassDirection {
  key: SmartDimension;
  /** 長輩看得懂的方向名（大字） */
  label: string;
  /** 書本的 SMART 名稱（小字），例如「S・連結」 */
  smartLabel: string;
  color: string;
  desc: string;
  items: MenuId[];
}

/** 羅盤中間的暖暖：直接問暖暖 */
export const COMPASS_CENTER: MenuId[] = ["ask", "voice", "photo_ask"];

const direction = (key: SmartDimension, label: string, desc: string, items: MenuId[]): CompassDirection => {
  const dim = blueprintDim(key);
  return { key, label, smartLabel: `${key}・${dim.label}`, color: dim.color, desc, items };
};

/** 順時針排：從上面開始 */
export const COMPASS_DIRECTIONS: CompassDirection[] = [
  direction("S", "家人朋友", "跟家人朋友聯絡、分享", ["caregiver", "family", "greeting_video", "business_card"]),
  direction("M", "回憶故事", "留下故事、照片和影片", ["stories", "travel_video", "blueprint", "smart"]),
  direction("A", "出門運動", "自己安排、走出門", ["study_tours", "study_passport", "exercise", "achievements"]),
  direction("R", "健康平安", "顧身體、防詐騙", ["clinic", "health_metrics", "chronic", "weekly_report", "scam_check", "iot"]),
  direction("T", "學新東西", "練習用手機、動動腦", ["book", "brain_game"]),
];

/** 找功能時比對用：去掉空白和標點、英文轉小寫 */
function normalizeSearch(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/[\s,.!?;:'"()~\-、，。！？；：「」『』（）・…～]/g, "");
}

/**
 * 找功能：打字（「血壓」）或說一整句（「我想量血壓」）都找得到。
 * 名稱／說明／別名裡有打的字，或打的話裡有功能名稱／別名，就算找到。照目錄順序，只回 available 裡的。
 */
export function searchMenu(query: string, available: MenuId[]): MenuId[] {
  const q = normalizeSearch(query);
  if (!q) return [];
  const order = MENU_GROUPS.flatMap((g) => g.items);
  return order.filter((id) => {
    if (!available.includes(id)) return false;
    const item = MENU_ITEMS[id];
    const terms = [item.label, ...(item.keywords ?? [])].map(normalizeSearch).filter((t) => t.length >= 2);
    const haystack = normalizeSearch([item.label, item.desc, ...(item.keywords ?? [])].join(" "));
    return haystack.includes(q) || terms.some((t) => q.includes(t));
  });
}

/** 一開始的「常用」（還沒用過任何功能時） */
export const DEFAULT_FAVORITES: MenuId[] = ["ask", "photo_ask", "scam_check", "clinic"];
export const FAVORITE_COUNT = 4;
/** 預設的常用多算幾次：別的功能要用 2 次以上才擠得掉（不會用一次就整排換掉） */
const DEFAULT_BONUS = 1.5;

export type MenuUsage = Partial<Record<MenuId, number>>;

/**
 * 首頁「常用」：用得多的排前面；挑好之後照目錄順序顯示（位置不會每天跳來跳去）。
 * available＝現在能用的（後台關掉的不算）
 */
export function pickFavorites(usage: MenuUsage, available: MenuId[], count = FAVORITE_COUNT): MenuId[] {
  const order = MENU_GROUPS.flatMap((g) => g.items);
  const score = (id: MenuId) => (usage[id] ?? 0) + (DEFAULT_FAVORITES.includes(id) ? DEFAULT_BONUS : 0);
  const picked = [...new Set(available)]
    .sort((a, b) => score(b) - score(a) || order.indexOf(a) - order.indexOf(b))
    .slice(0, count);
  return picked.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

const USAGE_KEY = "nuannuan_menu_usage";

/** 這支手機用過哪些功能（只存在這台裝置；讀不到就當沒用過） */
export function readMenuUsage(): MenuUsage {
  try {
    const raw = JSON.parse(localStorage.getItem(USAGE_KEY) ?? "{}") as Record<string, unknown>;
    const out: MenuUsage = {};
    for (const id of Object.keys(MENU_ITEMS) as MenuId[]) {
      const n = raw[id];
      if (typeof n === "number" && Number.isFinite(n) && n > 0) out[id] = Math.min(n, 9999);
    }
    return out;
  } catch {
    return {};
  }
}

export function recordMenuUse(id: MenuId): void {
  try {
    const usage = readMenuUsage();
    usage[id] = (usage[id] ?? 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch { /* 私密瀏覽、存不了就算了 */ }
}
