"use client";

// ────────────────────────────────────────────────
// 書本章節最上面的「一步完成」：一句話＋一個大按鈕，直接用暖暖做完；原本的長篇內容收在「想多了解這一節」
// ────────────────────────────────────────────────

import { QUICK_BUTTON, chapterQuick, quickHref, quickPrompt } from "@/lib/chapter-quick";
import { trackEvent } from "@/lib/telemetry";

export function ChapterQuickCard({
  chapterId,
  title,
  moreOpen,
  onToggleMore,
  onAsk,
  onPhotoAsk,
  onOpen,
}: {
  chapterId: string;
  title: string;
  moreOpen: boolean;
  onToggleMore: () => void;
  /** 帶著問題打開「問暖暖」（guided＝一題一題帶） */
  onAsk: (prompt: string, guided: boolean) => void;
  onPhotoAsk: (question: string) => void;
  onOpen: (href: string) => void;
}) {
  const q = chapterQuick(chapterId, title);
  const prompt = quickPrompt(q);
  const fillIn = (q.action === "ask" || q.action === "photo") && /[：:]$/.test((q.prompt ?? "").trim());

  const go = () => {
    trackEvent("chapter_quick", { chapter: chapterId, action: q.action });
    if (q.action === "ask" || q.action === "guided") return onAsk(prompt, q.action === "guided");
    if (q.action === "photo") return onPhotoAsk(prompt);
    const href = quickHref(q.action, chapterId);
    if (href) onOpen(href);
  };

  const hint =
    q.action === "guided" ? "暖暖會一次問一題，你回答就好，不用先讀完下面的說明"
    : q.action === "ask" ? (fillIn ? "問題開頭幫你寫好了，補上你想問的，再按「送出」" : "問題幫你寫好了，按「送出」就好")
    : q.action === "photo" ? "拍一張照片，問題幫你寫好了"
    : "點一下就打開，不用先讀完下面的說明";

  return (
    <section aria-label="一步完成" style={{ marginBottom: 20 }}>
      <div className="card" style={{
        padding: 20, border: "2px solid var(--primary-soft)",
        background: "linear-gradient(135deg, #FFF3E2 0%, #FFFFFF 100%)",
      }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)", marginBottom: 6 }}>
          ⭐ 這一節只要做一件事
        </div>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, lineHeight: 1.45, color: "var(--ink-1)" }}>
          {q.goal}
        </div>
        <button
          type="button"
          onClick={go}
          className="btn-primary"
          style={{ width: "100%", marginTop: 14, minHeight: 64, fontSize: "var(--fs-lg)" }}
        >
          {q.button ?? QUICK_BUTTON[q.action]}
        </button>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
          {hint}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleMore}
        aria-expanded={moreOpen}
        className="btn-ghost"
        style={{ width: "100%", marginTop: 12, minHeight: 52 }}
      >
        {moreOpen ? "收起這一節的說明 ▲" : "想多了解這一節 ▼"}
      </button>
    </section>
  );
}
