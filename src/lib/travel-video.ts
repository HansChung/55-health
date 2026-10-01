/**
 * 出遊回憶影片（MiniMax 圖轉影片）— 前後端共用的純函式與型別
 * 長輩拍一張出遊照片 → AI 讓照片動起來，做成 10 秒小影片分享給家人
 * 可選「口白＋字幕」：AI 配音念一句遊記，字幕照原句燒進影片
 */

import type { VideoCommentsView } from "./video-comments";

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

/**
 * 口音（只套用在上面四種 AI 聲音；「我的聲音」本來就是自己的口音）。
 * 都是「國語帶口音」，不是整句改說方言。id 會存進 travel_videos.narration_accent，不要改名
 */
export const NARRATION_ACCENTS = [
  { id: "taiwan", label: "台灣口音", phrase: "" },
  { id: "taigi", label: "台灣國語", phrase: "a strong Taiwanese Hokkien accent (台灣國語), like older people in southern Taiwan" },
  { id: "hakka", label: "客家腔", phrase: "a strong Hakka (客家) accent, like an old Hakka person from Meinong or Miaoli" },
  { id: "cantonese", label: "廣東腔", phrase: "a strong Cantonese accent (廣東口音, 港式國語)" },
  { id: "sichuan", label: "四川腔", phrase: "a very strong Sichuan accent (四川口音, 川普), with Sichuanese tones" },
  { id: "shandong", label: "山東腔", phrase: "a very strong Shandong accent (山東口音), like an old veteran from Shandong" },
] as const;

export type NarrationAccentId = (typeof NARRATION_ACCENTS)[number]["id"];

export const DEFAULT_NARRATION_ACCENT: NarrationAccentId = "taiwan";

export const NARRATION_ACCENT_IDS = NARRATION_ACCENTS.map((a) => a.id) as [
  NarrationAccentId,
  ...NarrationAccentId[],
];

export function narrationAccent(id: string | null | undefined) {
  return NARRATION_ACCENTS.find((a) => a.id === id) ?? NARRATION_ACCENTS[0];
}

/** 「我的聲音」：長輩自己錄音複製的聲音（專業版） */
export const MY_VOICE = "mine" as const;
export type NarrationVoiceChoice = NarrationVoiceId | typeof MY_VOICE;
export const NARRATION_VOICE_CHOICES = [...NARRATION_VOICE_IDS, MY_VOICE] as [
  NarrationVoiceChoice,
  ...NarrationVoiceChoice[],
];

/** 錄音複製聲音：平台要求至少 10 秒，太長也沒幫助（建議 10～60 秒） */
export const VOICE_SAMPLE_MIN_SECONDS = 12;
export const VOICE_SAMPLE_MAX_SECONDS = 60;
/** 每 30 天最多重錄幾次（每個新聲音第一次使用都要付一次啟用費） */
export const VOICE_CLONES_PER_30_DAYS = 2;
/** 錄音時請長輩念這段（開頭是同意聲明，後面讓錄音夠長、有各種聲調） */
export const VOICE_SAMPLE_SCRIPT =
  "我同意暖暖用我自己的聲音，念我自己的出遊影片。今天天氣很好，我們一家人去山上走走，看到好多花，風景好漂亮。中午吃了一碗熱熱的麵，下午在湖邊喝茶聊天，下次還要再來。";
/** 勾選同意的文字（存進資料庫，日後可查） */
export const VOICE_CONSENT_TEXT =
  "這是我本人的聲音。我同意暖暖用這段錄音複製我的聲音，只用來念我自己的影片口白，我可以隨時刪除。";

export interface MyVoice {
  id: string;
  created_at: string;
  /** 平台給的試聽（有的話） */
  demo_url: string | null;
  /** 用過一次後就永久有效；沒用過的錄音 7 天後失效 */
  activated: boolean;
  expires_at: string | null;
  expired: boolean;
}

