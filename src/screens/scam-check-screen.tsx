"use client";

// ────────────────────────────────────────────────
// 這則訊息可疑嗎？：收到奇怪的簡訊、LINE、Email → 截圖或貼文字給暖暖 → 列出疑點、教怎麼查證
// 結果可以念給長輩聽、通知家人（家人狀況看得到＋推播），或用 LINE 傳給家人；畫面上一定有「打 165」
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { DictationButton } from "@/components/dictation-button";
import { api, ApiError } from "@/lib/api-client";
import { compressImage } from "@/lib/image-utils";
import { photoPayload } from "@/lib/direct-upload";
import { appendDictation } from "@/lib/dictation";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import {
  SCAM_ALWAYS_RULES,
  SCAM_SOURCES,
  SCAM_TEXT_MAX,
  SCAM_VERDICT_META,
  scamCheckSpeech,
  scamShareText,
  type ScamCheck,
} from "@/lib/scam-check";

const hiddenInput: React.CSSProperties = {
  position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none",
};

const pickButton: React.CSSProperties = {
  position: "relative",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: 6, padding: "18px 12px", minHeight: 100,
  background: "var(--surface)", border: "2px solid var(--line)", borderRadius: "var(--r-md)",
  fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", margin: "22px 0 10px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "14px 16px", minHeight: 56,
  fontSize: "var(--fs-base)", color: "var(--ink-1)", fontFamily: "inherit", lineHeight: 1.6,
  background: "var(--surface)", border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
};

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "10px 16px", minHeight: 48, borderRadius: 999,
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-1)",
  };
}

