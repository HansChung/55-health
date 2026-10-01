"use client";

// 「🗣️ 用說的」：按一下說話，說完自動變成文字（瀏覽器不支援就不顯示）

import { useDictation } from "@/hooks/use-dictation";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { dictationErrorMessage } from "@/lib/dictation";

export function DictationButton({
  onText,
  disabled,
  where,
  compact,
}: {
  /** 聽到的一整句（呼叫端自己接到欄位裡） */
  onText: (text: string) => void;
  disabled?: boolean;
  /** 統計用：留言／口白／遊記 */
  where: string;
  /** 小按鈕（遊記每張照片旁邊） */
  compact?: boolean;
}) {
  const toast = useToast();
  const { supported, listening, interim, listen, stop } = useDictation();
  if (!supported) return null;

  const toggle = () => {
    if (listening) return stop();
    trackEvent("dictation_start", { where });
    listen(
      (text) => {
        onText(text);
        trackEvent("dictation_text", { where, chars: [...text].length });
      },
      (code) => {
        const msg = dictationErrorMessage(code);
        if (msg) toast.error(msg);
      }
    );
  };

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4, minWidth: 0 }}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled && !listening}
        aria-pressed={listening}
        aria-label={listening ? "停止聽寫" : "用說的輸入文字"}
        style={{
          padding: compact ? "6px 10px" : "8px 14px",
          minHeight: compact ? 36 : 44,
          borderRadius: 999,
          border: `2px solid ${listening ? "var(--danger, #c0392b)" : "var(--primary)"}`,
          background: listening ? "#FDECEA" : "var(--surface)",
          color: listening ? "var(--danger, #c0392b)" : "var(--primary-deep, var(--ink-1))",
          fontSize: compact ? "var(--fs-xs)" : "var(--fs-sm)",
          fontWeight: 800,
          whiteSpace: "nowrap",
          cursor: "pointer",
          opacity: disabled && !listening ? 0.5 : 1,
        }}
      >
        {listening ? "🔴 請說話…" : "🗣️ 用說的"}
      </button>
      {listening && interim && (
        <span role="status" style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", maxWidth: 240 }}>
          聽到：{interim}
        </span>
      )}
    </span>
  );
}
