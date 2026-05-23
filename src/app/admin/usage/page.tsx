"use client";

import { useEffect, useState } from "react";
import { api, type AdminUsageSummary } from "@/lib/api-client";

export default function UsagePage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminUsageSummary | null>(null);

  useEffect(() => {
    api.adminUsageSummary(days).then(setData).catch(console.error);
  }, [days]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>Token 用量</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{
          background: "#1e293b", color: "#fff", border: "1px solid #334155",
          padding: "8px 12px", borderRadius: 6, fontSize: 14,
        }}>
          <option value={7}>過去 7 天</option>
          <option value={30}>過去 30 天</option>
          <option value={90}>過去 90 天</option>
        </select>
      </div>

      {!data ? <div>載入中…</div> : (
        <>
          <div style={{
            background: "#1e293b", borderRadius: 12, padding: 24,
            border: "1px solid #334155", marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>區間總成本</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#10b981", marginTop: 8 }}>
              ${data.totalCostUsd.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              ≈ NT$ {(data.totalCostUsd * 32).toFixed(0)}（匯率 1:32）
            </div>
          </div>

          <div style={{
            background: "#1e293b", borderRadius: 12, padding: 24,
            border: "1px solid #334155", marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 16 }}>每日成本</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
                  <th style={{ padding: "8px 0" }}>日期</th>
                  <th>呼叫</th>
                  <th style={{ textAlign: "right" }}>成本 USD</th>
                </tr>
              </thead>
              <tbody>
                {data.daily.map((d) => (
                  <tr key={d.date} style={{ borderBottom: "1px solid #1e293b", fontSize: 14 }}>
                    <td style={{ padding: "10px 0", color: "#e2e8f0" }}>{d.date}</td>
                    <td style={{ color: "#94a3b8" }}>{d.count}</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>${d.cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
