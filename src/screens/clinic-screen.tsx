"use client";

// ────────────────────────────────────────────────
// 看診小幫手
// 回診前：說哪裡不舒服、想問什麼 → 暖暖整理成看診小卡（帶上正在吃的藥、最近量的血壓血糖），可以給醫生看、列印、傳給家人
// 看完診：記下醫生交代的話、拍檢驗報告 → 暖暖逐項白話說明，和上次比較。只說明、不診斷
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { DictationButton } from "@/components/dictation-button";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { appendDictation } from "@/lib/dictation";
import { compressImage } from "@/lib/image-utils";
import { photoPayload } from "@/lib/direct-upload";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import {
  CLINIC_BRING,
  CLINIC_DEPARTMENT_MAX,
  CLINIC_NOTES_MAX,
  CLINIC_QUESTION_PRESETS,
  CLINIC_SINCE_OPTIONS,
  CLINIC_TEXT_MAX,
  LAB_FLAG_META,
  clinicCardText,
  compareLab,
  labSpeech,
  metricsLines,
  previousReport,
  type ClinicVisit,
} from "@/lib/clinic";

type View = "list" | "prepare" | "detail";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "var(--fs-base)",
  lineHeight: 1.6, fontFamily: "inherit", color: "var(--ink-1)", background: "var(--surface)",
  border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
};
const label: React.CSSProperties = { fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "16px 0 6px" };
const hiddenInput: React.CSSProperties = { position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" };

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "8px 14px", minHeight: 44, borderRadius: 999, cursor: "pointer",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `2px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-1)",
  };
}

function formatDay(d: string) {
  const [y, m, dd] = d.split("-");
  return y && m && dd ? `${Number(m)}/${Number(dd)}` : d;
}

const DISCLAIMER = "暖暖只幫你整理、說明，不是診斷。身體不舒服請問醫生；胸痛、呼吸困難、突然單側無力請馬上打 119。";

export function ClinicScreen({ onBack }: { onBack: () => void }) {
  const toast = useToast();
  const [view, setView] = useState<View>("list");
  const [visits, setVisits] = useState<ClinicVisit[] | null>(null);
  const [current, setCurrent] = useState<ClinicVisit | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // 準備表單
  const [department, setDepartment] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [since, setSince] = useState("");
  const [questions, setQuestions] = useState("");
  // 看診中打勾（只在這支手機）
  const [asked, setAsked] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState("");
  const [speaking, setSpeaking] = useState<"card" | "report" | null>(null);

  useEffect(() => {
    api.listClinicVisits()
      .then((r) => setVisits(r.visits))
      .catch(() => setVisits([]));
    return () => stopGuideSpeech();
  }, []);

  const fail = (e: unknown, fallback: string) => toast.error(e instanceof ApiError && !e.isNetwork ? e.message : fallback);

  const upsert = (v: ClinicVisit) => {
    setVisits((vs) => [v, ...(vs ?? []).filter((x) => x.id !== v.id)].sort((a, b) =>
      a.visit_date === b.visit_date ? b.created_at.localeCompare(a.created_at) : b.visit_date.localeCompare(a.visit_date)
    ));
    setCurrent(v);
  };

  const open = (v: ClinicVisit) => {
    stopGuideSpeech();
    setSpeaking(null);
    setAsked(new Set());
    setNotes(v.doctor_notes ?? "");
    setCurrent(v);
    setView("detail");
  };

  const prepare = async () => {
    if (busy) return;
    if (!symptoms.trim() && !questions.trim()) {
      toast.info("寫一下哪裡不舒服，或想問醫生什麼");
      return;
    }
    setBusy("暖暖正在整理…");
    try {
      const res = await api.prepareClinicVisit({ department, symptoms, since, questions });
      trackEvent("clinic_card", { since: Boolean(since), department: Boolean(department) });
      upsert(res.visit);
      open(res.visit);
      setDepartment(""); setSymptoms(""); setSince(""); setQuestions("");
    } catch (e) {
      fail(e, "暖暖這次沒整理好，請再按一次");
    }
    setBusy(null);
  };

  const addQuestion = (q: string) =>
    setQuestions((prev) => (prev.includes(q) ? prev : [...(prev ? `${prev}\n${q}` : q)].slice(0, CLINIC_TEXT_MAX).join("")));

  const readReport = async (file: File | undefined, visitId: string | "new") => {
    if (!file || busy) return;
    setBusy("暖暖正在看報告，大約 15 秒…");
    try {
      // 報告字小：長邊留大一點
      const dataUrl = await compressImage(file, { maxSide: 2000, quality: 0.85 });
      const res = await api.readClinicReport(visitId, await photoPayload(dataUrl));
      trackEvent("clinic_report", { items: res.visit.report?.items.length ?? 0 });
      upsert(res.visit);
      open(res.visit);
    } catch (e) {
      fail(e, "暖暖這次沒看清楚，請再拍一次");
    }
    setBusy(null);
  };

  const saveNotes = async () => {
    if (!current || busy) return;
    setBusy("存檔中…");
    try {
      const res = await api.updateClinicVisit(current.id, { doctorNotes: notes });
      upsert(res.visit);
      toast.success("記下來了");
    } catch (e) {
      fail(e, "沒存成功，請再試一次");
    }
    setBusy(null);
  };

  const remove = async () => {
    if (!current || busy || !confirm("要刪掉這次看診的紀錄嗎？")) return;
    try {
      await api.deleteClinicVisit(current.id);
      setVisits((vs) => (vs ?? []).filter((v) => v.id !== current.id));
      setCurrent(null);
      setView("list");
    } catch (e) {
      fail(e, "刪除沒成功，請再試一次");
    }
  };

  const speak = (kind: "card" | "report", parts: string[]) => {
    if (speaking === kind) {
      stopGuideSpeech();
      setSpeaking(null);
      return;
    }
    const ok = speakGuideParagraphs(parts, { rate: 0.9, onEnd: () => setSpeaking(null), onError: () => setSpeaking(null) });
    setSpeaking(ok ? kind : null);
    if (!ok) toast.info("這支手機不支援朗讀，請直接看文字");
  };

  const shareCard = async () => {
    if (!current) return;
    const text = clinicCardText(current);
    try {
      if (navigator.share) await navigator.share({ title: "看診小卡", text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("複製好了，貼到 LINE 給家人");
      }
    } catch { /* 按了取消 */ }
  };

  const printCard = () => {
    document.body.classList.add("printing-clinic");
    const done = () => {
      document.body.classList.remove("printing-clinic");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  const back = () => {
    stopGuideSpeech();
    setSpeaking(null);
    if (view === "list") onBack();
    else setView("list");
  };

  return (
    <SubPage title="看診小幫手" onBack={back}>
      <style>{`
        @media print {
          body.printing-clinic * { visibility: hidden !important; }
          body.printing-clinic .clinic-print, body.printing-clinic .clinic-print * { visibility: visible !important; }
          body.printing-clinic .clinic-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; font-size: 18px; }
          body.printing-clinic .clinic-no-print { display: none !important; }
        }
      `}</style>

      {busy && (
        <div className="card" role="status" style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center" }}>
          <Mascot size={48} mood="thinking" />
          <div style={{ fontWeight: 700 }}>{busy}</div>
        </div>
      )}

      {view === "list" && (
        <>
          <div style={{ background: "var(--surface-warm)", border: "1px solid var(--gold-soft)", borderRadius: "var(--r-lg)", padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <Mascot size={60} mood="happy" />
            <div style={{ flex: 1, fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
              看醫生時間很短，常常忘了要問什麼。<strong>回診前</strong>暖暖幫你整理成小卡，<strong>看完診</strong>拍檢驗報告，暖暖用白話講給你聽。
            </div>
          </div>
          <button type="button" className="btn-primary" style={{ width: "100%", marginTop: 16, minHeight: 64 }} onClick={() => setView("prepare")} disabled={Boolean(busy)}>
            📝 回診前：整理要跟醫生說的話
          </button>
          <label className="btn-ghost" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", marginTop: 12, minHeight: 64, position: "relative", boxSizing: "border-box" }}>
            <input type="file" accept="image/*" onChange={(e) => { readReport(e.target.files?.[0], "new"); e.target.value = ""; }} style={hiddenInput} disabled={Boolean(busy)} />
            📄 看完診：拍檢驗報告給暖暖看
          </label>

          <div style={{ fontWeight: 800, margin: "24px 0 10px" }}>看診紀錄</div>
          {visits === null ? (
            <div style={{ color: "var(--ink-2)", textAlign: "center", padding: 20 }}>載入中…</div>
          ) : visits.length === 0 ? (
            <div style={{ color: "var(--ink-2)", textAlign: "center", padding: 20, border: "1px dashed var(--line-strong)", borderRadius: "var(--r-lg)" }}>
              還沒有紀錄。下次回診前先來這裡整理一下吧。
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visits.map((v) => {
                const off = v.report?.items.filter((i) => i.flag === "high" || i.flag === "low").length ?? 0;
                return (
                  <button key={v.id} type="button" onClick={() => open(v)} className="card" style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, textAlign: "left", width: "100%", cursor: "pointer", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: 28 }} aria-hidden="true">{v.report ? "📄" : "🩺"}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 800 }}>
                        {formatDay(v.visit_date)}{v.department ? `・${v.department}` : ""}
                      </span>
                      <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>
                        {[v.prep ? `看診小卡：${v.prep.card.chief}` : null, v.report ? `檢驗報告 ${v.report.items.length} 項${off ? `，${off} 項不在範圍` : ""}` : null].filter(Boolean).join("｜")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 20, lineHeight: 1.6 }}>{DISCLAIMER}</div>
        </>
      )}

      {view === "prepare" && (
        <div>
          <div style={label}>看哪一科？（可不填）</div>
          <input value={department} onChange={(e) => setDepartment([...e.target.value].slice(0, CLINIC_DEPARTMENT_MAX).join(""))} placeholder="例如：心臟內科、骨科、家醫科" style={inputStyle} aria-label="科別" />

          <div style={label}>哪裡不舒服？</div>
          <textarea value={symptoms} onChange={(e) => setSymptoms([...e.target.value].slice(0, CLINIC_TEXT_MAX).join(""))} rows={4} placeholder="例如：晚上膝蓋會痛，走樓梯更痛，睡不太好" style={{ ...inputStyle, resize: "vertical" }} aria-label="哪裡不舒服" />
          <div style={{ marginTop: 8 }}>
            <DictationButton where="clinic" onText={(t) => setSymptoms((p) => appendDictation(p, t, CLINIC_TEXT_MAX))} />
          </div>

          <div style={label}>多久了？</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CLINIC_SINCE_OPTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setSince(since === s ? "" : s)} aria-pressed={since === s} style={chip(since === s)}>{s}</button>
            ))}
          </div>

          <div style={label}>想問醫生什麼？</div>
          <textarea value={questions} onChange={(e) => setQuestions([...e.target.value].slice(0, CLINIC_TEXT_MAX).join(""))} rows={3} placeholder="一行一個問題" style={{ ...inputStyle, resize: "vertical" }} aria-label="想問醫生的問題" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {CLINIC_QUESTION_PRESETS.map((q) => (
              <button key={q} type="button" onClick={() => addQuestion(q)} style={chip(questions.includes(q))}>＋ {q}</button>
            ))}
            <DictationButton where="clinic" onText={(t) => setQuestions((p) => appendDictation(p, t, CLINIC_TEXT_MAX))} />
          </div>

          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 14, lineHeight: 1.6 }}>
            小卡上會自動帶上你在「慢性病與用藥」填的藥，和最近 30 天量的血壓、血糖。
          </div>
          <button type="button" className="btn-primary" style={{ width: "100%", marginTop: 16, minHeight: 56 }} onClick={prepare} disabled={Boolean(busy)}>
            ✨ 請暖暖整理成看診小卡
          </button>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 14, lineHeight: 1.6 }}>{DISCLAIMER}</div>
        </div>
      )}

      {view === "detail" && current && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {current.prep && (
            <div className="card clinic-print" style={{ padding: 18, border: "2px solid var(--primary)" }}>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 700 }}>
                🩺 看診小卡｜{formatDay(current.visit_date)}{current.department ? `・${current.department}` : ""}
              </div>
              <div style={{ fontSize: "var(--fs-xl)", fontWeight: 900, lineHeight: 1.4, marginTop: 6 }}>{current.prep.card.chief}</div>
              {current.prep.card.points.length > 0 && (
                <ul style={{ margin: "10px 0 0", paddingLeft: 22, lineHeight: 1.7, fontSize: "var(--fs-base)" }}>
                  {current.prep.card.points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              )}
              {current.prep.meds.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800 }}>💊 正在吃的藥</div>
                  <div style={{ lineHeight: 1.7 }}>{current.prep.meds.map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ""}${m.time ? `（${m.time}）` : ""}`).join("、")}</div>
                </div>
              )}
              {metricsLines(current.prep.metrics).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800 }}>📈 自己量的</div>
                  {metricsLines(current.prep.metrics).map((l, i) => <div key={i} style={{ lineHeight: 1.7 }}>{l}</div>)}
                </div>
              )}
              {current.prep.card.questions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800 }}>❓ 想問醫生（問完可以打勾）</div>
                  {current.prep.card.questions.map((q, i) => (
                    <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", fontSize: "var(--fs-base)", lineHeight: 1.6, textDecoration: asked.has(i) ? "line-through" : "none", color: asked.has(i) ? "var(--ink-3)" : "var(--ink-1)" }}>
                      <input
                        type="checkbox"
                        className="clinic-no-print"
                        checked={asked.has(i)}
                        onChange={() => setAsked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                        style={{ width: 24, height: 24, marginTop: 2, flexShrink: 0 }}
                      />
                      {i + 1}. {q}
                    </label>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>記得帶：{CLINIC_BRING.join("、")}</div>
            </div>
          )}

          {current.prep && (
            <div className="clinic-no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={printCard}>🖨️ 列印</button>
              <button type="button" className="btn-ghost" onClick={shareCard}>💬 傳給家人</button>
              {canSpeakGuide() && (
                <button type="button" className="btn-ghost" style={{ gridColumn: "1 / -1" }} onClick={() => speak("card", clinicCardText(current).split("\n"))}>
                  {speaking === "card" ? "⏹ 停止" : "🔊 念給我聽"}
                </button>
              )}
            </div>
          )}

          <div className="clinic-no-print" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)" }}>看完診了</div>
            <div style={label}>醫生交代的話（可以用說的）</div>
            <textarea value={notes} onChange={(e) => setNotes([...e.target.value].slice(0, CLINIC_NOTES_MAX).join(""))} rows={3} placeholder="例如：藥再吃兩個月，三個月後抽血，少吃鹹" style={{ ...inputStyle, resize: "vertical" }} aria-label="醫生交代的話" />
            <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
              <DictationButton where="clinic" onText={(t) => setNotes((p) => appendDictation(p, t, CLINIC_NOTES_MAX))} />
              <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={saveNotes} disabled={Boolean(busy) || notes === (current.doctor_notes ?? "")}>💾 記下來</button>
            </div>
            {!current.report && (
              <label className="btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", marginTop: 14, minHeight: 56, position: "relative", boxSizing: "border-box" }}>
                <input type="file" accept="image/*" onChange={(e) => { readReport(e.target.files?.[0], current.id); e.target.value = ""; }} style={hiddenInput} disabled={Boolean(busy)} />
                📄 拍檢驗報告給暖暖看
              </label>
            )}
          </div>

          {current.report && (
            <ReportCard
              visit={current}
              visits={visits ?? []}
              speaking={speaking === "report"}
              onSpeak={() => speak("report", labSpeech(current.report!))}
            />
          )}

          <div className="clinic-no-print" style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", lineHeight: 1.6 }}>{DISCLAIMER}</div>
          <button type="button" className="clinic-no-print" onClick={remove} style={{ alignSelf: "center", padding: "8px 14px", minHeight: 44, border: "none", background: "none", color: "var(--ink-3)", cursor: "pointer" }}>
            🗑️ 刪掉這次紀錄
          </button>
        </div>
      )}
    </SubPage>
  );
}

