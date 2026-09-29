/**
 * 出遊回憶影片（MiniMax 圖轉影片）— 前後端共用的純函式與型別
 * 長輩拍一張出遊照片 → AI 讓照片動起來，做成 10 秒小影片分享給家人
 */

export const TRAVEL_VIDEO_DURATION_SECONDS = 10;
export const TRAVEL_VIDEO_PLACE_MAX = 30;

export type TravelVideoStatus = "queued" | "running" | "succeeded" | "failed";

export const TRAVEL_VIDEO_STYLES = [
  {
    id: "gentle",
    emoji: "🍃",
    label: "自然動起來",
    desc: "風吹樹葉、雲慢慢飄",
    prompt:
      "讓這張出遊照片自然地動起來：微風吹動樹葉與衣角，水面、雲朵與光影輕輕流動，照片中的人露出自然的微笑、輕輕眨眼。鏡頭幾乎固定，只有非常輕微的推進。",
  },
  {
    id: "wave",
    emoji: "👋",
    label: "跟家人打招呼",
    desc: "笑著向鏡頭揮手",
    prompt:
      "照片中的人看著鏡頭、面帶笑容，輕輕向鏡頭揮手打招呼，像在跟家人分享出遊的好心情，背景景物自然微動。",
  },
  {
    id: "cinematic",
    emoji: "🎥",
    label: "電影感運鏡",
    desc: "鏡頭慢慢推近再拉遠",
    prompt:
      "旅遊紀錄片風格的運鏡：鏡頭從畫面緩緩推近主角，再平順地拉遠，展現周圍的風景，光線自然，畫面穩定不晃動。",
  },
  {
    id: "warm",
    emoji: "🌅",
    label: "溫馨回憶",
    desc: "暖暖夕陽、懷舊色調",
    prompt:
      "溫馨懷舊的回憶風格：溫暖的金色陽光灑落，色調柔和，照片中的人放鬆地微笑，花草與光點輕輕飄動，節奏緩慢。",
  },
] as const;

export type TravelVideoStyleId = (typeof TRAVEL_VIDEO_STYLES)[number]["id"];

export const TRAVEL_VIDEO_STYLE_IDS = TRAVEL_VIDEO_STYLES.map((s) => s.id) as [
  TravelVideoStyleId,
  ...TravelVideoStyleId[],
];

/** 每支影片都要遵守的規則：不能把長輩「變成別人」 */
const BASE_RULES =
  "保持照片中人物的長相、髮型、衣著與人數完全不變，不要新增人物，畫面中不要出現任何文字、字幕或浮水印。動作自然、緩慢、穩定，畫面明亮溫暖。";

/** 地點只當背景資訊：去掉控制字元、壓成單行、限制長度 */
export function sanitizePlace(place: string | null | undefined): string {
  if (!place) return "";
  return place
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TRAVEL_VIDEO_PLACE_MAX);
}

export function buildTravelVideoPrompt(
  styleId: TravelVideoStyleId,
  place?: string | null
): string {
  const style =
    TRAVEL_VIDEO_STYLES.find((s) => s.id === styleId) ?? TRAVEL_VIDEO_STYLES[0];
  const cleanPlace = sanitizePlace(place);
  const placeLine = cleanPlace ? `拍攝地點：${cleanPlace}。` : "";
  return `${style.prompt}${placeLine}${BASE_RULES}`;
}

export function isTravelVideoPending(status: TravelVideoStatus): boolean {
  return status === "queued" || status === "running";
}

/** MiniMax 限制：短邊至少 256px、長寬比介於 2:5 與 5:2 */
export function checkVideoImageSize(
  width: number,
  height: number
): { ok: true } | { ok: false; reason: "too_small" | "bad_ratio" } {
  if (Math.min(width, height) < 256) return { ok: false, reason: "too_small" };
  const ratio = width / height;
  if (ratio < 2 / 5 || ratio > 5 / 2) return { ok: false, reason: "bad_ratio" };
  return { ok: true };
}

/**
 * 每月影片支數預設值（subscription_plans.ai_video_quota 沒設定時用）
 * 邁笙 minimax-h3 768P 0.095 算力/秒 → 一支 10 秒約 0.95 算力（晚上 10 點後有折扣）
 */
export const DEFAULT_VIDEO_QUOTA: Record<string, number> = {
  free: 0,
  basic: 2,
  pro: 6,
};

export function defaultVideoQuota(tier: string): number {
  return DEFAULT_VIDEO_QUOTA[tier] ?? 0;
}

/** 前端顯示用的影片資料（API 回傳格式） */
export interface TravelVideo {
  id: string;
  status: TravelVideoStatus;
  style: TravelVideoStyleId;
  place: string | null;
  photo_url: string | null;
  video_url: string | null;
  download_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface TravelVideoQuota {
  used: number;
  limit: number;
  tier: string;
}
