// ────────────────────────────────────────────────
// 說話變文字（瀏覽器內建語音辨識）：整理辨識結果、錯誤訊息
// Android 手機的 Chrome、iPhone 的 Safari、電腦版 Chrome 有；App（Android WebView）、Firefox 沒有 → 不顯示按鈕
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
    case "aborted":
      return null;
    default:
      return "這次沒有聽清楚，請再說一次";
  }
}