function ReportCard({ visit, visits, speaking, onSpeak }: { visit: ClinicVisit; visits: ClinicVisit[]; speaking: boolean; onSpeak: () => void }) {
  const r = visit.report!;
  const prev = previousReport(visits, visit);
  const cmp = compareLab(r, prev);
  const arrow = { up: "↑ 比上次高", down: "↓ 比上次低", same: "＝ 和上次差不多" } as const;
  return (
    <div className="card clinic-no-print" style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: "var(--fs-lg)" }}>📄 {r.title}{r.date ? `（${r.date}）` : ""}</div>
      {r.summary && <div style={{ marginTop: 8, lineHeight: 1.7, fontSize: "var(--fs-base)" }}>{r.summary}</div>}
      {prev && cmp.size > 0 && (
        <div style={{ marginTop: 8, fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>和上次（{prev.date}）的報告比較了 {cmp.size} 項</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {r.items.map((i, k) => {
          const meta = LAB_FLAG_META[i.flag];
          const c = cmp.get(i.name);
          const off = i.flag === "high" || i.flag === "low";
          return (
            <div key={k} style={{ padding: 12, borderRadius: "var(--r-md)", background: off ? "var(--berry-soft)" : "var(--surface-warm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800 }}>{i.name}</span>
                <span style={{ fontWeight: 900, fontSize: "var(--fs-lg)", color: off ? meta.color : "var(--ink-1)" }}>
                  {i.value} <span style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--ink-2)" }}>{i.unit}</span>
                </span>
              </div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>
                {i.range ? `參考範圍 ${i.range}` : "報告沒有參考範圍"}{meta.label ? `｜${meta.label}` : ""}
                {c ? `｜上次 ${c.prevValue}${c.trend ? `，${arrow[c.trend]}` : ""}` : ""}
              </div>
              {i.plain && <div style={{ fontSize: "var(--fs-sm)", marginTop: 4, lineHeight: 1.6 }}>{i.plain}</div>}
            </div>
          );
        })}
      </div>
      {r.ask_doctor.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800 }}>❓ 可以問醫生</div>
          <ul style={{ margin: "6px 0 0", paddingLeft: 22, lineHeight: 1.7 }}>{r.ask_doctor.map((q, k) => <li key={k}>{q}</li>)}</ul>
        </div>
      )}
      {canSpeakGuide() && (
        <button type="button" className="btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={onSpeak}>{speaking ? "⏹ 停止" : "🔊 念給我聽"}</button>
      )}
    </div>
  );
}
