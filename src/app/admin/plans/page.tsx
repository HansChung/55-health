"use client";

// ────────────────────────────────────────────────
// 後台「方案與次數」：功能開關、每個功能最低方案、各項次數上限、個別帳號開通
// 存檔後各程式實例最多 30 秒生效；長輩的 App 下次打開時套用（伺服器每次都會把關）
// ────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type AdminFeatureGrant } from "@/lib/api-client";
import {
  FEATURE_DEFS,
  FEATURE_GROUPS,
  LIMIT_DEFS,
  LIMIT_MAX,
  TIERS,
  featureLabel,
  tierLabel,
  type FeatureKey,
  type PlanSettings,
  type SubscriptionTier,
} from "@/lib/plan-settings";

const card: React.CSSProperties = { background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 20, marginBottom: 24 };
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px" };
const hint: React.CSSProperties = { fontSize: 13, color: "#94a3b8", margin: "0 0 16px", lineHeight: 1.6 };
const input: React.CSSProperties = {
  background: "#0f172a", color: "#fff", border: "1px solid #334155",
  padding: "8px 10px", borderRadius: 6, fontSize: 14, outline: "none",
};
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle" };

function errText(e: unknown, fallback: string) {
  return e instanceof ApiError && !e.isNetwork ? e.message : fallback;
}

