"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const PLANS = [
  {
    id: "free", name: "免費版", price: 0, color: "#94a3b8",
    features: ["基本記錄", "每月 10 次 AI 拍照", "每月 5 分鐘 AI 語音"],
  },
  {
    id: "basic", name: "標準版", price: 199, color: "#3b82f6",
    features: ["每月 100 次 AI 拍照", "每月 30 分鐘 AI 語音", "完整營養分析", "雲端備份"],
    popular: true,
  },
  {
    id: "pro", name: "專業版", price: 399, color: "#f59e0b",
    features: ["每月 500 次 AI 拍照", "每月 120 分鐘 AI 語音", "家人共享", "進階健康報告", "優先支援"],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  const subscribe = async (plan: string) => {
    setLoading(plan);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("請先登入");
      setLoading(null);
      return;
    }
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (e) {
      alert("結帳失敗：" + (e as Error).message);
      setLoading(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(180deg, #FFF3DF 0%, #FAF5EC 100%)",
      padding: "60px 24px", fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: "#3D2E20", letterSpacing: "-1px", margin: 0 }}>
          選擇方案
        </h1>
        <p style={{ fontSize: 18, color: "#6B5848", marginTop: 12 }}>
          隨時可以升級或取消，無綁約
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24, marginTop: 48,
        }}>
          {PLANS.map((p) => (
            <div key={p.id} style={{
              background: "#fff", borderRadius: 24, padding: 32,
              border: p.popular ? `3px solid ${p.color}` : "1px solid #ECDFC8",
              position: "relative", textAlign: "left",
              boxShadow: p.popular ? "0 12px 32px rgba(75, 50, 30, 0.15)" : "0 4px 16px rgba(75, 50, 30, 0.05)",
            }}>
              {p.popular && (
                <div style={{
                  position: "absolute", top: -14, right: 24,
                  background: p.color, color: "#fff",
                  padding: "6px 14px", borderRadius: 999,
                  fontSize: 12, fontWeight: 700,
                }}>最熱門</div>
              )}
              <div style={{ fontSize: 14, color: p.color, fontWeight: 700, letterSpacing: 1 }}>
                {p.name.toUpperCase()}
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: "#3D2E20" }}>NT$ {p.price}</span>
                <span style={{ fontSize: 16, color: "#6B5848" }}>/月</span>
              </div>
              <ul style={{ marginTop: 24, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 10, fontSize: 15, color: "#3D2E20" }}>
                    <span style={{ color: p.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => p.id !== "free" && subscribe(p.id)}
                disabled={p.id === "free" || loading === p.id}
                style={{
                  width: "100%", marginTop: 32, padding: "16px",
                  background: p.id === "free" ? "#E8DCC8" : p.color,
                  color: p.id === "free" ? "#6B5848" : "#fff",
                  border: "none", borderRadius: 999,
                  fontSize: 16, fontWeight: 700,
                  cursor: p.id === "free" ? "default" : "pointer",
                  opacity: loading === p.id ? 0.6 : 1,
                }}
              >
                {p.id === "free" ? "目前方案" : loading === p.id ? "處理中…" : "立即訂閱"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
