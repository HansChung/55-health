"use client";

// ────────────────────────────────────────────────
// 後台「每月成本」：AI 花費（每個功能）、lk888 餘額與實際扣點、固定費用、收入估算、毛利
// 設定（算力價格、匯率、金流手續費、固定費用）在頁面下方改
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api, type AdminCostsResponse } from "@/lib/api-client";
import type { CostSettings } from "@/lib/admin-costs";

const card: React.CSSProperties = { background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" };
const label: React.CSSProperties = { fontSize: 13, color: "#94a3b8" };
const big: React.CSSProperties = { fontSize: 30, fontWeight: 800, color: "#fff", marginTop: 6 };
const small: React.CSSProperties = { fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 };
const input: React.CSSProperties = { background: "#0f172a", color: "#fff", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", color: "#94a3b8", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #334155", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #1e293b", fontSize: 14, color: "#e2e8f0" };

// 小金額看得出差別（一次拍照才幾分錢）
const ntd = (n: number) => (Math.abs(n) >= 100 ? `NT$ ${Math.round(n).toLocaleString()}` : `NT$ ${n.toFixed(Math.abs(n) >= 1 ? 1 : 2)}`);
const pts = (n: number) => (n >= 10 ? n.toFixed(1) : n >= 0.1 ? n.toFixed(2) : n.toFixed(4));

export default function CostsPage() {
  const [month, setMonth] = useState<string | null>(null);
  const [data, setData] = useState<AdminCostsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CostSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setError(null);
    api.adminCosts(month ?? undefined)
      .then((r) => {
        setData(r);
        setDraft(r.settings);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "讀取失敗"));
  }, [month]);

  if (error) return <div style={{ color: "#f87171" }}>{error}</div>;
  if (!data || !draft) return <div>載入中…</div>;

  const s = data.settings;
  const { summary, lk888, revenue } = data;
  // lk888 有整個月的實際扣點就用實際的（再加上不是 lk888 扣的 Google 直連），不然用明細（實際＋估算）
  const fullMonthActual = lk888.monthUsed && lk888.monthUsed.since === `${data.month}-01` ? lk888.monthUsed.used : null;
  const aiPoints = fullMonthActual !== null ? fullMonthActual + summary.externalPoints : summary.points;
  const aiNtd = aiPoints * s.pointNtd;
  const fixedNtd = s.fixed.reduce((n, f) => n + f.usd * s.usdNtd, 0);
  const income = revenue.basic * revenue.prices.basic + revenue.pro * revenue.prices.pro;
  const fees = (income * s.feePct) / 100;
  const total = aiNtd + fixedNtd + fees;
  const maxDaily = Math.max(...summary.daily.map((d) => d.points), 0.0001);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.saveAdminCostSettings(draft);
      setData({ ...data, settings: r.settings });
      setDraft(r.settings);
    } catch (e) {
      alert(e instanceof Error ? e.message : "沒存成功");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="adm-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>每月成本</h1>
        <select value={data.month} onChange={(e) => setMonth(e.target.value)} style={{ ...input, width: "auto" }} aria-label="月份">
          {data.months.map((m) => <option key={m} value={m}>{m.replace("-", " 年 ")} 月</option>)}
        </select>
      </div>

      <div className="adm-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={card}>
          <div style={label}>這個月總成本</div>
          <div style={{ ...big, color: "#fbbf24" }}>{ntd(total)}</div>
          <div style={small}>AI {ntd(aiNtd)}・固定 {ntd(fixedNtd)}・金流 {ntd(fees)}</div>
        </div>
        <div style={card}>
          <div style={label}>AI 花費</div>
          <div style={big}>{pts(aiPoints)} 算力</div>
          <div style={small}>
            {fullMonthActual !== null
              ? `lk888 實際扣點${summary.externalPoints > 0 ? `＋Google 直連 ${pts(summary.externalPoints)}` : ""}`
              : "明細合計（實際＋估算）"}・1 算力 = NT$ {s.pointNtd}
          </div>
        </div>
        <div style={card}>
          <div style={label}>估算收入／毛利</div>
          <div style={{ ...big, color: income - total >= 0 ? "#10b981" : "#f87171" }}>{ntd(income - total)}</div>
          <div style={small}>收入 {ntd(income)}（標準版 {revenue.basic} 人、專業版 {revenue.pro} 人，不含管理員）</div>
        </div>
        <div style={card}>
          <div style={label}>lk888 剩餘算力</div>
          <div style={{ ...big, color: lk888.balance !== null && lk888.daysLeft !== null && lk888.daysLeft < 14 ? "#f87171" : "#fff" }}>
            {lk888.balance === null ? "—" : pts(lk888.balance)}
          </div>
          <div style={small}>
            {lk888.balance === null
              ? "查不到（LK888_API_KEY 沒設？）"
              : lk888.daysLeft === null
                ? `約 ${ntd(lk888.balance * s.pointNtd)}`
                : `約 ${ntd(lk888.balance * s.pointNtd)}，照最近 7 天大約還能用 ${lk888.daysLeft} 天`}
          </div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6 }}>對帳</div>
        <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7 }}>
          明細合計 {pts(summary.points)} 算力（實際 {pts(summary.actualPoints)}、依 token 估算 {pts(summary.estimatedPoints)}），共 {summary.calls.toLocaleString()} 次呼叫，失敗 {summary.failed} 次（失敗平台會退點，不算錢）。
          <br />
          {lk888.monthUsed
            ? `lk888 金鑰從 ${lk888.monthUsed.since} 起實際扣了 ${pts(lk888.monthUsed.used)} 算力${lk888.monthUsed.since === `${data.month}-01` ? "" : "（這個月中間才開始記錄）"}。差額多半是估算誤差，或這個月測試時的呼叫。`
            : "lk888 實際扣點：還沒有每日紀錄（跑完 add-cost-tracking.sql 後，每天午夜會記一次，打開這頁也會記）。"}
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 10 }}>每個功能花多少</div>
        <div className="adm-table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>功能</th><th style={th}>次數</th><th style={th}>失敗</th><th style={th}>算力</th><th style={th}>台幣</th><th style={th}>平均每次</th><th style={th}>估算比例</th>
              </tr>
            </thead>
            <tbody>
              {summary.byFeature.length === 0 && (
                <tr><td style={td} colSpan={7}>這個月還沒有紀錄</td></tr>
              )}
              {summary.byFeature.map((f) => {
                const ok = f.calls - f.failed;
                return (
                  <tr key={f.feature}>
                    <td style={td}>{f.feature}</td>
                    <td style={td}>{f.calls.toLocaleString()}</td>
                    <td style={{ ...td, color: f.failed ? "#f87171" : td.color }}>{f.failed}</td>
                    <td style={td}>{pts(f.points)}</td>
                    <td style={td}>{ntd(f.points * s.pointNtd)}</td>
                    <td style={td}>{ok ? `NT$ ${((f.points * s.pointNtd) / ok).toFixed(3)}` : "—"}</td>
                    <td style={td}>{f.points > 0 ? `${Math.round(f.estimatedShare * 100)}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={small}>「估算比例」＝依 lk888 公布的模型單價（每百萬 token 幾算力）算出來的部分；影片、配音、做歌、我的聲音用平台回報的實際算力。</div>
      </div>

      <div className="adm-split" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 10 }}>每天 AI 花費（台幣）</div>
          {summary.daily.length === 0 ? <div style={small}>還沒有紀錄</div> : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140 }}>
              {summary.daily.map((d) => (
                <div key={d.day} title={`${d.day}：${pts(d.points)} 算力（${ntd(d.points * s.pointNtd)}）`} style={{ flex: 1, minWidth: 4, background: "#10b981", borderRadius: "3px 3px 0 0", height: `${Math.max(2, (d.points / maxDaily) * 100)}%` }} />
              ))}
            </div>
          )}
          {summary.daily.length > 0 && <div style={{ ...small, display: "flex", justifyContent: "space-between" }}><span>{summary.daily[0].day}</span><span>{summary.daily.at(-1)!.day}</span></div>}
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 10 }}>花最多的會員</div>
          {summary.topUsers.length === 0 ? <div style={small}>還沒有紀錄</div> : summary.topUsers.map((u) => (
            <div key={u.user_id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, color: "#cbd5e1", padding: "4px 0", borderBottom: "1px solid #334155" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email ?? u.user_id.slice(0, 8)}</span>
              <span style={{ whiteSpace: "nowrap" }}>{ntd(u.points * s.pointNtd)}・{u.calls} 次</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 12 }}>設定</div>
        <div className="adm-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <label style={label}>1 算力 = 幾台幣
            <input type="number" step="0.01" min="0" value={draft.pointNtd} onChange={(e) => setDraft({ ...draft, pointNtd: Number(e.target.value) })} style={{ ...input, marginTop: 4 }} />
          </label>
          <label style={label}>1 美元 = 幾台幣
            <input type="number" step="0.1" min="1" value={draft.usdNtd} onChange={(e) => setDraft({ ...draft, usdNtd: Number(e.target.value) })} style={{ ...input, marginTop: 4 }} />
          </label>
          <label style={label}>金流手續費（%）
            <input type="number" step="0.1" min="0" value={draft.feePct} onChange={(e) => setDraft({ ...draft, feePct: Number(e.target.value) })} style={{ ...input, marginTop: 4 }} />
          </label>
        </div>
        <div style={{ ...label, margin: "16px 0 6px" }}>每月固定費用（美元）</div>
        {draft.fixed.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={f.name} onChange={(e) => setDraft({ ...draft, fixed: draft.fixed.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} style={{ ...input, flex: 2 }} aria-label="名稱" />
            <input type="number" step="0.01" min="0" value={f.usd} onChange={(e) => setDraft({ ...draft, fixed: draft.fixed.map((x, j) => (j === i ? { ...x, usd: Number(e.target.value) } : x)) })} style={{ ...input, flex: 1 }} aria-label="每月美元" />
            <button type="button" onClick={() => setDraft({ ...draft, fixed: draft.fixed.filter((_, j) => j !== i) })} style={{ ...input, width: "auto", cursor: "pointer" }} aria-label="刪掉">✕</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setDraft({ ...draft, fixed: [...draft.fixed, { name: "", usd: 0 }] })} style={{ ...input, width: "auto", cursor: "pointer" }}>＋ 加一項</button>
          <button type="button" onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", background: "#10b981", border: "none", fontWeight: 700 }}>
            {saving ? "存檔中…" : "儲存設定"}
          </button>
        </div>
      </div>
    </div>
  );
}
