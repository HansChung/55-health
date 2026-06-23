"use client";

import { useEffect, useState } from "react";
import { api, type BrandRow } from "@/lib/api-client";

const EMPTY = {
  id: "", host: "", app_name: "", tagline: "",
  primary_color: "#E8845A", primary_deep: "#C95E36", primary_soft: "#FBE6D4",
  logo_emoji: "🐻", active: true,
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const reload = () => api.adminListBrands().then((d) => setBrands(d.brands)).catch(console.error);
  useEffect(() => { reload(); }, []);

  const save = async () => {
    setMsg("");
    try {
      if (editing) {
        await api.adminUpdateBrand(editing, form);
      } else {
        await api.adminCreateBrand(form);
      }
      setForm({ ...EMPTY });
      setEditing(null);
      reload();
      setMsg("✓ 已儲存");
    } catch (e) {
      setMsg("失敗：" + (e as Error).message);
    }
  };

  const edit = (b: BrandRow) => {
    setEditing(b.id);
    setForm({
      id: b.id, host: b.host, app_name: b.app_name, tagline: b.tagline ?? "",
      primary_color: b.primary_color, primary_deep: b.primary_deep, primary_soft: b.primary_soft,
      logo_emoji: b.logo_emoji ?? "🐻", active: b.active,
    });
  };

  const remove = async (id: string) => {
    if (!confirm(`刪除品牌「${id}」？`)) return;
    try { await api.adminDeleteBrand(id); reload(); } catch (e) { alert((e as Error).message); }
  };

  const input = { background: "#0f172a", color: "#fff", border: "1px solid #334155", padding: "8px 10px", borderRadius: 6, fontSize: 14, width: "100%" } as const;
  const card = { background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 20 } as const;
  const label = { fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" } as const;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>白標品牌</h1>
      <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px" }}>
        一個合作夥伴 = 一筆品牌 + 一個網域。把夥伴的網域指向本服務（CNAME 到 Vercel）後，這裡新增一筆，他的網域就會顯示成自己的品牌，不用重新部署。
      </p>

      {/* 列表 */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>目前品牌</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {brands.map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#0f172a", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontSize: 22 }}>{b.logo_emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 700 }}>
                  {b.app_name}
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b" }}>{b.id}</span>
                  {!b.active && <span style={{ marginLeft: 8, fontSize: 11, color: "#f87171" }}>停用</span>}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>🌐 {b.host}</div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: 5, background: b.primary_color, border: "1px solid #334155" }} />
              <button onClick={() => edit(b)} style={{ background: "#334155", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>編輯</button>
              {b.id !== "default" && (
                <button onClick={() => remove(b.id)} style={{ background: "transparent", color: "#f87171", border: "1px solid #7f1d1d", padding: "6px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>刪除</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 表單 */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>
          {editing ? `編輯：${editing}` : "新增品牌"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={label}>品牌代號（小寫英數，建後不可改）</label>
            <input style={{ ...input, opacity: editing ? 0.5 : 1 }} disabled={!!editing}
              value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="xyz-pharmacy" />
          </div>
          <div>
            <label style={label}>網域 host</label>
            <input style={input} value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="health.xyz.com.tw" />
          </div>
          <div>
            <label style={label}>App 名稱</label>
            <input style={input} value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} placeholder="XX健康管家" />
          </div>
          <div>
            <label style={label}>標語 tagline</label>
            <input style={input} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="陪您健康每一天" />
          </div>
          <div>
            <label style={label}>主色 primary</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} style={{ width: 44, height: 38, background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
              <input style={input} value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={label}>深色 primary-deep</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="color" value={form.primary_deep} onChange={(e) => setForm({ ...form, primary_deep: e.target.value })} style={{ width: 44, height: 38, background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
              <input style={input} value={form.primary_deep} onChange={(e) => setForm({ ...form, primary_deep: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={label}>淺色 primary-soft</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="color" value={form.primary_soft} onChange={(e) => setForm({ ...form, primary_soft: e.target.value })} style={{ width: 44, height: 38, background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
              <input style={input} value={form.primary_soft} onChange={(e) => setForm({ ...form, primary_soft: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={label}>Logo emoji</label>
            <input style={input} value={form.logo_emoji} onChange={(e) => setForm({ ...form, logo_emoji: e.target.value })} placeholder="🐻" />
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0", fontSize: 14, marginTop: 14 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> 啟用
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button onClick={save} style={{ background: "#38bdf8", color: "#0f172a", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            {editing ? "更新" : "新增"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ ...EMPTY }); }} style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", padding: "10px 18px", borderRadius: 8, cursor: "pointer" }}>取消</button>
          )}
          {msg && <span style={{ color: msg.startsWith("✓") ? "#4ade80" : "#f87171", fontSize: 14 }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
