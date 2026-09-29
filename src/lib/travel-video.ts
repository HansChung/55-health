/**
 * 出遊回憶影片（MiniMax 圖轉影片）— 前後端共用的純函式與型別
 * 長輩拍一張出遊照片 → AI 讓照片動起來，做成 10 秒小影片分享給家人
 * 可選「口白＋字幕」：AI 配音念一句遊記，字幕照原句燒進影片
 */

export const TRAVEL_VIDEO_DURATION_SECONDS = 10;
/** H3 可做 4～15 秒 */
export const TRAVEL_VIDEO_MIN_SECONDS = 4;
export const TRAVEL_VIDEO_MAX_SECONDS = 15;
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

/**
 * 每支影片都要遵守的規則：不能把長輩「變成別人」，也不能換成別的畫面
 * （實測：提示詞一複雜，H3 可能 0.5 秒就切到自己生成的鏡頭，所以明確要求單一鏡頭）
 */
const SINGLE_SHOT_RULE =
  "全片只有一個連續不中斷的鏡頭，從頭到尾都是這張照片的同一個場景與構圖，不要剪接、不要換場景。";
const BASE_RULES =
  "保持照片中人物的長相、髮型、衣著與人數完全不變，不要新增人物，畫面中不要出現任何文字、字幕或浮水印。動作自然、緩慢、穩定，畫面明亮溫暖。";
/** 有口白時：口白和字幕由我們後製，H3 只留環境音（實測 H3 自己念口白不穩定） */
const NARRATION_AUDIO_RULE = "不要旁白、不要人聲說話、不要背景音樂，只要自然的環境聲。";

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
  place?: string | null,
  opts: { withNarration?: boolean } = {}
): string {
  const style =
    TRAVEL_VIDEO_STYLES.find((s) => s.id === styleId) ?? TRAVEL_VIDEO_STYLES[0];
  const cleanPlace = sanitizePlace(place);
  const placeLine = cleanPlace ? `拍攝地點：${cleanPlace}。` : "";
  const audioLine = opts.withNarration ? NARRATION_AUDIO_RULE : "";
  return `${SINGLE_SHOT_RULE}${style.prompt}${placeLine}${BASE_RULES}${audioLine}`;
}

// ── 口白＋字幕 ─────────────────────────────────

/** 實測台灣口音配音約每秒 2.2 字：30 字 ≈ 14 秒，放得進最長 15 秒的影片（避免先付配音費才發現太長） */
export const NARRATION_MAX_CHARS = 30;

/**
 * 試聽口白／AI 寫稿不扣影片次數，但會花平台共用算力 → 每月各自上限：
 * 每支影片約可試 8 次，最少 5 次；管理員（limit ≥ 9999）不限
 */
export const EXTRAS_PER_VIDEO = 8;
export function travelVideoExtrasLimit(videoLimit: number): number {
  if (videoLimit >= 9999) return Number.POSITIVE_INFINITY;
  return Math.max(5, videoLimit * EXTRAS_PER_VIDEO);
}
/** 口白前留一點空白再開始念，比較自然 */
export const NARRATION_DELAY_SECONDS = 0.4;

/**
 * 實測挑選的 Gemini 配音（邁笙 gem-3.1-tts）。同一個音色換語氣指示就能變年輕／年長：
 * 長輩語氣約 60～70 歲感、年輕語氣約 20～30 歲感，都是台灣口音、念的內容與原句一致。
 * id 已存進 travel_videos.narration_voice，female／male 不要改名
 */
export const NARRATION_VOICES = [
  { id: "female", label: "阿嬤", emoji: "👵", ttsVoice: "Sulafat", persona: "elderly Taiwanese grandmother", young: false },
  { id: "male", label: "阿公", emoji: "👴", ttsVoice: "Achird", persona: "elderly Taiwanese grandfather", young: false },
  { id: "young_female", label: "年輕女聲", emoji: "👩", ttsVoice: "Sulafat", persona: "young Taiwanese woman", young: true },
  { id: "young_male", label: "年輕男聲", emoji: "👨", ttsVoice: "Achird", persona: "young Taiwanese man", young: true },
] as const;

export type NarrationVoiceId = (typeof NARRATION_VOICES)[number]["id"];

export const NARRATION_VOICE_IDS = NARRATION_VOICES.map((v) => v.id) as [
  NarrationVoiceId,
  ...NarrationVoiceId[],
];

export function narrationVoice(id: NarrationVoiceId) {
  return NARRATION_VOICES.find((v) => v.id === id) ?? NARRATION_VOICES[0];
}

/** 口白文字：去掉控制字元與引號、壓成單行、限制長度 */
export function sanitizeNarration(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/["「」『』“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NARRATION_MAX_CHARS);
}

/** 影片長度 = 口白長度 + 前後留白，落在 H3 支援的 4～15 秒 */
export function videoSecondsForNarration(narrationSeconds: number): number {
  const wanted = Math.ceil(NARRATION_DELAY_SECONDS + narrationSeconds + 0.8);
  return Math.min(TRAVEL_VIDEO_MAX_SECONDS, Math.max(TRAVEL_VIDEO_MIN_SECONDS, wanted));
}

/** 口白太長放不進 15 秒影片 */
export function narrationTooLong(narrationSeconds: number): boolean {
  return NARRATION_DELAY_SECONDS + narrationSeconds > TRAVEL_VIDEO_MAX_SECONDS - 0.3;
}

export interface SubtitleCue {
  text: string;
  start: number;
  end: number;
}

/**
 * 字幕照「原句」顯示：依標點切段，時間按字數比例分配在口白期間。
 * 每段去掉結尾標點（字幕慣例），最後一段多停留一下再消失。
 */
export function buildSubtitleCues(
  script: string,
  narrationSeconds: number,
  videoSeconds: number
): SubtitleCue[] {
  const segments = sanitizeNarration(script)
    .split(/[，,。．！!？?；;、\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) return [];

  const totalChars = segments.reduce((n, s) => n + [...s].length, 0);
  const start0 = NARRATION_DELAY_SECONDS;
  const span = Math.max(0.5, narrationSeconds);
  const cues: SubtitleCue[] = [];
  let cursor = start0;
  segments.forEach((text, i) => {
    const len = (span * [...text].length) / totalChars;
    const isLast = i === segments.length - 1;
    const end = isLast ? Math.min(videoSeconds, start0 + span + 0.6) : cursor + len;
    cues.push({ text, start: round2(cursor), end: round2(end) });
    cursor += len;
  });
  return cues;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
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
  /** 有選口白時的原句（字幕內容） */
  narration_text: string | null;
}

/** 試聽過的口白（音檔已存在伺服器，送出影片時帶 id） */
export interface TravelNarration {
  id: string;
  url: string;
  seconds: number;
  text: string;
  voice: NarrationVoiceId;
  /** 依口白長度算出的影片秒數 */
  video_seconds: number;
}

export interface TravelVideoQuota {
  used: number;
  limit: number;
  tier: string;
}
