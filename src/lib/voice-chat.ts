// ────────────────────────────────────────────────
// 跟暖暖聊聊（語音對話）：說一句、回一句
// 錄一句話 → 伺服器轉 mp3 → 邁笙 lk888 的 Gemini 同時聽懂並回答 → 手機念出來
// 不再用 OpenAI 即時語音；次數和「問暖暖」共用每天的題數
// ────────────────────────────────────────────────

import type { AskMessage } from "./ask";

/** 一句話最多錄幾秒 */
export const VOICE_TURN_MAX_SECONDS = 60;
/** 太短的不算（不小心按到） */
export const VOICE_TURN_MIN_SECONDS = 0.8;
/** 帶給模型的前文最多幾則 */
export const VOICE_HISTORY_MAX = 16;

/** 語音對話另外的規則（接在暖暖的說話規則後面） */
export const VOICE_RULES = [
  "這是「語音對話」：他剛剛用說的（附上的錄音，台灣口音的國語，可能夾雜台語）。",
  "・先聽懂他說什麼；真的聽不清楚就請他再說一次，不要亂猜。",
  "・回答會被念出來（這條比上面的字數、分點規則優先）：3 句以內、80 字以內，口語、溫暖；不要用符號、條列、表情符號或網址。",
  "・只輸出兩行，不要加別的：",
  "聽到：<他說的原話>",
  "回答：<你的回答>",
].join("\n");

/** 模型回的「聽到／回答」兩行 → 分開；格式不對時整段當回答 */
export function parseVoiceReply(text: string): { heard: string; reply: string } {
  const t = text.replace(/\r/g, "").trim();
  const heard = /(?:^|\n)\s*聽到[:：]\s*([^\n]*)/.exec(t)?.[1]?.trim() ?? "";
  const replyMatch = /(?:^|\n)\s*回答[:：]\s*([\s\S]*)$/.exec(t);
  let reply = (replyMatch ? replyMatch[1] : t.replace(/(?:^|\n)\s*聽到[:：][^\n]*/, "")).trim();
  // 念出來的話：拿掉 Markdown 符號與多餘空白
  reply = reply.replace(/[*#`>_]+/g, "").replace(/\n{2,}/g, "\n").trim();
  return { heard: [...heard].slice(0, 300).join(""), reply: [...reply].slice(0, 600).join("") };
}

/** 帶給模型的前文：只留最後幾則、去掉空的 */
export function voiceHistory(messages: AskMessage[]): AskMessage[] {
  return messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.text?.trim())
    .slice(-VOICE_HISTORY_MAX)
    .map((m) => ({ role: m.role, text: [...m.text.trim()].slice(0, 600).join("") }));
}
