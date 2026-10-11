// ────────────────────────────────────────────────
// 這則訊息可疑嗎？：長輩收到奇怪的簡訊、LINE、Email，截圖或貼文字給暖暖看有沒有詐騙跡象
// （前後端共用的型別、上限、整理模型回覆、分享與推播文字）
// 暖暖只列疑點、教怎麼查證，不保證真假；畫面上一定有「打 165」
// ────────────────────────────────────────────────

/** 每人每天可以問幾次（所有方案都能用；防詐不收費） */
export const SCAM_CHECK_DAILY = 10;
/** 貼上的訊息最多幾個字 */
export const SCAM_TEXT_MAX = 2000;
/** 補充說明（誰傳的、哪裡收到）最多幾個字 */
export const SCAM_NOTE_MAX = 100;
/** 問過的紀錄留幾天（之後由每天的清理排程刪掉） */
export const SCAM_CHECK_KEEP_DAYS = 90;

/** 誰傳來的？（點一下就好，幫暖暖判斷） */
export const SCAM_SOURCES = ["陌生號碼", "自稱銀行或政府", "自稱親友", "LINE 群組", "網路賣家或買家", "認識的人"] as const;

export type ScamVerdict = "danger" | "suspicious" | "unsure" | "likely_ok";

export const SCAM_VERDICT_META: Record<ScamVerdict, { emoji: string; label: string; color: string; bg: string }> = {
  danger: { emoji: "🚨", label: "很可能是詐騙", color: "var(--berry)", bg: "var(--berry-soft)" },
  suspicious: { emoji: "⚠️", label: "有可疑的地方", color: "#B5651D", bg: "#FCEBD8" },
  unsure: { emoji: "🤔", label: "暖暖不確定", color: "var(--ink-1)", bg: "var(--surface-warm)" },
  likely_ok: { emoji: "✅", label: "看起來是一般訊息", color: "#3D7A3A", bg: "#E4F1E1" },
};

export interface ScamCheckResult {
  verdict: ScamVerdict;
  /** 一句話結論（例如「很像假冒銀行的簡訊」） */
  title: string;
  /** 哪一類（假冒銀行、假親友借錢、投資…；一般訊息就空字串） */
  kind: string;
  /** 暖暖看到的疑點（引用訊息裡的說法） */
  signals: string[];
  /** 現在可以怎麼做 */
  advice: string[];
  /** 怎麼查證（一句） */
  verify: string;
  /** 訊息重點摘錄（帳號、驗證碼等已遮住；給家人看、念給長輩聽） */
  excerpt: string;
}

export interface ScamCheck extends ScamCheckResult {
  id: string;
  created_at: string;
  /** 已經通知家人的時間 */
  shared_at: string | null;
}

/** 一定要做到的事（不靠模型，畫面固定顯示） */
export const SCAM_ALWAYS_RULES = ["不點訊息裡的連結", "不打訊息裡給的電話", "不給驗證碼、密碼", "不匯款、不操作 ATM"] as const;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? [...v.replace(/\s+/g, " ").trim()].slice(0, max).join("") : "";
}

/** 畫面上不出現可以照著點、照著打的東西：連結拿掉、長串數字（電話、帳號）遮住 */
function safe(text: string): string {
  return maskSensitive(stripLinks(text));
}

function cleanList(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => safe(clean(x, maxLen))).filter(Boolean).slice(0, maxItems);
}

/** 長輩貼的文字／補充說明：保留換行（簡訊常分行），去掉多餘空白、截長 */
export function sanitizeScamText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const text = v
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return [...text].slice(0, max).join("");
}

const VERDICTS: ScamVerdict[] = ["danger", "suspicious", "unsure", "likely_ok"];

/** 模型回的 JSON → 畫面能直接用的格式（不留連結和完整號碼）；沒給建議時補上預設的 */
export function normalizeScamCheckResult(raw: unknown): ScamCheckResult {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const verdict = VERDICTS.includes(r.verdict as ScamVerdict) ? (r.verdict as ScamVerdict) : "unsure";
  const title = safe(clean(r.title, 40));
  const signals = cleanList(r.signals, 5, 60);
  if (!title && signals.length === 0) throw new Error("empty scam-check result");
  const advice = cleanList(r.advice, 4, 60);
  return {
    verdict,
    title: title || SCAM_VERDICT_META[verdict].label,
    kind: safe(clean(r.kind, 20)),
    signals,
    advice: advice.length > 0 ? advice : ["先不要回覆，也不要點連結", "不確定就打 165 反詐騙專線問問看"],
    verify: safe(clean(r.verify, 80)),
    excerpt: safe(clean(r.excerpt, 120)),
  };
}

