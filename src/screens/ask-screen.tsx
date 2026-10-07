"use client";

// ────────────────────────────────────────────────
// 打字問暖暖：打字或用說的問暖暖，什麼都可以問；可以接著追問
// 從書本練習來的：範例已經帶好、會附上自己寫的指南；主持模式（一次一題）做完可以整理後存回那一章
// 回答用手機內建語音念（不花錢）；每送出一則算一題，每天有題數
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { DictationButton } from "@/components/dictation-button";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { appendDictation } from "@/lib/dictation";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import {
  ASK_MESSAGE_MAX,
  ASK_STARTERS,
  saveChapterAskSummary,
  type AskMessage,
  type AskSeed,
} from "@/lib/ask";

interface AskScreenProps {
  onBack: () => void;
  /** 從書本練習帶來的範例（讀一次就用掉） */
  seed?: AskSeed | null;
}

interface Thread {
  messages: AskMessage[];
  mode: "chat" | "guided";
  chapterId: string | null;
  chapterTitle: string | null;
  guide: { label: string; text: string } | null;
}

const THREAD_KEY = "nuannuan_ask_thread";
const EMPTY_THREAD: Thread = { messages: [], mode: "chat", chapterId: null, chapterTitle: null, guide: null };

function loadThread(): Thread {
  try {
    const raw = sessionStorage.getItem(THREAD_KEY);
    if (raw) return { ...EMPTY_THREAD, ...(JSON.parse(raw) as Thread) };
  } catch { /* ignore */ }
  return EMPTY_THREAD;
}

function saveThread(t: Thread) {
  try {
    sessionStorage.setItem(THREAD_KEY, JSON.stringify(t));
  } catch { /* ignore */ }
}

/** 念的時候一段一段念（換行當成段落） */
function speechParagraphs(text: string): string[] {
  return text.split(/\n+/).map((l) => l.replace(/^[・\d.、\s]+/, "").trim()).filter(Boolean);
}

const bubbleBase: React.CSSProperties = {
  maxWidth: "88%", padding: "12px 14px", borderRadius: 16,
  fontSize: "var(--fs-base)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
};

const smallBtn: React.CSSProperties = {
  padding: "6px 12px", minHeight: 40, borderRadius: 999, border: "1px solid var(--line-strong)",
  background: "var(--surface)", color: "var(--ink-2)", fontSize: "var(--fs-sm)", cursor: "pointer",
};

