"use client";

// ────────────────────────────────────────────────
// 拍照問暖暖：出門看到不認識的花草、建築、古物、招牌 → 拍給暖暖看 → 大字解說＋念給你聽
// 解說用手機內建語音念（不花錢、不用等）；每問一次算一次拍照次數
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { api, ApiError } from "@/lib/api-client";
import { compressImage } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import {
  DEFAULT_PHOTO_QUESTION,
  PHOTO_ASK_CATEGORY_META,
  PHOTO_ASK_PLACE_MAX,
  PHOTO_ASK_PRESETS,
  PHOTO_ASK_QUESTION_MAX,
  photoAskSpeech,
  type PhotoAskResult,
} from "@/lib/photo-ask";

interface PhotoAskScreenProps {
  onBack: () => void;
  /** 從研學團打開時帶入活動名稱，幫暖暖認得更準 */
  initialPlace?: string | null;
}

interface Answer {
  question: string;
  result: PhotoAskResult;
}

const hiddenInput: React.CSSProperties = {
  position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none",
};

const pickButton: React.CSSProperties = {
  position: "relative",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: 6, padding: "20px 12px", minHeight: 110,
  background: "var(--surface)", border: "2px solid var(--line)", borderRadius: "var(--r-md)",
  fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", margin: "22px 0 10px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "14px 16px", minHeight: 56,
  fontSize: "var(--fs-base)", color: "var(--ink-1)", fontFamily: "inherit",
  background: "var(--surface)", border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
};

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "10px 16px", minHeight: 52, borderRadius: 999,
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-1)",
  };
}

/** data:image/jpeg;base64,xxx → { mimeType, base64 } */
function splitDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  return m ? { mimeType: m[1], base64: m[2] } : { mimeType: "image/jpeg", base64: dataUrl };
}

