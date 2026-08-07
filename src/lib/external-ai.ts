/**
 * 書本範例 → 外部 AI（Gemini / ChatGPT）一點練習
 *
 * - ChatGPT：官方支援 ?q= 預填（未登入時可能丟失預填，故仍先複製）
 * - Gemini：網頁目前無法穩定預填，改為開啟 App 並複製到剪貼簿，請使用者貼上
 */

export type ExternalAiProvider = "gemini" | "chatgpt";

export const EXTERNAL_AI_MAX_PROMPT_CHARS = 6000;

export function truncateExternalAiPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (trimmed.length <= EXTERNAL_AI_MAX_PROMPT_CHARS) return trimmed;
  return trimmed.slice(0, EXTERNAL_AI_MAX_PROMPT_CHARS);
}

/** ChatGPT：預填提問（可能自動送出，視帳號／瀏覽器而定） */
export function chatgptPracticeUrl(prompt: string): string {
  const q = truncateExternalAiPrompt(prompt);
  return `https://chatgpt.com/?q=${encodeURIComponent(q)}`;
}

/**
 * Gemini：開啟對話頁。
 * 附帶 ?q= 以利未來官方支援；目前多數環境仍需手動貼上（呼叫端應先複製）。
 */
export function geminiPracticeUrl(prompt: string): string {
  const q = truncateExternalAiPrompt(prompt);
  return `https://gemini.google.com/app?q=${encodeURIComponent(q)}`;
}

export function externalAiPracticeUrl(
  provider: ExternalAiProvider,
  prompt: string
): string {
  return provider === "chatgpt"
    ? chatgptPracticeUrl(prompt)
    : geminiPracticeUrl(prompt);
}

export function externalAiProviderLabel(provider: ExternalAiProvider): string {
  return provider === "chatgpt" ? "ChatGPT" : "Gemini";
}

export type OpenExternalAiResult =
  | { ok: true; provider: ExternalAiProvider; copied: boolean; url: string }
  | { ok: false; reason: "empty" | "popup_blocked" };

/**
 * 複製範例並開新分頁到外部 AI。
 * 回傳是否成功，供 UI 顯示 toast。
 */
export async function openExternalAiPractice(
  provider: ExternalAiProvider,
  prompt: string,
  options?: {
    copyText?: (text: string) => Promise<void>;
    openUrl?: (url: string) => Window | null;
  }
): Promise<OpenExternalAiResult> {
  const text = truncateExternalAiPrompt(prompt);
  if (!text) return { ok: false, reason: "empty" };

  const url = externalAiPracticeUrl(provider, text);
  let copied = false;

  const copy =
    options?.copyText ??
    (async (value: string) => {
      await navigator.clipboard.writeText(value);
    });

  try {
    await copy(text);
    copied = true;
  } catch {
    copied = false;
  }

  const open =
    options?.openUrl ??
    ((href: string) =>
      window.open(href, "_blank", "noopener,noreferrer"));

  const win = open(url);
  if (!win) {
    // 仍可能已複製；呼叫端可提示手動開啟
    return { ok: false, reason: "popup_blocked" };
  }

  return { ok: true, provider, copied, url };
}

export function externalAiSuccessMessage(
  provider: ExternalAiProvider,
  copied: boolean
): string {
  const name = externalAiProviderLabel(provider);
  if (provider === "chatgpt") {
    return copied
      ? `已開啟 ${name}（範例已帶入；若沒看到，請貼上後送出）`
      : `已開啟 ${name}；請貼上範例後送出`;
  }
  return copied
    ? `已開啟 ${name}，並複製範例——請貼上後送出`
    : `已開啟 ${name}；請手動貼上範例後送出`;
}
