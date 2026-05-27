"use client";

import { useEffect, useState } from "react";
import { api, type AdminPartnerCampaign } from "@/lib/api-client";

const TAG_OPTIONS = [
  { id: "hypertension", label: "高血壓" },
  { id: "diabetes", label: "糖尿病" },
  { id: "prediabetes", label: "糖尿病前期" },
  { id: "cholesterol", label: "高血脂" },
  { id: "exercise", label: "運動不足" },
  { id: "general", label: "一般" },
];

export default function PartnerCampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdminPartnerCampaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const { campaigns } = await api.adminListPartnerCampaigns();
      setCampaigns(campaigns);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => { load(); }, []);
  const totalImpressions = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.impressions ?? 0), 0);
  const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks ?? 0), 0);
  const activeCampaigns = campaigns.filter((campaign) => campaign.active).length;
  const totalCtr = formatCtr(totalClicks, totalImpressions);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>合作活動</h1>
        <button onClick={() => setShowForm(!showForm)} style={primaryButton}>
          {showForm ? "取消" : "+ 新增活動"}
        </button>
      </div>

      <div style={{ background: "#1e3a8a", padding: 16, borderRadius: 8, color: "#dbeafe", fontSize: 13, marginBottom: 16 }}>
        合作內容會在前台標示為「合作推薦」，避免和醫療建議混淆。
      </div>

      {error && <div style={{ color: "#fecaca", marginBottom: 12 }}>錯誤：{error}</div>}
      {showForm && <CampaignForm onSaved={() => { setShowForm(false); load(); }} />}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}>
        <StatCard label="活動數" value={`${campaigns.length}`} hint={`啟用 ${activeCampaigns} 個`} />
        <StatCard label="總曝光" value={totalImpressions.toLocaleString()} hint="前台顯示次數" />
        <StatCard label="總點擊" value={totalClicks.toLocaleString()} hint="使用者點進活動" />
        <StatCard label="整體 CTR" value={totalCtr} hint="點擊 / 曝光" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {campaigns.map((campaign) => {
          const impressions = campaign.metrics?.impressions ?? 0;
          const clicks = campaign.metrics?.clicks ?? 0;
          const ctr = formatCtr(clicks, impressions);
          return (
          <div key={campaign.id} style={{
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: 12, padding: 18,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: campaign.active ? "#6ee7b7" : "#fecaca" }}>
                    {campaign.active ? "啟用" : "停用"}
                  </span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{campaign.partner_name}</span>
                </div>
                <div style={{ fontSize: 18, color: "#fff", fontWeight: 700 }}>{campaign.title}</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, maxWidth: 720 }}>
                  {campaign.description}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {(campaign.tags ?? []).map((tag) => (
                    <span key={tag} style={{ fontSize: 11, color: "#bfdbfe", background: "#1e3a8a", borderRadius: 999, padding: "3px 8px" }}>
                      {labelTag(tag)}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 160 }}>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>曝光 {impressions.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>點擊 {clicks.toLocaleString()}</div>
                <div style={{ fontSize: 18, color: "#fff", fontWeight: 800, marginTop: 6 }}>CTR {ctr}</div>
                <button
                  onClick={async () => {
                    await api.adminUpdatePartnerCampaign(campaign.id, { active: !campaign.active });
                    load();
                  }}
                  style={{ ...smallButton, marginTop: 10 }}
                >
                  {campaign.active ? "停用" : "啟用"}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("確定刪除這個合作活動？")) return;
                    await api.adminDeletePartnerCampaign(campaign.id);
                    load();
                  }}
                  style={{ ...smallButton, marginTop: 8, color: "#fecaca", borderColor: "#7f1d1d" }}
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
          );
        })}
        {campaigns.length === 0 && (
          <div style={{ padding: 32, color: "#64748b", textAlign: "center", background: "#1e293b", borderRadius: 12 }}>
            尚未建立合作活動
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, color: "#fff", fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{hint}</div>
    </div>
  );
}

function formatCtr(clicks: number, impressions: number) {
  if (impressions <= 0) return "0.0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

function CampaignForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [tags, setTags] = useState<string[]>(["general"]);
  const [priority, setPriority] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api.adminCreatePartnerCampaign({
        title,
        description,
        partner_name: partnerName,
        cta_url: ctaUrl || undefined,
        cta_label: "了解活動",
        tags,
        priority: Number(priority) || 0,
        active: true,
      });
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
      <Field label="活動標題">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="低鈉健康便當 9 折" style={inputStyle} />
      </Field>
      <Field label="合作方">
        <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="某某健康餐盒" style={inputStyle} />
      </Field>
      <Field label="說明" wide>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="適合需要少鹽飲食的長輩，本週限定優惠。" style={{ ...inputStyle, minHeight: 90 }} />
      </Field>
      <Field label="活動連結">
        <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
      </Field>
      <Field label="排序權重">
        <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="適合族群" wide>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TAG_OPTIONS.map((option) => {
            const active = tags.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => setTags(active ? tags.filter((tag) => tag !== option.id) : [...tags, option.id])}
                style={{
                  padding: "6px 10px", borderRadius: 999,
                  border: "1px solid #334155",
                  background: active ? "#2563eb" : "#0f172a",
                  color: "#fff", cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </Field>
      {error && <div style={{ gridColumn: "span 2", color: "#fecaca", fontSize: 13 }}>{error}</div>}
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} disabled={saving || !title || !description || !partnerName} style={primaryButton}>
          {saving ? "儲存中…" : "儲存活動"}
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

function labelTag(tag: string) {
  return TAG_OPTIONS.find((option) => option.id === tag)?.label ?? tag;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#0f172a", color: "#fff",
  border: "1px solid #334155", padding: "8px 12px",
  borderRadius: 6, fontSize: 14, outline: "none",
};

const primaryButton: React.CSSProperties = {
  background: "#3b82f6", color: "#fff", border: "none",
  padding: "10px 16px", borderRadius: 8, fontWeight: 600,
  cursor: "pointer", fontSize: 14,
};

const smallButton: React.CSSProperties = {
  width: "100%", padding: "7px 10px", borderRadius: 8,
  border: "1px solid #334155", background: "transparent",
  color: "#cbd5e1", cursor: "pointer",
};
