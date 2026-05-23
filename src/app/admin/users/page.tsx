"use client";

import { useEffect, useState } from "react";
import { api, type AdminUserRow } from "@/lib/api-client";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { users } = await api.adminListUsers();
      setUsers(users);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const updateTier = async (id: string, tier: "free" | "basic" | "pro") => {
    await api.adminUpdateUser(id, { subscription_tier: tier });
    load();
  };

  const toggleAdmin = async (id: string, current: boolean) => {
    if (!confirm(current ? "確定要取消管理員權限？" : "確定要設為管理員？")) return;
    await api.adminUpdateUser(id, { is_admin: !current });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 24 }}>
        會員管理 <span style={{ fontSize: 16, color: "#64748b", fontWeight: 400 }}>共 {users.length} 人</span>
      </h1>

      <input
        type="text"
        placeholder="搜尋 email 或姓名…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", maxWidth: 400, marginBottom: 16,
          background: "#1e293b", color: "#fff", border: "1px solid #334155",
          padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none",
        }}
      />

      <div style={{
        background: "#1e293b", borderRadius: 12,
        border: "1px solid #334155", overflow: "hidden",
      }}>
        {loading ? <div style={{ padding: 24, color: "#94a3b8" }}>載入中…</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>用戶</th>
                <th>方案</th>
                <th>餐點數</th>
                <th>30 天成本</th>
                <th>註冊時間</th>
                <th style={{ textAlign: "right", paddingRight: 16 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #1e293b", fontSize: 14 }}>
                  <td style={{ padding: "12px 16px", color: "#e2e8f0" }}>
                    <div>{u.display_name ?? "(未設定)"}{u.is_admin && <span style={{ color: "#f59e0b", marginLeft: 8, fontSize: 11 }}>👑 ADMIN</span>}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{u.email}</div>
                  </td>
                  <td>
                    <select
                      value={u.subscription_tier}
                      onChange={(e) => updateTier(u.id, e.target.value as "free" | "basic" | "pro")}
                      style={{
                        background: "#0f172a", color: tierColor(u.subscription_tier),
                        border: `1px solid ${tierColor(u.subscription_tier)}`,
                        padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                      }}
                    >
                      <option value="free">FREE</option>
                      <option value="basic">BASIC</option>
                      <option value="pro">PRO</option>
                    </select>
                  </td>
                  <td style={{ color: "#94a3b8" }}>{u.meals_count}</td>
                  <td style={{ color: "#10b981" }}>${(u.ai_cost_30d ?? 0).toFixed(4)}</td>
                  <td style={{ color: "#64748b", fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString("zh-TW")}</td>
                  <td style={{ textAlign: "right", paddingRight: 16 }}>
                    <button onClick={() => toggleAdmin(u.id, u.is_admin)} style={{
                      background: "transparent", color: u.is_admin ? "#ef4444" : "#f59e0b",
                      border: "none", cursor: "pointer", fontSize: 12,
                    }}>
                      {u.is_admin ? "取消管理員" : "設為管理員"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function tierColor(tier: string) {
  return ({ free: "#94a3b8", basic: "#3b82f6", pro: "#f59e0b" } as Record<string, string>)[tier] ?? "#94a3b8";
}