/**
 * 保險起見再遮一次（不靠模型照做）：身分證字號；驗證碼、密碼這類標籤後面的數字（可能被空格、點、橫線隔開）；
 * 9 碼以上的長串數字（帳號、卡號、電話，含 0912.345.678 這種寫法）
 */
export function maskSensitive(text: string): string {
  return text
    .replace(/[A-Z][12]\d{8}/g, "＊＊＊＊")
    // 標籤「緊接著」的整串數字（中間只能有空格、冒號、是／為）；至少 4 碼才算，免得把「…打 165」遮掉。
    // 不限長度，免得 16 碼的帳號只遮前半
    .replace(/(驗證碼|認證碼|確認碼|安全碼|動態密碼|交易密碼|代碼|密碼|OTP|PIN)([\s:：是為]{0,3})(\d(?:[\d .\-]*\d)?)/gi, (m, label: string, mid: string, num: string) =>
      num.replace(/\D/g, "").length >= 4 ? `${label}${mid}＊＊＊＊` : m
    )
    .replace(/\d[\d .\-]{7,}\d/g, (m) => `${m.slice(0, 2)}＊＊＊＊`);
}

const LINK_GONE = "（連結已拿掉）";

/**
 * 拿掉所有連結（免得長輩、家人誤點）：http(s)／www 開頭的、line://、tg:// 這類自訂開頭的、
 * 任何「名字.英文字尾」的網域（不靠字尾清單，
 * fakebank.live、xxx.click 都算）、IP 位址。網址後面只吃 ASCII，緊接的中文留著
 */
export function stripLinks(text: string): string {
  return text
    .replace(/(?:https?:\/\/|www\.)[!-~]+/gi, LINK_GONE)
    // 自訂開頭的連結（line://、tg://、intent://…）：詐騙常用來直接加好友、開 App
    .replace(/\b[a-z][a-z0-9+.\-]{1,30}:\/\/[!-~]*/gi, LINK_GONE)
    .replace(/\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z](?::\d+)?(?:\/[!-~]*)?/gi, LINK_GONE)
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/[!-~]*)?/g, LINK_GONE);
}

/** 念給我聽 */
export function scamCheckSpeech(r: ScamCheckResult): string[] {
  const parts = [`暖暖看了，${SCAM_VERDICT_META[r.verdict].label}。${r.title}`];
  if (r.signals.length) parts.push(`疑點有：${r.signals.join("；")}`);
  if (r.advice.length) parts.push(`你可以這樣做：${r.advice.join("；")}`);
  if (r.verify) parts.push(r.verify);
  parts.push("不確定的話，打 165 反詐騙專線，是免費的。");
  return parts.map((p) => stripLinks(p));
}

/** 「用 LINE 傳給家人」的文字：長輩自己傳，用「我」（沒有連結、沒有完整個資） */
export function scamShareText(r: ScamCheckResult): string {
  const lines = [
    "我收到一則訊息，請暖暖看了一下：",
    `${SCAM_VERDICT_META[r.verdict].emoji} ${SCAM_VERDICT_META[r.verdict].label}｜${r.title}`,
  ];
  if (r.excerpt) lines.push(`訊息大意：${r.excerpt}`);
  if (r.signals.length) lines.push(`疑點：${r.signals.join("、")}`);
  lines.push("我先不點、不回、不匯款，你有空幫我看看。");
  return stripLinks(lines.join("\n"));
}

/** 通知家人（推播） */
export function scamPushForFamily(opts: { elderName: string; verdict: ScamVerdict; title: string }): { title: string; body: string } {
  const meta = SCAM_VERDICT_META[opts.verdict];
  return {
    title: `🛡️ ${opts.elderName}收到一則可疑訊息`,
    body: stripLinks(`暖暖判斷：${meta.label}（${opts.title}）。打個電話關心一下吧`),
  };
}