export function PhotoAskScreen({ onBack, initialPlace }: PhotoAskScreenProps) {
  const toast = useToast();
  const [photo, setPhoto] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [question, setQuestion] = useState<string>(DEFAULT_PHOTO_QUESTION);
  const [customQuestion, setCustomQuestion] = useState("");
  const [place, setPlace] = useState(initialPlace?.slice(0, PHOTO_ASK_PLACE_MAX) ?? "");
  const [asking, setAsking] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<{ message: string; upgrade?: boolean } | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // 每換一張照片就 +1：還在問的舊問題回來時，照片已經換了就丟掉
  const photoVersion = useRef(0);

  useEffect(() => () => stopGuideSpeech(), []);

  useEffect(() => {
    if (answers.length > 0 || asking) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [answers.length, asking]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同一張可以再選一次
    if (!file) return;
    setPreparing(true);
    try {
      const dataUrl = await compressImage(file);
      stopGuideSpeech();
      setSpeakingIndex(null);
      photoVersion.current += 1;
      setAsking(false);
      setPhoto(dataUrl);
      setAnswers([]);
      setError(null);
    } catch (err) {
      console.warn("[photo-ask] photo prepare failed:", err);
      toast.error("照片讀不出來，換一張試試（建議用 JPG）");
    } finally {
      setPreparing(false);
    }
  };

  const ask = async (q: string) => {
    if (!photo || asking) return;
    const finalQuestion = q.trim() || DEFAULT_PHOTO_QUESTION;
    stopGuideSpeech();
    setSpeakingIndex(null);
    setError(null);
    setAsking(true);
    const version = photoVersion.current;
    try {
      const { mimeType, base64 } = splitDataUrl(photo);
      const res = await api.askPhoto({
        imageBase64: base64,
        mimeType,
        question: finalQuestion,
        place: place.trim() || undefined,
      });
      if (version !== photoVersion.current) return; // 問的時候換了照片：這個回答是舊照片的
      setAnswers((prev) => [...prev, { question: finalQuestion, result: res.result }]);
      setQuota({ used: res.quota.used, limit: res.quota.limit });
      trackEvent("photo_ask", { category: res.result.category, follow_up: answers.length > 0 });
    } catch (e) {
      if (version !== photoVersion.current) return;
      // 只有伺服器說「次數用完／要升級」（帶 upgradeUrl）才請長輩升級；AI 服務忙線的 429 只請他等一下
      const upgrade = e instanceof ApiError && Boolean((e.data as { upgradeUrl?: string } | null)?.upgradeUrl);
      setError({
        message: e instanceof ApiError && !e.isNetwork ? e.message : "網路不太穩，等一下再問一次",
        upgrade,
      });
    }
    if (version === photoVersion.current) setAsking(false);
  };

  const toggleSpeak = (index: number, result: PhotoAskResult) => {
    if (speakingIndex === index) {
      stopGuideSpeech();
      setSpeakingIndex(null);
      return;
    }
    const ok = speakGuideParagraphs(photoAskSpeech(result), {
      rate: 0.9,
      onEnd: () => setSpeakingIndex(null),
      onError: () => setSpeakingIndex(null),
    });
    setSpeakingIndex(ok ? index : null);
    if (!ok) toast.info("這支手機不支援朗讀，請直接看文字");
  };

  const usingCustom = customQuestion.trim().length > 0;
  const currentQuestion = usingCustom ? customQuestion : question;
  const showQuota = quota && quota.limit < 99999;

  return (
    <SubPage title="拍照問暖暖" onBack={() => { stopGuideSpeech(); onBack(); }}>
      <div style={{
        background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
        borderRadius: "var(--r-lg)", padding: 16, display: "flex", gap: 12, alignItems: "center",
      }}>
        <Mascot size={60} mood="happy" />
        <div style={{ flex: 1, fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
          看到不認識的<strong>花草、建築、古物、招牌</strong>，拍給暖暖看，暖暖講給你聽！
        </div>
      </div>

      {/* ① 照片 */}
      <div style={sectionTitle}>① 拍一張照片</div>
      {preparing ? (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-2)", fontSize: "var(--fs-sm)" }}>照片處理中…</div>
      ) : photo ? (
        <div style={{ position: "relative" }}>
          <img
            src={photo}
            alt="要問暖暖的照片"
            style={{ width: "100%", maxHeight: 300, objectFit: "contain", display: "block", background: "var(--bg-deep)", borderRadius: "var(--r-lg)" }}
          />
          <label className="btn-ghost" style={{ position: "absolute", right: 10, bottom: 10, minHeight: 48, padding: "8px 18px", fontSize: "var(--fs-sm)" }}>
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={hiddenInput} />
            📷 換一張
          </label>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* 用 label 包住 input 才能在 iOS Safari 穩定觸發 */}
          <label style={pickButton}>
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={hiddenInput} />
            <span style={{ fontSize: 36 }} aria-hidden="true">📷</span>
            現在拍一張
          </label>
          <label style={pickButton}>
            <input type="file" accept="image/*" onChange={handleFile} style={hiddenInput} />
            <span style={{ fontSize: 36 }} aria-hidden="true">🖼️</span>
            從相簿選
          </label>
        </div>
      )}

      {/* ② 問題 */}
      <div style={sectionTitle}>② 想問什麼？</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {PHOTO_ASK_PRESETS.map((p) => {
          const active = !usingCustom && question === p;
          return (
            <button key={p} onClick={() => { setQuestion(p); setCustomQuestion(""); }} aria-pressed={active} style={chip(active)}>
              {p}
            </button>
          );
        })}
      </div>
      <input
        value={customQuestion}
        onChange={(e) => setCustomQuestion(e.target.value.slice(0, PHOTO_ASK_QUESTION_MAX))}
        placeholder="也可以自己打字問，例如：這棵樹幾歲了？"
        aria-label="自己打字問暖暖"
        style={{ ...inputStyle, marginTop: 10 }}
      />
      <input
        value={place}
        onChange={(e) => setPlace(e.target.value.slice(0, PHOTO_ASK_PLACE_MAX))}
        placeholder="在哪裡拍的？（可不填，例如：鹿港老街）"
        aria-label="拍照地點"
        style={{ ...inputStyle, marginTop: 10 }}
      />

      <button
        onClick={() => ask(currentQuestion)}
        disabled={!photo || asking}
        className="btn-primary"
        style={{ width: "100%", marginTop: 18, opacity: !photo ? 0.5 : 1 }}
      >
        {asking ? "暖暖正在看…" : "🔍 問暖暖"}
      </button>
      {!photo && (
        <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 8 }}>先拍一張照片，才能問暖暖</div>
      )}
      {showQuota && (
        <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 8 }}>
          本月拍照次數：已用 {quota.used}／{quota.limit} 次（和拍照記餐共用）
        </div>
      )}

      {/* 回答 */}
      {answers.map((a, i) => (
        <AnswerCard
          key={i}
          answer={a}
          speaking={speakingIndex === i}
          onSpeak={() => toggleSpeak(i, a.result)}
          onFollowUp={i === answers.length - 1 && !asking ? (q) => ask(q) : undefined}
        />
      ))}

      {asking && (
        <div className="card" role="status" style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center" }}>
          <Mascot size={52} mood="thinking" />
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>
            暖暖正在仔細看照片…
            <div style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--ink-2)" }}>大約 10 秒</div>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="card" style={{ marginTop: 18, border: "2px solid var(--berry-soft)" }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--berry)" }}>{error.message}</div>
          {error.upgrade && (
            <button onClick={() => { window.location.href = "/pricing"; }} className="btn-ghost" style={{ width: "100%", marginTop: 12 }}>
              看看升級方案
            </button>
          )}
        </div>
      )}

      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 20, lineHeight: 1.6 }}>
        暖暖的解說僅供參考。野外的植物、菇類、果實請不要摘來吃；身體不舒服請問醫師。
      </div>
      <div ref={bottomRef} />
    </SubPage>
  );
}