export function AskScreen({ onBack, seed }: AskScreenProps) {
  const toast = useToast();
  const [thread, setThread] = useState<Thread>(EMPTY_THREAD);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // 書本範例：換成新的一段對話，範例放進輸入框（看過再送出）；沒有就接著上次的對話
  useEffect(() => {
    if (seed) {
      const next: Thread = {
        messages: [],
        mode: seed.mode,
        chapterId: seed.chapterId ?? null,
        chapterTitle: seed.chapterTitle ?? null,
        guide: seed.guide ?? null,
      };
      setThread(next);
      saveThread(next);
      setInput([...seed.prompt].slice(0, ASK_MESSAGE_MAX).join(""));
      trackEvent("ask_from_chapter", { chapter: seed.chapterId ?? "", mode: seed.mode });
    } else {
      setThread(loadThread());
    }
    api.askQuota().then((r) => setQuota(r.quota)).catch(() => undefined);
  }, [seed]);

  useEffect(() => () => stopGuideSpeech(), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.messages.length, busy, summary]);

  const update = (t: Thread) => {
    setThread(t);
    saveThread(t);
  };

  const send = async (text?: string) => {
    const q = [...(text ?? input).trim()].slice(0, ASK_MESSAGE_MAX).join("");
    if (!q || busy) return;
    stopGuideSpeech();
    setSpeaking(null);
    setError(null);
    setSummary(null);
    const messages: AskMessage[] = [...thread.messages, { role: "user", text: q }];
    const pending = { ...thread, messages };
    update(pending);
    setInput("");
    setBusy(true);
    try {
      const res = await api.ask({
        messages,
        mode: thread.mode,
        chapterId: thread.chapterId,
        chapterTitle: thread.chapterTitle,
        guide: thread.guide,
      });
      update({ ...pending, messages: [...messages, { role: "assistant", text: res.reply }] });
      setQuota(res.quota);
      trackEvent("ask_sent", { chapter: thread.chapterId ?? "", mode: thread.mode, turns: messages.length });
    } catch (e) {
      // 沒問成功：把問題放回輸入框，不留在對話裡
      update(thread);
      setInput(q);
      const data = e instanceof ApiError ? (e.data as { upgradeUrl?: string; quota?: { used: number; limit: number } } | null) : null;
      if (data?.quota) setQuota(data.quota);
      setError({
        message: e instanceof ApiError && !e.isNetwork ? e.message : "網路不太穩，等一下再問一次",
        upgrade: Boolean(data?.upgradeUrl),
      });
    }
    setBusy(false);
  };

  /** 整理這段對話 → 存回書本那一章（存在這支手機，書本那一頁會顯示） */
  const summarize = async () => {
    if (!thread.chapterId || busy) return;
    stopGuideSpeech();
    setSpeaking(null);
    setError(null);
    setBusy(true);
    try {
      const res = await api.ask({
        messages: thread.messages,
        mode: "summary",
        chapterId: thread.chapterId,
        chapterTitle: thread.chapterTitle,
        guide: thread.guide,
      });
      setQuota(res.quota);
      setSummary(res.reply);
      if (saveChapterAskSummary(thread.chapterId, res.reply)) {
        toast.success("已整理好，存回這一章了");
        trackEvent("ask_summary_saved", { chapter: thread.chapterId });
      } else {
        toast.info("整理好了，但這支手機沒辦法存，請先複製下來");
      }
    } catch (e) {
      setError({
        message: e instanceof ApiError && !e.isNetwork ? e.message : "網路不太穩，等一下再試一次",
        upgrade: false,
      });
    }
    setBusy(false);
  };

  const toggleSpeak = (index: number, text: string) => {
    if (speaking === index) {
      stopGuideSpeech();
      setSpeaking(null);
      return;
    }
    const ok = speakGuideParagraphs(speechParagraphs(text), {
      rate: 0.9,
      onEnd: () => setSpeaking(null),
      onError: () => setSpeaking(null),
    });
    setSpeaking(ok ? index : null);
    if (!ok) toast.info("這支手機不支援朗讀，請直接看文字");
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製");
    } catch {
      toast.info("請長按文字，手動複製");
    }
  };

  const newChat = () => {
    stopGuideSpeech();
    setSpeaking(null);
    setSummary(null);
    setError(null);
    setInput("");
    update(EMPTY_THREAD);
  };

  const remaining = quota && quota.limit < 99999 ? Math.max(0, quota.limit - quota.used) : null;
  const guided = thread.mode === "guided";
  const answered = thread.messages.some((m) => m.role === "assistant");

  return (
    <SubPage title="問暖暖" onBack={() => { stopGuideSpeech(); onBack(); }}>
      {thread.chapterTitle ? (
        <div style={{
          background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
          borderRadius: "var(--r-lg)", padding: 14, display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontWeight: 800 }}>📖 書本練習｜{thread.chapterTitle}</div>
          {guided && (
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
              主持模式：暖暖一次只問一題，您回答完再問下一題。做完可以「整理並存回這一章」。
            </div>
          )}
          {thread.guide && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                padding: "4px 10px", borderRadius: 999, background: "var(--surface)",
                border: "1px solid var(--line-strong)", fontSize: "var(--fs-sm)",
              }}>
                📎 帶著我寫的「{thread.guide.label}」
              </span>
              <button
                type="button"
                onClick={() => update({ ...thread, guide: null })}
                style={{ ...smallBtn, minHeight: 32, padding: "2px 10px" }}
              >
                不要帶
              </button>
            </div>
          )}
        </div>
      ) : thread.messages.length === 0 && (
        <div style={{
          background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
          borderRadius: "var(--r-lg)", padding: 16, display: "flex", gap: 12, alignItems: "center",
        }}>
          <Mascot size={60} mood="happy" />
          <div style={{ flex: 1, fontSize: "var(--fs-sm)", color: "var(--ink-1)", lineHeight: 1.6 }}>
            想問什麼都可以，<strong>打字或按「用說的」</strong>都行。問完還可以接著追問。
          </div>
        </div>
      )}

      {/* 對話 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {thread.messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} style={{ ...bubbleBase, alignSelf: "flex-end", background: "var(--primary-soft)", color: "var(--ink-1)" }}>
              {m.text}
            </div>
          ) : (
            <div key={i} style={{ alignSelf: "flex-start", maxWidth: "92%", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", fontWeight: 700 }}>🧡 暖暖</div>
              <div style={{ ...bubbleBase, maxWidth: "100%", background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink-1)" }}>
                {m.text}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {canSpeakGuide() && (
                  <button type="button" onClick={() => toggleSpeak(i, m.text)} style={smallBtn}>
                    {speaking === i ? "⏹ 停止" : "🔊 念給我聽"}
                  </button>
                )}
                <button type="button" onClick={() => copy(m.text)} style={smallBtn}>📋 複製</button>
              </div>
            </div>
          )
        )}
        {busy && (
          <div role="status" style={{ ...bubbleBase, alignSelf: "flex-start", background: "var(--surface)", border: "1px dashed var(--line-strong)", color: "var(--ink-2)" }}>
            暖暖想一下…
          </div>
        )}
        {summary && thread.chapterId && (
          <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, border: "2px solid var(--gold-soft)" }}>
            <div style={{ fontWeight: 800 }}>📝 已存回這一章的整理</div>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{summary}</div>
            <a href={`/smart/chapter/${thread.chapterId}`} className="btn-ghost" style={{ textAlign: "center", textDecoration: "none" }}>
              回到書本這一章 →
            </a>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div role="alert" style={{
          marginTop: 12, padding: 12, borderRadius: "var(--r-md)", background: "#FFF1EE",
          border: "1px solid #F2C2B5", color: "var(--ink-1)", lineHeight: 1.6,
        }}>
          {error.message}
          {error.upgrade && (
            <a href="/pricing" style={{ display: "block", marginTop: 6, color: "var(--primary-deep)", fontWeight: 700 }}>
              想每天問更多？看看方案 →
            </a>
          )}
        </div>
      )}

      {/* 還沒開始：建議問題 */}
      {thread.messages.length === 0 && !thread.chapterTitle && !input && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700 }}>可以這樣問：</div>
          {ASK_STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setInput(s); inputRef.current?.focus(); }}
              style={{ ...smallBtn, textAlign: "left", borderRadius: 12, padding: "10px 14px", color: "var(--ink-1)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 輸入 */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput([...e.target.value].slice(0, ASK_MESSAGE_MAX).join(""))}
          placeholder={thread.messages.length ? "接著問，或回答暖暖的問題…" : "想問暖暖什麼？"}
          rows={thread.chapterTitle && !thread.messages.length ? 6 : 3}
          disabled={busy}
          aria-label="想問暖暖的話"
          style={{
            width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "var(--fs-base)",
            lineHeight: 1.6, fontFamily: "inherit", color: "var(--ink-1)", background: "var(--surface)",
            border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)", resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <DictationButton where="ask" disabled={busy} onText={(t) => setInput((prev) => appendDictation(prev, t, ASK_MESSAGE_MAX))} />
          <button
            type="button"
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="btn-primary"
            style={{ flex: 1, minHeight: 56 }}
          >
            {busy ? "暖暖想一下…" : "送出"}
          </button>
        </div>
        {remaining !== null && (
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", textAlign: "center" }}>
            今天還可以問 {remaining} 題
          </div>
        )}
      </div>

      {(answered || thread.messages.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {thread.chapterId && answered && (
            <button type="button" onClick={summarize} disabled={busy} className="btn-ghost" style={{ width: "100%" }}>
              📝 整理並存回這一章
            </button>
          )}
          <button type="button" onClick={newChat} disabled={busy} style={{ ...smallBtn, alignSelf: "center" }}>
            🆕 開始新的對話
          </button>
        </div>
      )}
      <div style={{ height: 24 }} />
    </SubPage>
  );
}
