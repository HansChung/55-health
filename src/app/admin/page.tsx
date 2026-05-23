"use client";

import { useEffect, useState } from "react";
import { api, type AdminUsageSummary } from "@/lib/api-client";

export default function AdminDashboard() {
  const [data, setData] = useState<AdminUsageSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminUsageSummary(30)
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBlock msg={error} />;
  if (!data) return <div>載入中…</div>;

  const monthCost = data.totalCostUsd;
  const monthCount = data.byService.reduce((s, x) => s + x.count, 0);
  const monthTokens = data.byService.reduce((s, x) => s + x.tokens, 0);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 24 }}>
        總覽
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="本月 AI 成本" value={`$${monthCost.toFixed(4)}`} sub="USD" color="#10b981" />
        <StatCard label="呼叫次數" value={monthCount.toString()} sub="次" color="#3b82f6" />
        <StatCard label="總 token 量" value={monthTokens.toLocaleString()} sub="tokens" color="#f59e0b" />
        <StatCard label="使用人數" value={data.topUsers.length.toString()} sub="人" color="#a855f7" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="各服務分佈">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
                <th style={{ padding: "8px 0" }}>服務</th>
                <th>次數</th>
                <th>Tokens</th>
                <th style={{ textAlign: "right" }}>成本</th>
              </tr>
            </thead>
            <tbody>
              {data.byService.map((s) => (
                <tr key={s.service} style={{ borderBottom: "1px solid #1e293b", fontSize: 14 }}>
                  <td style={{ padding: "12px 0", color: "#e2e8f0" }}>{labelService(s.service)}</td>
                  <td style={{ color: "#94a3b8" }}>{s.count}</td>
                  <td style={{ color: "#94a3b8" }}>{s.tokens.toLocaleString()}</td>
                  <td style={{ textAlign: "right", color: "#10b981" }}>${s.cost.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="每日成本趨勢">
          <DailyChart data={data.daily} />
        </Card>
      </div>

      <Card title="Top 10 用戶" style={{ marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
              <th style={{ padding: "8px 0" }}>用戶</th>
              <th>呼叫次數</th>
              <th style={{ textAlign: "right" }}>30 天成本</th>
            </tr>
          </thead>
          <tbody>
            {data.topUsers.map((u) => (
              <tr key={u.user_id} style={{ borderBottom: "1px solid #1e293b", fontSize: 14 }}>
                <td style={{ padding: "12px 0", color: "#e2e8f0" }}>{u.email ?? u.user_id.substring(0, 8)}</td>
                <td style={{ color: "#94a3b8" }}>{u.count}</td>
                <td style={{ textAlign: "right", color: "#10b981" }}>${u.cost.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: "#1e293b", borderRadius: 12,
      padding: 20, border: "1px solid #334155",
    }}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#1e293b", borderRadius: 12,
      padding: 20, border: "1px solid #334155",
      ...style,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; cost: number; count: number }[] }) {
  if (data.length === 0) return <div style={{ color: "#64748b", padding: 20, textAlign: "center" }}>尚無資料</div>;
  const max = Math.max(...data.map((d) => d.cost), 0.0001);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160 }}>
      {data.map((d) => (
        <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div title={`${d.date}: $${d.cost.toFixed(4)}`} style={{
            width: "100%",
            height: `${(d.cost / max) * 130}px`,
            background: "linear-gradient(180deg, #10b981, #059669)",
            borderRadius: "4px 4px 0 0",
            minHeight: 2,
          }} />
          <div style={{ fontSize: 10, color: "#64748b" }}>{d.date.substring(5)}</div>
        </div>
      ))}
    </div>
  );
}

function labelService(s: string) {
  return ({
    gemini_vision: "📸 Gemini 拍照",
    gemini_text: "💬 Gemini 文字",
    openai_realtime: "🎙 OpenAI 語音",
    openai_chat: "💭 OpenAI 文字",
  } as Record<string, string>)[s] ?? s;
}

function ErrorBlock({ msg }: { msg: string }) {
  return (
    <div style={{
      background: "#7f1d1d", padding: 16, borderRadius: 8,
      color: "#fecaca", fontSize: 14,
    }}>
      錯誤：{msg}
    </div>
  );
}