const callButton: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", minHeight: 56, marginTop: 14, borderRadius: "var(--r-md)",
  background: "var(--berry)", color: "#fff", fontWeight: 800, fontSize: "var(--fs-base)", textDecoration: "none",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ScamCheckScreen({ onBack }: { onBack: () => void }) {
  const toast = useToast();
  const [photo, setPhoto] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [current, setCurrent] = useState<ScamCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [history, setHistory] = useState<ScamCheck[] | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [noFamily, setNoFamily] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // 換了截圖或文字就 +1：還在看的舊問題回來時丟掉
  const inputVersion = useRef(0);

  useEffect(() => {
    api.listScamChecks()
      .then((r) => {
        setHistory(r.checks);
        setQuota(r.quota);
      })
      .catch(() => setHistory([]));
    return () => stopGuideSpeech();
  }, []);

  useEffect(() => {
    if (current || checking) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [current, checking]);

  const changedInput = () => {
    inputVersion.current += 1;
    setChecking(false);
    setError(null);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPreparing(true);
    try {
      // 截圖的字要看得清楚：長邊留大一點
      const dataUrl = await compressImage(file, { maxSide: 1600, quality: 0.85 });
      changedInput();
      setPhoto(dataUrl);
    } catch (err) {
      console.warn("[scam-check] photo prepare failed:", err);
      toast.error("截圖讀不出來，換一張試試");
    } finally {
      setPreparing(false);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        toast.info("剪貼簿是空的：先在訊息上長按「拷貝」，再回來按一次");
        return;
      }
      changedInput();
      setText([...clip].slice(0, SCAM_TEXT_MAX).join(""));
    } catch {
      toast.info("請在下面的框框裡長按，選「貼上」");
    }
  };

  const check = async () => {
    if ((!photo && !text.trim()) || checking) return;
    stopGuideSpeech();
    setSpeaking(false);
    setError(null);
    setShareNote(null);
    setCurrent(null);
    setChecking(true);
    const version = inputVersion.current;
    try {
      const res = await api.checkScam({
        ...(photo ? await photoPayload(photo) : {}),
        text: text.trim() || undefined,
        source: source ?? undefined,
      });
      if (version !== inputVersion.current) return;
      setCurrent(res.check);
      setQuota(res.quota);
      if (res.check.id) setHistory((h) => [res.check, ...(h ?? []).filter((c) => c.id !== res.check.id)].slice(0, 20));
      trackEvent("scam_check", { verdict: res.check.verdict, image: Boolean(photo), text: Boolean(text.trim()) });
    } catch (e) {
      if (version !== inputVersion.current) return;
      const data = e instanceof ApiError ? (e.data as { quota?: { used: number; limit: number } } | null) : null;
      if (data?.quota) setQuota(data.quota);
      setError(e instanceof ApiError && !e.isNetwork ? e.message : "網路不太穩，等一下再試一次。著急的話請直接打 165");
    } finally {
      if (version === inputVersion.current) setChecking(false);
    }
  };

  const startOver = () => {
    stopGuideSpeech();
    setSpeaking(false);
    changedInput();
    setPhoto(null);
    setText("");
    setSource(null);
    setCurrent(null);
    setShareNote(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSpeak = () => {
    if (!current) return;
    if (speaking) {
      stopGuideSpeech();
      setSpeaking(false);
      return;
    }
    const ok = speakGuideParagraphs(scamCheckSpeech(current), { rate: 0.9, onEnd: () => setSpeaking(false), onError: () => setSpeaking(false) });
    setSpeaking(ok);
    if (!ok) toast.info("這支手機不支援朗讀，請直接看文字");
  };

  const notifyFamily = async () => {
    if (!current?.id || sharing) return;
    setSharing(true);
    try {
      const res = await api.shareScamCheck(current.id);
      const sharedAt = new Date().toISOString();
      const updated = { ...current, shared_at: current.shared_at ?? sharedAt };
      setCurrent(updated);
      setHistory((h) => (h ?? []).map((c) => (c.id === updated.id ? updated : c)));
      setShareNote(
        res.pushed > 0
          ? "已經通知家人了，他們在「家人狀況」也看得到。"
          : "已經放進家人的「家人狀況」；家人沒有開通知，最好再打個電話或用 LINE 說一聲。"
      );
      trackEvent("scam_check_share", { verdict: current.verdict, pushed: res.pushed });
    } catch (e) {
      const data = e instanceof ApiError ? (e.data as { noFamily?: boolean } | null) : null;
      if (data?.noFamily) {
        setNoFamily(true);
        setShareNote("還沒有連結家人。可以按下面「用 LINE 傳給家人」。");
      } else {
        toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "沒有送出去，請再按一次");
      }
    }
    setSharing(false);
  };

  const shareByLine = async () => {
    if (!current) return;
    const message = scamShareText(current);
    try {
      if (navigator.share) {
        await navigator.share({ title: "請幫我看這則訊息", text: message });
        trackEvent("scam_check_line", { verdict: current.verdict });
        return;
      }
      await navigator.clipboard.writeText(message);
      toast.success("已經複製好了，請貼到 LINE 傳給家人");
    } catch {
      // 長輩按了取消分享：不用提示
    }
  };

  const removeCheck = async (id: string) => {
    if (!confirm("要刪掉這筆紀錄嗎？")) return;
    try {
      await api.deleteScamCheck(id);
      setHistory((h) => (h ?? []).filter((c) => c.id !== id));
      if (current?.id === id) setCurrent(null);
    } catch (e) {
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "刪除沒成功，請再試一次");
    }
  };

  const remaining = quota && quota.limit < 99999 ? Math.max(0, quota.limit - quota.used) : null;
  const canCheck = Boolean(photo || text.trim()) && !checking && remaining !== 0;

  return (
    <SubPage title="這則訊息可疑嗎？" onBack={() => { stopGuideSpeech(); onBack(); }}>
      <div style={{
        background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
        borderRadius: "var(--r-lg)", padding: 16, display: "flex", gap: 12, alignItems: "center",
      }}>
        <Mascot size={60} mood="thinking" />
        <div style={{ flex: 1, fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
          收到奇怪的<strong>簡訊、LINE、Email</strong>，先別急著回。<strong>截圖或把文字貼給暖暖</strong>，暖暖幫你看有沒有詐騙的跡象。
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 14, borderRadius: "var(--r-lg)", background: "var(--berry-soft)" }}>
        <div style={{ fontWeight: 800, color: "var(--berry)" }}>🛑 確認之前，先做到這四件事</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
          {SCAM_ALWAYS_RULES.map((r) => (
            <div key={r} style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>・{r}</div>
          ))}
        </div>
      </div>

      {/* ① 截圖 */}
      <div style={sectionTitle}>① 附上截圖</div>
      {preparing ? (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-2)", fontSize: "var(--fs-sm)" }}>截圖處理中…</div>
      ) : photo ? (
        <div style={{ position: "relative" }}>
          <img
            src={photo}
            alt="要給暖暖看的截圖"
            style={{ width: "100%", maxHeight: 360, objectFit: "contain", display: "block", background: "var(--bg-deep)", borderRadius: "var(--r-lg)" }}
          />
          <button
            type="button"
            onClick={() => { changedInput(); setPhoto(null); }}
            className="btn-ghost"
            style={{ position: "absolute", right: 10, bottom: 10, minHeight: 48, padding: "8px 18px", fontSize: "var(--fs-sm)" }}
          >
            ✕ 拿掉截圖
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={pickButton}>
              <input type="file" accept="image/*" onChange={handleFile} style={hiddenInput} />
              <span style={{ fontSize: 34 }} aria-hidden="true">🖼️</span>
              從相簿選截圖
            </label>
            <label style={pickButton}>
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={hiddenInput} />
              <span style={{ fontSize: 34 }} aria-hidden="true">📷</span>
              拍下另一支手機
            </label>
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 8, lineHeight: 1.6 }}>
            怎麼截圖：同時按住<strong>「電源鍵」和「音量鍵」</strong>一下（iPhone 是側邊按鈕＋音量上）。
          </div>
        </>
      )}

      {/* ② 文字 */}
      <div style={sectionTitle}>② 或把訊息文字貼上來</div>
      <textarea
        value={text}
        onChange={(e) => { changedInput(); setText([...e.target.value].slice(0, SCAM_TEXT_MAX).join("")); }}
        placeholder="在訊息上長按「拷貝」，再到這裡長按「貼上」"
        aria-label="可疑訊息的文字"
        rows={text.length > 60 ? 6 : 3}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={pasteFromClipboard} style={chip(false)}>📋 貼上剛剛拷貝的</button>
        <DictationButton where="scam-check" onText={(heard) => { changedInput(); setText((t) => appendDictation(t, heard, SCAM_TEXT_MAX)); }} />
      </div>

      {/* ③ 誰傳的 */}
      <div style={sectionTitle}>③ 誰傳來的？（可不選）</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SCAM_SOURCES.map((s) => (
          <button key={s} type="button" onClick={() => setSource(source === s ? null : s)} aria-pressed={source === s} style={chip(source === s)}>
            {s}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={check}
        disabled={!canCheck}
        className="btn-primary"
        style={{ width: "100%", marginTop: 20, opacity: canCheck ? 1 : 0.5 }}
      >
        {checking ? "暖暖正在看…" : "🔍 請暖暖看看"}
      </button>
      {!photo && !text.trim() && (
        <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 8 }}>先附上截圖，或把訊息貼上來</div>
      )}
      {remaining !== null && (
        <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 8 }}>
          今天還可以問 {remaining} 次
        </div>
      )}

      <div ref={resultRef} />
      {checking && (
        <div className="card" role="status" style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center" }}>
          <Mascot size={52} mood="thinking" />
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>
            暖暖正在仔細看…
            <div style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--ink-2)" }}>大約 10 秒；這段時間先別回覆對方</div>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="card" style={{ marginTop: 18, border: "2px solid var(--berry-soft)" }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--berry)" }}>{error}</div>
          <a href="tel:165" style={callButton}>📞 打 165 反詐騙專線（免費）</a>
        </div>
      )}

      {current && (
        <ResultCard
          check={current}
          speaking={speaking}
          onSpeak={toggleSpeak}
          sharing={sharing}
          noFamily={noFamily}
          shareNote={shareNote}
          onNotifyFamily={notifyFamily}
          onShareLine={shareByLine}
          onStartOver={startOver}
        />
      )}

      {history && history.length > 0 && (
        <>
          <div style={sectionTitle}>最近問過的</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((c) => {
              const meta = SCAM_VERDICT_META[c.verdict];
              return (
                <div key={c.id} className="card" style={{ padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => { stopGuideSpeech(); setSpeaking(false); setShareNote(null); setCurrent(c); }}
                    style={{ flex: 1, display: "flex", gap: 10, alignItems: "center", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 26 }} aria-hidden="true">{meta.emoji}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 800, fontSize: "var(--fs-sm)" }}>{c.title}</span>
                      <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>
                        {meta.label}・{formatWhen(c.created_at)}{c.shared_at ? "・已通知家人" : ""}
                      </span>
                    </span>
                  </button>
                  <button type="button" onClick={() => removeCheck(c.id)} aria-label="刪掉這筆紀錄" style={{ background: "none", border: "none", fontSize: 20, padding: 8, cursor: "pointer" }}>
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 8 }}>紀錄只留「訊息大意」，不存截圖；90 天後自動刪掉。</div>
        </>
      )}

      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 20, lineHeight: 1.6 }}>
        暖暖只能幫你找疑點，不能保證真假。不確定就打 165 反詐騙專線，或問問家人。截圖看完不會保存。
      </div>
    </SubPage>
  );
}

