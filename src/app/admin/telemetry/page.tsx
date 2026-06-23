"use client";

import { useEffect, useState } from "react";
import { api, type AdminTelemetry } from "@/lib/api-client";

const USAGE_LABEL: Record<string, string> = {
  app_open: "開啟 App",
  photo_analyze: "拍照辨識",
  meal_saved: "儲存餐點",
  voice_start: "語音對話",
  smart_submit: "完成幸福檢測",
  iot_simulate: "模擬感測",
};

export default function TelemetryPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AdminTelemetry | null>(null);

  useEffect(() => {
    api.adminTelemetry(days).then(setData).catch(console.error);
  }, [days]);

  const card = { background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 20 };
  const stat = { ...card, textAlign: "center" as const };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>使用與錯誤</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{
          background: "#1e293b", color: "#fff", border: "1px solid #334155",
          padding: "8px 12px", borderRadius: 6, fontSize: 14,
        }}>
          <option value={1}>今天</option>
          <option value={7}>過去 7 天</option>
          <option value={30}>過去 30 天</option>
        </select>
      </div>

      {!data ? <div style={{ color: "#94a3b8" }}>載入中…</div> : (
        <>
          {/* 數字卡 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={stat}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#38bdf8" }}>{data.active_users}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>活躍使用者</div>
            </div>
            <div style={stat}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{data.total_events}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>總事件數</div>
            </div>
            <div style={stat}>
              <div style={{ fontSize: 32, fontWeight: 800, color: data.error_count > 0 ? "#f87171" : "#4ade80" }}>{data.error_count}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>錯誤數</div>
            </div>
          </div>

          {/* 功能使用排行 */}
          <div style={{ ...card, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>功能使用排行</h2>
            {data.usage.length === 0 ? (
              <div style={{ color: "#64748b" }}>尚無資料</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.usage.map((u) => (
                  <div key={u.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 130, color: "#e2e8f0", fontSize: 14 }}>{USAGE_LABEL[u.name] ?? u.name}</div>
                    <div style={{ flex: 1, background: "#0f172a", borderRadius: 6, overflow: "hidden", height: 22 }}>
                      <div style={{
                        width: `${Math.min(100, (u.count / data.usage[0].count) * 100)}%`,
                        height: "100%", background: "#38bdf8",
                      }} />
                    </div>
                    <div style={{ width: 110, textAlign: "right", color: "#94a3b8", fontSize: 13 }}>
                      {u.count} 次 · {u.users} 人
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 錯誤 */}
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>最近錯誤</h2>
            {data.recent_errors.length === 0 ? (
              <div style={{ color: "#4ade80" }}>✓ 期間內沒有錯誤</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.recent_errors.map((e, i) => (
                  <div key={i} style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px", borderLeft: "3px solid #f87171" }}>
                    <div style={{ color: "#fca5a5", fontSize: 13, fontWeight: 700 }}>{e.name}</div>
                    <div style={{ color: "#e2e8f0", fontSize: 13, marginTop: 2, wordBreak: "break-all" }}>{e.message || "（無訊息）"}</div>
                    <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{e.path} · {new Date(e.at).toLocaleString("zh-TW")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
