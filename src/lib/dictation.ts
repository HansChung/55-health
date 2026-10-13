// ────────────────────────────────────────────────
// 說話變文字：整理辨識結果、錯誤訊息
// 有瀏覽器內建語音辨識（Android Chrome、iPhone Safari、電腦版 Chrome）就用它（免費）；
// 沒有的（App 的 Android WebView、Firefox）改成錄一句話 → 伺服器用平台的 Gemini 聽寫（/api/ai/transcribe）
// ────────────────────────────────────────────────

/** 句尾已經有標點／空白就不用再補逗號 */
const ENDS_WITH_BREAK = /[，。！？、,.!?…\s]$/;

/** 把聽到的話接在原本的字後面（中間補「，」），超過字數就截掉（以字為單位，表情符號不會被切壞） */
export function appendDictation(prev: string, heard: string, max: number): string {
  const said = heard.replace(/\s+/g, " ").trim();
  if (!said) return [...prev].slice(0, max).join("");
  const joined = !prev ? said : ENDS_WITH_BREAK.test(prev) ? `${prev}${said}` : `${prev}，${said}`;
  return [...joined].slice(0, max).join("");
}

/** 辨識錯誤代碼 → 給長輩看的話；"aborted"（自己按停止、換別的欄位）不用提示 */
export function dictationErrorMessage(code: string): string | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "沒有麥克風權限，請到手機設定打開麥克風";
    case "no-speech":
      return "沒有聽到聲音，請靠近手機再說一次";
    case "audio-capture":
      return "找不到麥克風，請檢查手機設定";
    case "network":
      return "說話變文字需要網路，請檢查網路再試一次";
    case "quota":
      return "今天用說的次數用完了，明天再來，或先用打字";
    case "disabled":
      return "用說的功能暫時停用，請先用打字";
    case "aborted":
      return null;
    default:
      return "這次沒有聽清楚，請再說一次";
  }
}

/** 錄音一句最多幾秒（伺服器聽寫） */
export const DICTATION_MAX_SECONDS = 30;
/** 開口後安靜多久就當作說完了 */
export const DICTATION_END_SILENCE_MS = 1400;
/** 一直沒開口就停（當作沒聽到） */
export const DICTATION_NO_SPEECH_MS = 7000;

/** 聽寫模型回來的字：去掉引號、「聽寫：」這類前綴、多餘空白；說「（聽不清楚）」之類的當作沒聽到 */
export function cleanTranscript(text: string | null | undefined): string {
  let t = (text ?? "").replace(/\r/g, "").trim();
  t = t.replace(/^(聽寫|逐字稿|他說|內容)[:：]\s*/, "");
  t = t.replace(/^["'「『“]+|["'」』”]+$/g, "").trim();
  if (/^[（(]?(聽不清楚|沒有聲音|無法辨識|無聲|靜音)[）)]?[。.]?$/.test(t)) return "";
  return [...t.replace(/\s+/g, " ")].slice(0, 300).join("");
}

/** 錄音音量（0～1，均方根）是否算有人在說話 */
export function isSpeaking(rms: number, threshold = 0.02): boolean {
  return rms >= threshold;
}
