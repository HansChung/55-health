"use client";

import { useEffect, useState } from "react";
import { api, type ApiConfigRow } from "@/lib/api-client";

export default function ApiConfigsPage() {
  const [configs, setConfigs] = useState<ApiConfigRow[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const { configs } = await api.adminListApiConfigs();
      setConfigs(configs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>API 設定</h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: "#3b82f6", color: "#fff", border: "none",
          padding: "10px 16px", borderRadius: 8, fontWeight: 600,
          cursor: "pointer", fontSize: 14,
        }}>
          {showForm ? "取消" : "+ 新增"}
        </button>
      </div>

      <div style={{
        background: "#1e3a8a", padding: 16, borderRadius: 8,
        color: "#dbeafe", fontSize: 13, marginBottom: 16,
      }}>
        💡 此處設定的 API keys 會加密儲存在資料庫，可作為 env vars 的備援。實際運行時優先使用 env vars。
      </div>

      {showForm && <ConfigForm onSaved={() => { load(); setShowForm(false); }} />}

      <div style={{
        background: "#1e293b", borderRadius: 12,
        border: "1px solid #334155", overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0f172a", color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
              <th style={{ padding: "12px 16px" }}>Provider</th>
              <th>預設 Model</th>
              <th>狀態</th>
              <th>月預算</th>
              <th>備註</th>
              <th>更新時間</th>
            </tr>
          </thead>
          <tbody>
            {configs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>尚未設定</td></tr>
            ) : configs.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #1e293b", fontSize: 14 }}>
                <td style={{ padding: "12px 16px", color: "#e2e8f0", fontWeight: 600 }}>
                  {providerEmoji(c.provider)} {c.provider}
                </td>
                <td style={{ color: "#94a3b8" }}>{c.model_default ?? "—"}</td>
                <td>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    padding: "2px 8px", borderRadius: 999,
                    background: c.enabled ? "#065f46" : "#7f1d1d",
                    color: c.enabled ? "#6ee7b7" : "#fecaca",
                  }}>
                    {c.enabled ? "啟用" : "停用"}
                  </span>
                </td>
                <td style={{ color: "#94a3b8" }}>{c.monthly_budget_usd ? `$${c.monthly_budget_usd}` : "—"}</td>
                <td style={{ color: "#64748b", fontSize: 12 }}>{c.notes ?? "—"}</td>
                <td style={{ color: "#64748b", fontSize: 12 }}>{new Date(c.updated_at).toLocaleDateString("zh-TW")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function providerEmoji(p: string) {
  return ({ gemini: "🟢", openai: "🟣", anthropic: "🟠" } as Record<string, string>)[p] ?? "⚪";
}

function ConfigForm({ onSaved }: { onSaved: () => void }) {
  const [provider, setProvider] = useState<"gemini" | "openai" | "anthropic">("gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/api-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
          model_default: model || undefined,
          monthly_budget_usd: budget ? Number(budget) : undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "新增失敗");
      }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  };

  return (
    <div style={{
      background: "#1e293b", padding: 20, borderRadius: 12,
      border: "1px solid #334155", marginBottom: 16,
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
    }}>
      <Field label="Provider">
        <select value={provider} onChange={(e) => setProvider(e.target.value as "gemini" | "openai" | "anthropic")} style={inputStyle}>
          <option value="gemini">Google Gemini</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </Field>
      <Field label="預設 Model">
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={provider === "gemini" ? "gemini-2.5-pro" : "gpt-realtime-2"} style={inputStyle} />
      </Field>
      <Field label="API Key" wide>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-... / AIza..." style={inputStyle} />
      </Field>
      <Field label="月預算 USD">
        <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="100" style={inputStyle} />
      </Field>
      <Field label="備註">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="主要 / 備援" style={inputStyle} />
      </Field>
      {error && (
        <div style={{ gridColumn: "span 2", color: "#fecaca", fontSize: 13 }}>{error}</div>
      )}
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} disabled={saving || !apiKey} style={{
          background: "#10b981", color: "#fff", border: "none",
          padding: "10px 20px", borderRadius: 8, fontWeight: 600,
          cursor: "pointer", opacity: saving || !apiKey ? 0.5 : 1,
        }}>
          {saving ? "儲存中…" : "儲存"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label style={{ gridColumn: wide ? "span 2" : undefined }}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#0f172a", color: "#fff",
  border: "1px solid #334155", padding: "8px 12px",
  borderRadius: 6, fontSize: 14, outline: "none",
};