function AnswerCard({
  answer,
  speaking,
  onSpeak,
  onFollowUp,
}: {
  answer: Answer;
  speaking: boolean;
  onSpeak: () => void;
  onFollowUp?: (q: string) => void;
}) {
  const r = answer.result;
  const meta = PHOTO_ASK_CATEGORY_META[r.category];
  return (
    <div className="card" style={{ marginTop: 18, padding: 18 }}>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", fontWeight: 700 }}>你問：{answer.question}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 30 }} aria-hidden="true">{meta.emoji}</span>
        <div style={{ fontSize: "var(--fs-xl)", fontWeight: 800, lineHeight: 1.25 }}>{r.title}</div>
      </div>
      {r.confidence === "low" && (
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 4 }}>暖暖不太確定，僅供參考</div>
      )}
      {r.explanation && (
        <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.7, marginTop: 10 }}>{r.explanation}</div>
      )}
      {r.fun_fact && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: "var(--r-md)", background: "var(--surface-warm)" }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--gold)" }}>💡 小知識</div>
          <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, marginTop: 4 }}>{r.fun_fact}</div>
        </div>
      )}
      {r.caution && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: "var(--r-md)", background: "var(--berry-soft)" }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--berry)" }}>⚠️ 提醒你</div>
          <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, marginTop: 4 }}>{r.caution}</div>
        </div>
      )}
      {canSpeakGuide() && (
        <button onClick={onSpeak} className="btn-ghost" style={{ width: "100%", marginTop: 14 }}>
          {speaking ? "⏹ 停止" : "🔊 念給我聽"}
        </button>
      )}
      {onFollowUp && r.follow_ups.length > 0 && (
        <>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, marginTop: 16 }}>還想問：</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {r.follow_ups.map((q) => (
              <button key={q} onClick={() => onFollowUp(q)} style={{ ...chip(false), textAlign: "left", borderRadius: "var(--r-md)" }}>
                💬 {q}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
