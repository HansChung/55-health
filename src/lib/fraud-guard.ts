/** 安心保鑣：本機私密防詐練習（非自動偵測、不上傳） */

export const FRAUD_GUARD_STORAGE_KEY = "nuannuan_fraud_guard_v1";

export interface FraudListItem {
  id: string;
  kind: "blacklist" | "whitelist";
  title: string;
  features: string;
  safeAction: string;
  createdAt: string;
}

export interface FraudRockDraft {
  scenario: string;
  flags: [string, string, string];
  safeAction: string;
}

export interface FraudGuardState {
  blacklist: FraudListItem[];
  whitelist: FraudListItem[];
  rock?: FraudRockDraft;
}

const EMPTY: FraudGuardState = { blacklist: [], whitelist: [] };

export function loadFraudGuardState(): FraudGuardState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(FRAUD_GUARD_STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as FraudGuardState;
    return {
      blacklist: Array.isArray(parsed.blacklist) ? parsed.blacklist : [],
      whitelist: Array.isArray(parsed.whitelist) ? parsed.whitelist : [],
      rock: parsed.rock,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveFraudGuardState(state: FraudGuardState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FRAUD_GUARD_STORAGE_KEY, JSON.stringify(state));
}

export function createFraudListItem(
  kind: "blacklist" | "whitelist",
  title: string,
  features: string,
  safeAction: string
): FraudListItem {
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    title: title.trim(),
    features: features.trim(),
    safeAction: safeAction.trim(),
    createdAt: new Date().toISOString(),
  };
}

/** 給語音／AI 的安全練習提示（明確禁止投資建議與身分驗證） */
export function buildFraudRockAskPrompt(scenario?: string): string {
  const base =
    "請只列出三個詐騙疑點，並建議一個安全確認方式。不要提供投資建議，不要要求我提供帳密、驗證碼或身分資料，也不要斷言這一定是詐騙。";
  const s = scenario?.trim();
  if (!s) return `這是一則模擬訊息練習。${base}`;
  return `這是一則模擬訊息（請勿當真）：「${s}」。${base}`;
}

export const FRAUD_PAUSE_RULES = [
  { id: "no-click", label: "不點", hint: "不點陌生連結、不掃不明 QR" },
  { id: "no-reply", label: "不回", hint: "不回覆要求匯款或個資的訊息" },
  { id: "no-input", label: "不輸入", hint: "不輸入帳密、驗證碼、身分資料" },
] as const;

export const FRAUD_SENSITIVE_REMINDER =
  "請勿記錄密碼、驗證碼、身分證字號、完整金融帳號或信用卡資料。";
