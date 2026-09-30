"use client";

// ────────────────────────────────────────────────
// 出遊影片口白：選誰的聲音（阿嬤／阿公／年輕女聲／年輕男聲／我的聲音）＋口音
// 單張影片與多張照片遊記共用
// ────────────────────────────────────────────────

import {
  MY_VOICE,
  NARRATION_ACCENTS,
  NARRATION_VOICES,
  type MyVoiceStatus,
  type NarrationAccentId,
  type NarrationVoiceChoice,
} from "@/lib/travel-video";

function choiceButton(active: boolean): React.CSSProperties {
  return {
    padding: "14px 10px", minHeight: 60, borderRadius: "var(--r-md)",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
  };
}

/** 「我的聲音」現在能不能直接選：要專業版、錄好了、沒過期 */
export function myVoiceReady(status: MyVoiceStatus | null): boolean {
  return Boolean(status?.allowed && status.voice && !status.voice.expired);
}

export function NarrationVoicePicker({
  voice,
  accent,
  onVoice,
  onAccent,
  myVoice,
  onSetupMyVoice,
}: {
  voice: NarrationVoiceChoice;
  accent: NarrationAccentId;
  onVoice: (v: NarrationVoiceChoice) => void;
  onAccent: (a: NarrationAccentId) => void;
  /** null＝還在查 */
  myVoice: MyVoiceStatus | null;
  /** 打開「我的聲音」：錄音、重錄、刪除，或說明要升級 */
  onSetupMyVoice: () => void;
}) {
  const mineReady = myVoiceReady(myVoice);
  const mineSelected = voice === MY_VOICE;
  const mineHint = !myVoice
    ? ""
    : !myVoice.allowed
      ? "專業版"
      : !myVoice.voice
        ? "先錄一段"
        : myVoice.voice.expired
          ? "要重錄"
          : "";

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {NARRATION_VOICES.map((v) => (
          <button
            key={v.id}
            onClick={() => onVoice(v.id)}
            aria-pressed={voice === v.id}
            style={{ ...choiceButton(voice === v.id), display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
          >
            <span style={{ fontSize: 30 }} aria-hidden="true">{v.emoji}</span>
            <span style={{ whiteSpace: "nowrap" }}>{v.label}</span>
          </button>
        ))}
        <button
          onClick={() => (mineReady ? onVoice(MY_VOICE) : onSetupMyVoice())}
          aria-pressed={mineSelected}
          style={{
            ...choiceButton(mineSelected),
            gridColumn: "1 / -1",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <span style={{ fontSize: 28 }} aria-hidden="true">🎙️</span>
          <span>我的聲音</span>
          {mineHint && (
            <span
              style={{
                fontSize: "var(--fs-xs)", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                background: "var(--gold-soft, #FFF1D6)", color: "var(--ink-2)",
              }}
            >
              {mineHint}
            </span>
          )}
        </button>
      </div>

      {mineSelected ? (
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
          用你自己錄的聲音念。{" "}
          <button
            onClick={onSetupMyVoice}
            style={{
              background: "none", border: "none", padding: 0, color: "var(--primary)",
              fontSize: "inherit", fontWeight: 700, textDecoration: "underline", cursor: "pointer",
            }}
          >
            重新錄或刪除
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 8 }}>什麼口音？</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} role="group" aria-label="口音">
            {NARRATION_ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => onAccent(a.id)}
                aria-pressed={accent === a.id}
                style={{
                  padding: "10px 14px", minHeight: 44, borderRadius: 999,
                  background: accent === a.id ? "var(--primary-soft)" : "var(--surface)",
                  border: `2px solid ${accent === a.id ? "var(--primary)" : "var(--line)"}`,
                  fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 6 }}>
            都是說國語、帶一點口音，不是整句說方言
          </div>
        </div>
      )}
    </>
  );
}
