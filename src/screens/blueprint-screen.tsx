"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { SubPage } from "@/components/sub-page";
import { RadarChart } from "@/components/radar-chart";
import { api } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import type { SmartDimension } from "@/lib/smart";
import {
  BLUEPRINT_DIMENSIONS,
  BLUEPRINT_INSIGHT,
  BLUEPRINT_THINK,
  CHECKLIST_ITEMS,
  blueprintDim,
  glowingDimension,
  needsBoostDimension,
  scoresFromSparkCounts,
  emptySparkCounts,
  type ChecklistId,
  type SmartSpark,
} from "@/lib/smart-blueprint";

import type { SparkSource } from "@/lib/chapter-opening";

interface BlueprintScreenProps {
  onBack: () => void;
  /** QR／深連結：一進來就開光點表單或 chapter3 */
  initialMode?: "home" | "spark" | "chapter3";
  /** 光點來源（chapter0100 = 章節開篇「記下一句話」） */
  sparkSource?: SparkSource;
}

type View = "home" | "spark" | "done";

function emptyChecks(): Record<ChecklistId, boolean> {
  return Object.fromEntries(CHECKLIST_ITEMS.map((c) => [c.id, false])) as Record<
    ChecklistId,
    boolean
  >;
}

export function BlueprintScreen({ onBack, initialMode = "home", sparkSource }: BlueprintScreenProps) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [view, setView] = useState<View>(
    initialMode === "spark" || initialMode === "chapter3" ? "spark" : "home"
  );
  const [source] = useState<SparkSource>(
    sparkSource ?? (initialMode === "chapter3" ? "chapter3" : "spark_card")
  );
  const [sparks, setSparks] = useState<SmartSpark[]>([]);
  const [counts, setCounts] = useState(emptySparkCounts());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // 表單
  const [actionText, setActionText] = useState("");
  const [dimension, setDimension] = useState<SmartDimension | null>(null);
  const [feelingText, setFeelingText] = useState("");
  const [checks, setChecks] = useState<Record<ChecklistId, boolean>>(emptyChecks);
  const [submitting, setSubmitting] = useState(false);
  const [lastSpark, setLastSpark] = useState<SmartSpark | null>(null);
  /** 這次送出前的光點總數，用來判斷文案「第一個」還是「又點亮」 */
  const [sparkCountBeforeSubmit, setSparkCountBeforeSubmit] = useState(0);

  const resetForm = () => {
    setActionText("");
    setDimension(null);
    setFeelingText("");
    setChecks(emptyChecks());
  };

  const openSparkForm = () => {
    resetForm();
    setView("spark");
  };

  const reload = async () => {
    if (authLoading) return;
    if (!user) {
      setSparks([]);
      setCounts(emptySparkCounts());
      setLoadError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.listSmartSparks();
      setSparks(res.sparks);
      setCounts(res.counts);
    } catch (e) {
      console.error(e);
      setLoadError((e as Error).message || "載入光點失敗，請稍後再試");
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const scores = useMemo(() => scoresFromSparkCounts(counts), [counts]);
  const glow = glowingDimension(counts);
  const boost = needsBoostDimension(counts);
  const totalSparks = sparks.length;
  const axes = BLUEPRINT_DIMENSIONS.map((d) => ({
    key: d.key,
    label: d.label,
    color: d.color,
  }));
  const valueLabels = {
    S: counts.S,
    M: counts.M,
    A: counts.A,
    R: counts.R,
    T: counts.T,
  };

  const toggleCheck = (id: ChecklistId) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const submitSpark = async () => {
    if (authLoading) {
      toast.info("正在確認登入狀態，請稍候再按一次");
      return;
    }
    if (!user) {
      toast.error("請先登入，才能保存您的光點");
      return;
    }
    if (!actionText.trim() || !dimension || !feelingText.trim()) {
      toast.error("請填完三個欄位：小事、SMART 面向、感受");
      return;
    }
    setSubmitting(true);
    setSparkCountBeforeSubmit(sparks.length);
    try {
      const checklist = CHECKLIST_ITEMS.filter((c) => checks[c.id]).map((c) => c.id);
      const { spark } = await api.createSmartSpark({
        dimension,
        action_text: actionText.trim(),
        feeling_text: feelingText.trim(),
        checklist,
        source,
      });
      trackEvent("smart_spark", { dimension, source });
      setLastSpark(spark);
      resetForm();
      setView("done");
      await reload();
      toast.success("已點亮一個光點！");
    } catch (e) {
      toast.error((e as Error).message || "送出失敗，請稍後再試");
    }
    setSubmitting(false);
  };

  // ── 完成慶祝 ──
  if (view === "done" && lastSpark) {
    const dim = blueprintDim(lastSpark.dimension);
    const isFirst = sparkCountBeforeSubmit === 0;
    return (
      <SubPage title="圓夢藍圖" onBack={onBack}
        accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => setView("home")}>
              看我的雷達
            </button>
            <button
              type="button"
              onClick={openSparkForm}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 14,
                border: "2px solid var(--line-strong)", background: "var(--surface)",
                fontWeight: 700, fontSize: "var(--fs-sm)", cursor: "pointer",
              }}
            >
              再點亮一個
            </button>
          </div>
        }
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✨</div>
          <h2 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "0 0 8px" }}>
            {isFirst ? "第一個光點已點亮" : "又點亮一個光點"}
          </h2>
          <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", lineHeight: 1.6 }}>
            {BLUEPRINT_THINK}
          </p>
        </div>
        <div style={{
          background: dim.color + "18", border: `1px solid ${dim.color}55`,
          borderRadius: "var(--r-lg)", padding: 18, marginBottom: 16,
        }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: dim.color, marginBottom: 8 }}>
            {dim.shortLabel}
          </div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 6 }}>
            {lastSpark.action_text}
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
            這件事讓我覺得：{lastSpark.feeling_text}
          </div>
        </div>
      </SubPage>
    );
  }

  // ── 光點表單（KU05 核心行動＋Check）──
  if (view === "spark") {
    return (
      <SubPage
        title={
          source === "chapter3"
            ? "Chapter 3 打卡"
            : source === "chapter0100"
              ? "記下一句話"
              : "點亮光點"
        }
        onBack={() => (initialMode === "home" ? setView("home") : onBack())}
        accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
        footer={
          <button
            className="btn-primary"
            style={{ width: "100%", opacity: submitting ? 0.7 : 1 }}
            disabled={submitting}
            onClick={submitSpark}
          >
            {submitting ? "保存中…" : "點亮這個光點"}
          </button>
        }
      >
        <InsightBlock />

        <SectionTitle>3. 一個核心行動</SectionTitle>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 14, lineHeight: 1.5 }}>
          請選出最近一週的一件日常小事。
        </p>

        <FieldLabel>我最近做了一件小事</FieldLabel>
        <textarea
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          placeholder="例如：自己用 Maps 去診所"
          rows={2}
          style={inputStyle}
        />

        <FieldLabel>它比較像 SMART 的</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {BLUEPRINT_DIMENSIONS.map((d) => {
            const selected = dimension === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setDimension(d.key)}
                style={{
                  textAlign: "left", padding: "14px 16px",
                  borderRadius: "var(--r-lg)",
                  border: `2px solid ${selected ? d.color : "var(--line-strong)"}`,
                  background: selected ? d.color + "18" : "var(--surface)",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 800, color: d.color, fontSize: "var(--fs-sm)" }}>
                  {d.shortLabel}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>
                  {d.examples[0]}
                </div>
              </button>
            );
          })}
        </div>

        <FieldLabel>這件事讓我覺得</FieldLabel>
        <textarea
          value={feelingText}
          onChange={(e) => setFeelingText(e.target.value)}
          placeholder="例如：原來我可以自己完成更多事"
          rows={2}
          style={inputStyle}
        />

        <SectionTitle>4. 一組反思 Check</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
          {CHECKLIST_ITEMS.map((c) => (
            <label
              key={c.id}
              style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: 12, background: "var(--surface)",
                borderRadius: 12, border: "1px solid var(--line)",
                cursor: "pointer", fontSize: "var(--fs-sm)", lineHeight: 1.45,
              }}
            >
              <input
                type="checkbox"
                checked={!!checks[c.id]}
                onChange={() => toggleCheck(c.id)}
                style={{ width: 22, height: 22, marginTop: 2, flexShrink: 0 }}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>

        {authLoading && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 12,
            background: "var(--surface-warm, #FBF3E8)", color: "var(--ink-2)",
            fontSize: "var(--fs-sm)",
          }}>
            正在確認登入狀態…
          </div>
        )}
        {!authLoading && !user && (
          <div style={{
            marginTop: 12, padding: 14, borderRadius: 12,
            background: "var(--berry-soft, #F8E6E8)", color: "var(--berry)",
            fontSize: "var(--fs-sm)", lineHeight: 1.5,
          }}>
            <div style={{ marginBottom: 10 }}>請先登入，光點才會保存到您的帳戶。</div>
            <a
              href="/"
              style={{
                display: "block", textAlign: "center", padding: "12px 14px",
                borderRadius: 12, background: "var(--berry)", color: "#fff",
                fontWeight: 800, textDecoration: "none",
              }}
            >
              前往登入
            </a>
          </div>
        )}
      </SubPage>
    );
  }

  // ── 主頁：Insight + Visual + 入口 ──
  return (
    <SubPage
      title="圓夢藍圖"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
      footer={
        <button className="btn-primary" style={{ width: "100%" }} onClick={openSparkForm}>
          {totalSparks === 0 ? "點亮我的第一個光點" : "再點亮一個光點"}
        </button>
      }
    >
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)" }}>
          SMART RADAR 圓夢藍圖
        </div>
        <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: "6px 0 0" }}>
          不只是想，更要看見方向
        </h2>
      </div>

      <InsightBlock />

      <SectionTitle>2. 我的 SMART RADAR 光點</SectionTitle>
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 8, textAlign: "center" }}>
        生活中的小行動，也能慢慢形成一張人生羅盤。
      </p>

      <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 8px" }}>
        {loading || authLoading ? (
          <div style={{ padding: 40, color: "var(--ink-3)" }}>載入中…</div>
        ) : (
          <RadarChart
            scores={scores}
            size={300}
            axes={axes}
            valueLabels={valueLabels}
          />
        )}
      </div>
      <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginBottom: 16 }}>
        數字＝該面向已點亮的光點數　·　R＝安全
      </div>
      {loadError && (
        <div style={{
          marginBottom: 16, padding: 12, borderRadius: 12,
          background: "var(--berry-soft, #F8E6E8)", color: "var(--berry)",
          fontSize: "var(--fs-sm)", lineHeight: 1.5,
        }}>
          {loadError}
          <button
            type="button"
            onClick={() => reload()}
            style={{
              display: "block", marginTop: 8, width: "100%", padding: "10px 12px",
              borderRadius: 10, border: "1px solid currentColor", background: "transparent",
              fontWeight: 700, color: "inherit", cursor: "pointer",
            }}
          >
            再試一次
          </button>
        </div>
      )}
      {!authLoading && !user && (
        <div style={{
          marginBottom: 16, padding: 14, borderRadius: 12,
          background: "var(--surface-warm, #FBF3E8)", color: "var(--ink-2)",
          fontSize: "var(--fs-sm)", lineHeight: 1.5,
        }}>
          登入後才能保存與查看您的光點。
          <a href="/" style={{ display: "inline-block", marginTop: 8, fontWeight: 800, color: "var(--primary, #E8845A)" }}>
            前往登入 →
          </a>
        </div>
      )}

      {totalSparks > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <HintCard
            color={glow.color}
            title={`正在發光：${glow.label}`}
            body={`「${glow.label}」已有 ${counts[glow.key]} 個光點，這是很好的方向。`}
          />
          {counts[boost.key] === 0 && (
            <HintCard
              color={boost.color}
              title={`可以補強：${boost.label}`}
              body={`試試：${boost.examples[0]}`}
            />
          )}
        </div>
      )}

      <SectionTitle>五個方向小提醒</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {BLUEPRINT_DIMENSIONS.map((d) => (
          <div key={d.key} style={{
            display: "flex", gap: 12, alignItems: "center",
            padding: "12px 14px", background: "var(--surface)",
            borderRadius: 12, border: "1px solid var(--line)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: d.color + "22", color: d.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800,
            }}>{d.key}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)" }}>{d.shortLabel}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>{d.examples.join("、")}</div>
            </div>
            <div style={{ fontWeight: 800, color: d.color }}>{counts[d.key]}</div>
          </div>
        ))}
      </div>

      {sparks.length > 0 && (
        <>
          <SectionTitle>最近的光點</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sparks.slice(0, 5).map((s) => {
              const d = blueprintDim(s.dimension);
              return (
                <div key={s.id} style={{
                  padding: 14, borderRadius: 12,
                  background: d.color + "12", border: `1px solid ${d.color}44`,
                }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: d.color }}>
                    {d.shortLabel}
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, marginTop: 4 }}>
                    {s.action_text}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 4 }}>
                    {s.feeling_text}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </SubPage>
  );
}

function InsightBlock() {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: "var(--r-lg)", padding: 16, marginBottom: 20,
    }}>
      <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
        1. 一句 Insight
      </div>
      <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.55, marginBottom: 10 }}>
        {BLUEPRINT_INSIGHT}
      </div>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
        想一想：{BLUEPRINT_THINK}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-2)",
      margin: "4px 0 10px",
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function HintCard({ color, title, body }: { color: string; title: string; body: string }) {
  return (
    <div style={{
      background: color + "18", border: `1px solid ${color}55`,
      borderRadius: "var(--r-lg)", padding: 14,
    }}>
      <div style={{ fontWeight: 800, color, fontSize: "var(--fs-sm)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "2px solid var(--line-strong)",
  background: "var(--surface)",
  fontSize: "var(--fs-base)",
  fontFamily: "inherit",
  marginBottom: 16,
  resize: "vertical",
  boxSizing: "border-box",
};