export interface MyVoiceStatus {
  /** 方案可不可以用（專業版） */
  allowed: boolean;
  voice: MyVoice | null;
  /** 這 30 天還能錄幾次 */
  remaining: number;
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

// ── 多張照片遊記影片（montage）：照片慢慢移動＋每張一句配音與字幕，伺服器 ffmpeg 合成 ──

export type TravelVideoKind = "single" | "montage";
export const MONTAGE_MIN_PHOTOS = 3;
export const MONTAGE_MAX_PHOTOS = 5;
/** 一次送出的照片（base64 data URL）合計上限：Vercel request body 上限 4.5MB */
export const MONTAGE_MAX_TOTAL_CHARS = 4_200_000;
/** 前端目標：超過就把照片再壓小一點 */
export const MONTAGE_CLIENT_TARGET_CHARS = 3_800_000;
/** 每張照片的一句話：約 2.2 字／秒 → 最多約 9 秒 */
export const MONTAGE_LINE_MAX = 20;

/** 每月遊記支數（只花配音費，一支約 0.1 算力） */
export const DEFAULT_MONTAGE_QUOTA: Record<string, number> = { free: 0, basic: 10, pro: 30 };
export function montageQuota(tier: string): number {
  return DEFAULT_MONTAGE_QUOTA[tier] ?? 0;
}

export function sanitizeMontageLine(text: string | null | undefined): string {
  return [...sanitizeNarration(text)].slice(0, MONTAGE_LINE_MAX).join("");
}

/** AI 一次看完全部照片、每張寫一句（串成一段小遊記） */
export function buildMontageScriptPrompt(count: number, place: string): string {
  return (
    `你是幫台灣長輩寫出遊日記的小幫手。下面依序有 ${count} 張同一趟出遊的照片，` +
    `請每張寫一句口白，串起來像一段溫暖的小遊記（有開頭、有結尾）。` +
    "用長輩第一人稱、口語、繁體中文（台灣用語）；" +
    `每句 8～${MONTAGE_LINE_MAX} 個字，不要用引號、表情符號或英文，不要提到「照片」或「影片」，` +
    "看不出是哪裡就不要硬寫地名。" +
    (place ? `這趟去的地方：${place}。` : "") +
    `只回 JSON：{"lines": ["第1張的句子", …]}，lines 要剛好 ${count} 句、照照片順序。`
  );
}

export interface MontagePhoto {
  path: string;
  width: number;
  height: number;
  line: string;
  audio_path: string | null;
  narration_seconds: number | null;
  clip_path: string | null;
  clip_seconds: number | null;
}

/** travel_videos.montage 欄位 */
export interface MontageState {
  size: { width: number; height: number };
  photos: MontagePhoto[];
  /** 連續失敗次數（成功一步就歸零） */
  attempts: number;
  /** 選「我的聲音」時，建立當下用的是哪一個聲音（中途重錄／刪除不會混到別的聲音） */
  voice_clone_id?: string | null;
  /** 配樂（public/music/<id>.m4a）；null／沒有＝不要音樂（舊的遊記沒有這個欄位） */
  music?: MontageMusicId | null;
}

/**
 * 遊記配樂：2026-09-30 用邁笙 Suno v4.5 做的純音樂（一次做好、所有影片共用），
 * 事先處理成前 90 秒、-28 LUFS、結尾淡出（見 AGENTS.md）。id 會存進 montage.music，不要改名
 */
export const MONTAGE_MUSIC = [
  { id: "warm", label: "溫馨", emoji: "🌷" },
  { id: "light", label: "輕快", emoji: "☀️" },
  { id: "nostalgic", label: "懷舊", emoji: "📻" },
  { id: "piano", label: "鋼琴", emoji: "🎹" },
  { id: "folk", label: "民謠風", emoji: "🏮" },
  { id: "nature", label: "大自然", emoji: "🌿" },
] as const;

export type MontageMusicId = (typeof MONTAGE_MUSIC)[number]["id"];
export const MONTAGE_MUSIC_IDS = MONTAGE_MUSIC.map((m) => m.id) as [MontageMusicId, ...MontageMusicId[]];
export const DEFAULT_MONTAGE_MUSIC: MontageMusicId = "warm";

export function isMontageMusicId(v: unknown): v is MontageMusicId {
  return typeof v === "string" && (MONTAGE_MUSIC_IDS as readonly string[]).includes(v);
}

/** 前端試聽／伺服器合成都用這個檔名（伺服器從 public/music 讀檔） */
export function montageMusicFile(id: MontageMusicId): string {
  return `/music/${id}.m4a`;
}

export type MontageStage = "tts" | "clips" | "final";

export function montageStage(state: MontageState): MontageStage {
  if (state.photos.some((p) => !p.audio_path)) return "tts";
  if (state.photos.some((p) => !p.clip_path)) return "clips";
  return "final";
}

/** 給畫面顯示的進度：配音中／剪輯第幾張／合成中 */
export function montageProgress(state: MontageState): { stage: MontageStage; done: number; total: number } {
  const stage = montageStage(state);
  const total = state.photos.length;
  const done =
    stage === "tts"
      ? state.photos.filter((p) => p.audio_path).length
      : stage === "clips"
        ? state.photos.filter((p) => p.clip_path).length
        : total;
  return { stage, done, total };
}

export function montageProgressLabel(p: { stage: MontageStage; done: number; total: number }): string {
  if (p.stage === "tts") return "暖暖正在配音…";
  if (p.stage === "clips") return `正在剪輯第 ${Math.min(p.done + 1, p.total)}／${p.total} 張`;
  return "快好了，正在合成影片…";
}

/** 前端顯示用的影片資料（API 回傳格式） */
export interface TravelVideo {
  id: string;
  kind: TravelVideoKind;
  /** 遊記：每張照片那一句話 */
  montage_lines: string[] | null;
  /** 遊記製作進度（做好或失敗就是 null） */
  montage_progress: { stage: MontageStage; done: number; total: number } | null;
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
  /** 家人的按讚、留言（做好的影片才有） */
  comments?: VideoCommentsView;
}

/** 試聽過的口白（音檔已存在伺服器，送出影片時帶 id） */
export interface TravelNarration {
  id: string;
  url: string;
  seconds: number;
  text: string;
  voice: NarrationVoiceChoice;
  accent: NarrationAccentId;
  /** 依口白長度算出的影片秒數 */
  video_seconds: number;
}

export interface TravelVideoQuota {
  used: number;
  limit: number;
  tier: string;
}

// ── 分享頁（/v/<影片 id>）：LINE 會抓縮圖和標題，打開就能播放 ──

export function videoSharePath(id: string): string {
  return `/v/${encodeURIComponent(id)}`;
}

/** 分享頁的標題與說明（LINE／FB 預覽用）。不放長輩的名字：連結可能被轉傳出去 */
export function videoShareMeta(v: Pick<TravelVideo, "kind" | "place" | "narration_text" | "montage_lines">): {
  title: string;
  description: string;
} {
  const what = v.kind === "montage" ? "遊記影片" : "出遊回憶影片";
  const title = v.place ? `${v.place}・${what}` : what;
  const lines = v.kind === "montage" ? (v.montage_lines ?? []) : v.narration_text ? [v.narration_text] : [];
  const said = lines.filter(Boolean).join("／");
  const description = said ? `「${said.length > 60 ? `${said.slice(0, 60)}…` : said}」用暖暖做的${what}` : `用暖暖做的${what}，點開來看看`;
  return { title, description };
}
