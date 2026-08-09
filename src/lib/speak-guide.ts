/** 章首導讀：用瀏覽器語音朗讀（無需上傳音檔） */

export function canSpeakGuide(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopGuideSpeech(): void {
  if (!canSpeakGuide()) return;
  window.speechSynthesis.cancel();
}

/** 朗讀段落；回傳是否成功開始播放 */
export function speakGuideParagraphs(
  paragraphs: string[],
  options?: { lang?: string; rate?: number; onEnd?: () => void; onError?: () => void }
): boolean {
  if (!canSpeakGuide()) return false;
  const text = paragraphs.map((p) => p.trim()).filter(Boolean).join("。");
  if (!text) return false;

  stopGuideSpeech();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = options?.lang ?? "zh-TW";
  utter.rate = options?.rate ?? 0.95;
  utter.onend = () => options?.onEnd?.();
  utter.onerror = () => options?.onError?.();
  window.speechSynthesis.speak(utter);
  return true;
}
