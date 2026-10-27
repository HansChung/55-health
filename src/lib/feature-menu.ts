// ────────────────────────────────────────────────
// 功能目錄：「全部功能」頁和首頁「常用」都從這裡讀（名稱、圖示、分類）
// 能不能用（後台開關、方案）由 page.tsx 給每個 id 一個動作；沒給動作的就不顯示
// 新功能：加一個 MenuId、在 MENU_ITEMS 寫名稱、放進某一組，再到 page.tsx 接上動作
// ────────────────────────────────────────────────

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
}

export const MENU_ITEMS: Record<MenuId, MenuItem> = {
  clinic: { label: "看診小幫手", emoji: "🩺", desc: "回診提醒、看懂報告" },
  health_metrics: { label: "血壓血糖", emoji: "📈", desc: "記錄和看趨勢" },
  chronic: { label: "慢性病用藥", emoji: "💊", desc: "病史、藥物時間" },
  exercise: { label: "運動記錄", emoji: "🚶", desc: "散步、太極" },
  weekly_report: { label: "每週報告", emoji: "📊", desc: "這週吃得怎樣" },
  ask: { label: "問暖暖", emoji: "💬", desc: "打字或用說的" },
  voice: { label: "跟暖暖聊聊", emoji: "🎙️", desc: "按著說話" },
  photo_ask: { label: "拍照問暖暖", emoji: "🔍", desc: "花草、古蹟、菜單" },
  travel_video: { label: "出遊影片", emoji: "🎬", desc: "照片變影片、遊記" },
  greeting_video: { label: "祝福影片", emoji: "🎁", desc: "生日、過年送家人" },
  stories: { label: "我的故事集", emoji: "📖", desc: "回憶錄、有聲書" },
  study_tours: { label: "研學團", emoji: "🧭", desc: "報名、集章" },
  study_passport: { label: "研學護照", emoji: "🏮", desc: "章和結業證書" },
  blueprint: { label: "圓夢藍圖", emoji: "✨", desc: "點亮 SMART 光點" },
  book: { label: "書本練習", emoji: "📚", desc: "一拍、二問、三記下" },
  caregiver: { label: "家人狀況", emoji: "👨‍👩‍👧", desc: "看長輩、輸入邀請碼" },
  scam_check: { label: "可疑訊息", emoji: "🛡️", desc: "截圖給暖暖看" },
  iot: { label: "居家守護", emoji: "🏠", desc: "感測器通知家人" },
  family: { label: "家人共享", emoji: "🤝", desc: "邀請家人" },
  business_card: { label: "數位名片", emoji: "📇", desc: "掃一下就認識我" },
  brain_game: { label: "每日一題", emoji: "🧩", desc: "算錢、記數字、成語" },
  achievements: { label: "健康成就", emoji: "🏅", desc: "徽章、連續天數" },
  smart: { label: "幸福檢測", emoji: "🧠", desc: "智慧幸福指數" },
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