function ResultCard({
  check,
  speaking,
  onSpeak,
  sharing,
  noFamily,
  shareNote,
  onNotifyFamily,
  onShareLine,
  onStartOver,
}: {
  check: ScamCheck;
  speaking: boolean;
  onSpeak: () => void;
  sharing: boolean;
  noFamily: boolean;
  shareNote: string | null;
  onNotifyFamily: () => void;
  onShareLine: () => void;
  onStartOver: () => void;
}) {
  const meta = SCAM_VERDICT_META[check.verdict];
  const box: React.CSSProperties = { marginTop: 12, padding: 14, borderRadius: "var(--r-md)", background: "var(--surface-warm)" };
  return (
    <div className="card" style={{ marginTop: 18, padding: 0, overflow: "hidden" }} aria-live="polite">
      <div style={{ background: meta.bg, padding: "16px 18px", display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 40 }} aria-hidden="true">{meta.emoji}</span>
        <div>
          <div style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: meta.color, lineHeight: 1.2 }}>{meta.label}</div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginTop: 4 }}>{check.title}</div>
        </div>
      </div>
      <div style={{ padding: "4px 18px 18px" }}>
        {check.kind && (
          <div style={{ marginTop: 10, fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>手法：<strong>{check.kind}</strong></div>
        )}
        {check.excerpt && (
          <div style={box}>
            <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-2)" }}>📩 訊息大意</div>
            <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, marginTop: 4 }}>{check.excerpt}</div>
          </div>
        )}
        {check.signals.length > 0 && (
          <div style={box}>
            <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--berry)" }}>🔎 暖暖看到的疑點</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
              {check.signals.map((s, i) => <li key={i} style={{ fontSize: "var(--fs-base)", lineHeight: 1.6 }}>{s}</li>)}
            </ul>
          </div>
        )}
        <div style={box}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)" }}>👉 現在可以這樣做</div>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            {check.advice.map((s, i) => <li key={i} style={{ fontSize: "var(--fs-base)", lineHeight: 1.6 }}>{s}</li>)}
          </ul>
          {check.verify && <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, marginTop: 8 }}>☎️ {check.verify}</div>}
        </div>
        {check.verdict === "likely_ok" && (
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 10, lineHeight: 1.6 }}>
            看起來沒問題，但只要有人跟你要驗證碼、密碼或叫你匯款，就一定先停下來問家人。
          </div>
        )}

        <a href="tel:165" style={callButton}>📞 打 165 反詐騙專線（免費）</a>
        {canSpeakGuide() && (
          <button type="button" onClick={onSpeak} className="btn-ghost" style={{ width: "100%", marginTop: 10 }}>
            {speaking ? "⏹ 停止" : "🔊 念給我聽"}
          </button>
        )}
        {check.id && !noFamily && (
          <button type="button" onClick={onNotifyFamily} disabled={sharing || Boolean(check.shared_at)} className="btn-ghost" style={{ width: "100%", marginTop: 10 }}>
            {check.shared_at ? "✅ 已經通知家人" : sharing ? "通知中…" : "📣 通知家人幫我看"}
          </button>
        )}
        <button type="button" onClick={onShareLine} className="btn-ghost" style={{ width: "100%", marginTop: 10 }}>
          💬 用 LINE 傳給家人
        </button>
        {shareNote && <div role="status" style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 8, lineHeight: 1.6 }}>{shareNote}</div>}
        <button type="button" onClick={onStartOver} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-sm)", cursor: "pointer" }}>
          🔁 再問另一則
        </button>
      </div>
    </div>
  );
}