export default function PlansPage() {
  const [settings, setSettings] = useState<PlanSettings | null>(null);
  const [saved, setSaved] = useState<PlanSettings | null>(null);
  const [defaults, setDefaults] = useState<PlanSettings | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [grants, setGrants] = useState<AdminFeatureGrant[]>([]);
  const [grantForm, setGrantForm] = useState({ email: "", feature: "travel_mv" as FeatureKey, tier: "pro" as SubscriptionTier, until: "", note: "" });
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantMsg, setGrantMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    try {
      const r = await api.adminPlanSettings();
      setSettings(r.settings);
      setSaved(r.settings);
      setDefaults(r.defaults);
      setUpdatedAt(r.updatedAt);
      setReady(r.ready);
    } catch (e) {
      setMsg({ ok: false, text: errText(e, "載入失敗，請重新整理") });
    }
  };
  const loadGrants = () => api.adminFeatureGrants().then((r) => setGrants(r.grants)).catch(() => undefined);

  useEffect(() => {
    load();
    loadGrants();
  }, []);

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(saved), [settings, saved]);

  const setFeature = (key: FeatureKey, patch: Partial<PlanSettings["features"][FeatureKey]>) =>
    setSettings((s) => (s ? { ...s, features: { ...s.features, [key]: { ...s.features[key], ...patch } } } : s));
  const setLimit = (key: keyof PlanSettings["limits"], tier: SubscriptionTier, value: string) => {
    const n = value === "" ? 0 : Math.min(LIMIT_MAX, Math.max(0, Math.round(Number(value) || 0)));
    setSettings((s) => (s ? { ...s, limits: { ...s.limits, [key]: { ...s.limits[key], [tier]: n } } } : s));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    try {
      const r = await api.adminSavePlanSettings(settings);
      setSettings(r.settings);
      setSaved(r.settings);
      setUpdatedAt(new Date().toISOString());
      setMsg({ ok: true, text: "已儲存，30 秒內生效（長輩的 App 下次打開時套用）" });
    } catch (e) {
      setMsg({ ok: false, text: errText(e, "儲存失敗，請再試一次") });
    }
    setSaving(false);
  };

  const grant = async () => {
    if (!grantForm.email.trim()) {
      setGrantMsg({ ok: false, text: "請填 email" });
      return;
    }
    setGrantBusy(true);
    setGrantMsg(null);
    try {
      await api.adminGrantFeature({
        email: grantForm.email.trim(),
        feature: grantForm.feature,
        tier: grantForm.tier,
        // 到期日：選的那天結束（台灣時間 23:59:59）
        expiresAt: grantForm.until ? new Date(`${grantForm.until}T23:59:59+08:00`).toISOString() : null,
        note: grantForm.note.trim() || undefined,
      });
      setGrantMsg({ ok: true, text: `已開通「${featureLabel(grantForm.feature)}」給 ${grantForm.email.trim()}` });
      setGrantForm((f) => ({ ...f, email: "", note: "" }));
      loadGrants();
    } catch (e) {
      setGrantMsg({ ok: false, text: errText(e, "開通失敗，請再試一次") });
    }
    setGrantBusy(false);
  };

  const revoke = async (g: AdminFeatureGrant) => {
    if (!confirm(`取消 ${g.email ?? g.user_id} 的「${featureLabel(g.feature as FeatureKey)}」開通？`)) return;
    try {
      await api.adminRevokeFeature(g.id);
      loadGrants();
    } catch (e) {
      alert(errText(e, "取消失敗"));
    }
  };

  if (!settings || !defaults) {
    return <div style={{ color: "#94a3b8" }}>{msg?.text ?? "載入中…"}</div>;
  }

  // 方案開了、次數卻是 0（例如把 MV 開給標準版，但標準版每月 0 首）：提醒一下
  const zeroLimitWarnings = LIMIT_DEFS.filter((l) => {
    const f = settings.features[l.feature];
    if (!f.enabled) return false;
    const minRank = TIERS.indexOf(f.min_tier);
    return TIERS.slice(minRank).some((t) => settings.limits[l.key][t] === 0) && !["photo_ask_free_daily", "clinic_report_free_daily"].includes(l.key);
  });

  return (
    <div style={{ paddingBottom: 96 }}>
      <h1 className="adm-header" style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 8 }}>方案與次數</h1>
      <p style={hint}>
        功能開關、每個功能最低要哪個方案、每個方案可以用幾次。管理員不受限制（關掉的功能管理員仍可測試）。
        {updatedAt ? `上次儲存：${new Date(updatedAt).toLocaleString("zh-TW")}` : "目前用的是預設值（還沒改過）"}
      </p>
      {!ready && (
        <div style={{ ...card, borderColor: "#f59e0b", color: "#fbbf24" }}>
          ⚠️ 資料庫還沒有設定表，改了也存不了。請先在 Supabase SQL Editor 跑 <code>supabase/add-plan-settings.sql</code>。
        </div>
      )}

      {/* 功能開關 */}
      <section style={card}>
        <h2 style={h2}>功能開關</h2>
        <p style={hint}>「關閉」＝所有人都看不到、不能用（做到一半的影片會照常做完）。「最低方案」以下的人按了會看到升級提示。</p>
        {FEATURE_GROUPS.map((g) => (
          <div key={g.id} style={{ marginBottom: 16 }}>
            <div style={{ color: "#cbd5e1", fontWeight: 700, margin: "8px 0" }}>{g.label}</div>
            <div className="adm-table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#0f172a", color: "#94a3b8", fontSize: 12 }}>
                    <th style={th}>功能</th>
                    <th style={th}>開啟</th>
                    <th style={th}>最低方案</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_DEFS.filter((f) => f.group === g.id).map((f) => {
                    const cur = settings.features[f.key];
                    const changed = JSON.stringify(cur) !== JSON.stringify(defaults.features[f.key]);
                    return (
                      <tr key={f.key} style={{ borderTop: "1px solid #334155", opacity: cur.enabled ? 1 : 0.6 }}>
                        <td style={{ ...td, color: "#e2e8f0" }}>
                          {f.label}
                          {changed && <span style={{ color: "#f59e0b", fontSize: 11, marginLeft: 6 }}>已改</span>}
                          {"note" in f && f.note && <div style={{ fontSize: 12, color: "#64748b" }}>{f.note}</div>}
                        </td>
                        <td style={td}>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: cur.enabled ? "#10b981" : "#ef4444", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={cur.enabled}
                              onChange={(e) => setFeature(f.key, { enabled: e.target.checked })}
                              style={{ width: 18, height: 18 }}
                            />
                            {cur.enabled ? "開" : "關"}
                          </label>
                        </td>
                        <td style={td}>
                          <select
                            value={cur.min_tier}
                            onChange={(e) => setFeature(f.key, { min_tier: e.target.value as SubscriptionTier })}
                            style={input}
                            aria-label={`${f.label} 最低方案`}
                          >
                            {TIERS.map((t) => <option key={t} value={t}>{tierLabel(t)}以上</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* 次數上限 */}
      <section style={card}>
        <h2 style={h2}>次數上限</h2>
        <p style={hint}>
          每個方案可以用幾次（0＝不能用；{LIMIT_MAX}＝不限）。每天從台灣時間 0 點算、每月從 1 號算；失敗的不算次數。
          會花平台算力的項目，調高前請先看「Token 用量」。
        </p>
        <div className="adm-table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#94a3b8", fontSize: 12 }}>
                <th style={th}>項目</th>
                <th style={th}>期間</th>
                {TIERS.map((t) => <th key={t} style={th}>{tierLabel(t)}</th>)}
              </tr>
            </thead>
            <tbody>
              {LIMIT_DEFS.map((l) => (
                <tr key={l.key} style={{ borderTop: "1px solid #334155" }}>
                  <td style={{ ...td, color: "#e2e8f0" }}>
                    {l.label}
                    {"note" in l && l.note && <div style={{ fontSize: 12, color: "#64748b" }}>{l.note}</div>}
                  </td>
                  <td style={{ ...td, color: "#94a3b8", whiteSpace: "nowrap" }}>{l.period}</td>
                  {TIERS.map((t) => {
                    const changed = settings.limits[l.key][t] !== defaults.limits[l.key][t];
                    return (
                      <td key={t} style={td}>
                        <input
                          type="number"
                          min={0}
                          max={LIMIT_MAX}
                          value={settings.limits[l.key][t]}
                          onChange={(e) => setLimit(l.key, t, e.target.value)}
                          aria-label={`${l.label} ${tierLabel(t)}`}
                          style={{ ...input, width: 90, borderColor: changed ? "#f59e0b" : "#334155" }}
                          title={`預設 ${defaults.limits[l.key][t]}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {zeroLimitWarnings.length > 0 && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#fbbf24", lineHeight: 1.6 }}>
            ⚠️ 這些功能有開放的方案次數是 0，那個方案的人還是不能用：
            {zeroLimitWarnings.map((l) => `「${l.label}」`).join("、")}
          </div>
        )}
      </section>

      {/* 個別帳號開通 */}
      <section style={card}>
        <h2 style={h2}>個別帳號開通</h2>
        <p style={hint}>讓某個帳號的某個功能當作另一個方案（次數也照那個方案算），不用改他的訂閱。可以設到期日，到期自動失效。</p>
        <div className="adm-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <input
            placeholder="會員 email"
            value={grantForm.email}
            onChange={(e) => setGrantForm((f) => ({ ...f, email: e.target.value }))}
            style={input}
            aria-label="會員 email"
          />
          <select value={grantForm.feature} onChange={(e) => setGrantForm((f) => ({ ...f, feature: e.target.value as FeatureKey }))} style={input} aria-label="功能">
            {FEATURE_DEFS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <select value={grantForm.tier} onChange={(e) => setGrantForm((f) => ({ ...f, tier: e.target.value as SubscriptionTier }))} style={input} aria-label="當作哪個方案">
            {TIERS.map((t) => <option key={t} value={t}>當作{tierLabel(t)}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13 }}>
            到期日
            <input type="date" value={grantForm.until} onChange={(e) => setGrantForm((f) => ({ ...f, until: e.target.value }))} style={input} aria-label="到期日" />
            <span>{grantForm.until ? "" : "（不填＝不會過期）"}</span>
          </label>
          <input
            placeholder="備註（例如：試用一個月）"
            value={grantForm.note}
            maxLength={200}
            onChange={(e) => setGrantForm((f) => ({ ...f, note: e.target.value }))}
            style={{ ...input, gridColumn: "span 2" }}
            aria-label="備註"
          />
        </div>
        <button
          onClick={grant}
          disabled={grantBusy}
          style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
        >
          {grantBusy ? "開通中…" : "開通"}
        </button>
        {grantMsg && <span style={{ marginLeft: 12, color: grantMsg.ok ? "#10b981" : "#ef4444", fontSize: 14 }}>{grantMsg.text}</span>}

        <div className="adm-table-scroll" style={{ marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#94a3b8", fontSize: 12 }}>
                <th style={th}>會員</th>
                <th style={th}>功能</th>
                <th style={th}>當作</th>
                <th style={th}>到期</th>
                <th style={th}>備註</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {grants.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, color: "#64748b" }}>還沒有個別開通</td></tr>
              )}
              {grants.map((g) => {
                const expired = Boolean(g.expires_at && new Date(g.expires_at).getTime() < Date.now());
                return (
                  <tr key={g.id} style={{ borderTop: "1px solid #334155", opacity: expired ? 0.5 : 1 }}>
                    <td style={{ ...td, color: "#e2e8f0" }}>
                      {g.display_name ?? "(未設定)"}
                      <div style={{ fontSize: 12, color: "#64748b" }}>{g.email} · 自己的方案：{tierLabel((g.user_tier as SubscriptionTier) ?? "free")}</div>
                    </td>
                    <td style={{ ...td, color: "#e2e8f0" }}>{featureLabel(g.feature as FeatureKey)}</td>
                    <td style={{ ...td, color: "#f59e0b" }}>{tierLabel(g.tier as SubscriptionTier)}</td>
                    <td style={{ ...td, color: expired ? "#ef4444" : "#94a3b8", whiteSpace: "nowrap" }}>
                      {g.expires_at ? `${new Date(g.expires_at).toLocaleDateString("zh-TW")}${expired ? "（已過期）" : ""}` : "不會過期"}
                    </td>
                    <td style={{ ...td, color: "#94a3b8" }}>{g.note ?? ""}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button onClick={() => revoke(g)} style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer", fontSize: 13 }}>
                        取消
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 儲存列：一直貼在下面 */}
      <div style={{
        position: "sticky", bottom: 0, background: "#0f172a", borderTop: "1px solid #334155",
        padding: "12px 0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <button
          onClick={save}
          disabled={saving || !dirty || !ready}
          style={{
            background: dirty ? "#10b981" : "#334155", color: "#fff", border: "none",
            padding: "12px 24px", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: dirty ? "pointer" : "default",
          }}
        >
          {saving ? "儲存中…" : dirty ? "儲存功能開關與次數" : "沒有變更"}
        </button>
        {dirty && (
          <button onClick={() => setSettings(saved)} style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", padding: "10px 16px", borderRadius: 8, cursor: "pointer" }}>
            放棄變更
          </button>
        )}
        <button
          onClick={() => confirm("全部改回預設值？（還要按儲存才會生效）") && setSettings(defaults)}
          style={{ background: "transparent", color: "#64748b", border: "none", cursor: "pointer", fontSize: 13 }}
        >
          全部改回預設值
        </button>
        {msg && <span style={{ color: msg.ok ? "#10b981" : "#ef4444", fontSize: 14 }}>{msg.text}</span>}
      </div>
    </div>
  );
}
