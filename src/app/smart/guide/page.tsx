"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SubPage } from "@/components/sub-page";
import { BLUEPRINT_DIMENSIONS, BLUEPRINT_INSIGHT } from "@/lib/smart-blueprint";
import {
  filterBookGuideSections,
  getBookGuideSections,
} from "@/lib/chapter-opening";

/**
 * 書本首頁／溫暖導讀：章節目錄 + 搜尋
 * QR／首頁「書本練習」→ /smart/guide
 */
export default function SmartGuidePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const allSections = useMemo(() => getBookGuideSections(), []);
  const sections = useMemo(
    () => filterBookGuideSections(deferredQuery, allSections),
    [deferredQuery, allSections]
  );

  const totalChapters = allSections.reduce((n, s) => n + s.chapters.length, 0);
  const matchedCount = sections.reduce((n, s) => n + s.chapters.length, 0);
  const searching = query.trim().length > 0;

  return (
    <div style={{ minHeight: "100dvh", maxWidth: 480, margin: "0 auto", background: "var(--bg, #FAF5EC)" }}>
      <SubPage
        title="書本首頁"
        onBack={() => router.push("/")}
        accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
        footer={
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => router.push("/smart/spark")}
          >
            點亮我的第一個光點
          </button>
        }
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📖</div>
          <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "0 0 6px" }}>
            書本練習目錄
          </h1>
          <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", margin: 0 }}>
            輸入 QR 碼或關鍵字，快速找到章節
          </p>
        </div>

        <label style={{ display: "block", marginBottom: 20 }}>
          <span style={{
            display: "block",
            fontSize: "var(--fs-xs)",
            fontWeight: 800,
            color: "var(--ink-3)",
            marginBottom: 8,
          }}>
            搜尋章節
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例如：0203、點菜、Gemini、決策…"
            enterKeyHint="search"
            autoComplete="off"
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: 14,
              border: "2px solid var(--line-strong)",
              background: "var(--surface)",
              fontSize: "var(--fs-base)",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          <span style={{
            display: "block",
            marginTop: 8,
            fontSize: "var(--fs-xs)",
            color: "var(--ink-3)",
          }}>
            {searching
              ? matchedCount > 0
                ? `找到 ${matchedCount} 個章節`
                : "沒有符合的章節，可改試 QR 碼或更短的關鍵字"
              : `共 ${totalChapters} 個章節可練習`}
          </span>
        </label>

        {!searching && (
          <>
            <div style={{
              fontSize: "var(--fs-base)", color: "var(--ink-1)", lineHeight: 1.7,
              marginBottom: 20,
            }}>
              <p style={{ marginTop: 0 }}>親愛的領航者：</p>
              <p>
                人生下半場，最怕的不是沒有夢想，而是夢想太多、方向太散。
                SMART 55+ 選擇更直覺的方式：<strong>SMART RADAR</strong>。
              </p>
              <p>
                它不是考試表，也不是壓力表，而是一張人生導航儀。
                更重要的是，它不要求您一次填完人生——它從日常開始。
              </p>
              <p style={{
                padding: 14, background: "var(--surface)", borderRadius: 12,
                border: "1px solid var(--line)", fontWeight: 700,
              }}>
                {BLUEPRINT_INSIGHT}
              </p>
            </div>

            <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-2)", marginBottom: 10 }}>
              五個方向
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {BLUEPRINT_DIMENSIONS.map((d) => (
                <div key={d.key} style={{
                  padding: "12px 14px", borderRadius: 12,
                  background: d.color + "14", border: `1px solid ${d.color}44`,
                }}>
                  <div style={{ fontWeight: 800, color: d.color }}>{d.shortLabel}</div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>
                    {d.examples.join("、")}
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 8 }}>
              當方向清楚，圓夢就不再只是口號。它會變成一條看得見、走得到、能持續調整的路。
            </p>
          </>
        )}

        {sections.map((section) => (
          <section key={section.id} style={{ marginTop: 20 }}>
            <div style={{
              fontSize: "var(--fs-sm)", fontWeight: 800, color: section.accent,
              marginBottom: 10,
            }}>
              {section.title}
            </div>
            {!searching && (
              <p style={{
                fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55,
                margin: "0 0 12px", padding: "12px 14px",
                background: "var(--surface)", borderRadius: 12, border: "1px solid var(--line)",
              }}>
                {section.intro}
              </p>
            )}
            {section.chapters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => router.push(ch.href)}
                style={{
                  width: "100%", marginTop: 8, padding: "14px 16px",
                  background: "var(--surface)", border: `2px solid ${ch.color}`,
                  borderRadius: "var(--r-lg)", fontWeight: 700,
                  fontSize: "var(--fs-sm)", color: ch.color, cursor: "pointer",
                  textAlign: "left",
                }}
              >
                章節 {ch.qrCode}｜{ch.label} →
              </button>
            ))}
          </section>
        ))}

        {searching && matchedCount === 0 && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--line)",
            fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55,
          }}>
            找不到「{query.trim()}」。可試試四碼 QR（如 0203），或「點菜」「決策」這類關鍵字。
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                display: "block", marginTop: 12, padding: "12px 14px",
                width: "100%", borderRadius: 12,
                border: "2px solid var(--line-strong)",
                background: "var(--surface-warm, #FFF8EE)",
                fontWeight: 700, fontSize: "var(--fs-sm)", cursor: "pointer",
              }}
            >
              清除搜尋，看全部章節
            </button>
          </div>
        )}
      </SubPage>
    </div>
  );
}
