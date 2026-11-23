"use client";

import { useEffect, useState } from "react";
import { defaultPlanSettings, pricingFeatures, type PlanSettings, type SubscriptionTier } from "@/lib/plan-settings";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

// 每個方案列的項目照後台「方案與次數」（載入前先用預設值）
const PLANS: { id: SubscriptionTier; name: string; price: number; color: string; popular?: boolean }[] = [
  { id: "free", name: "免費版", price: 0, color: "#94a3b8" },
  { id: "basic", name: "標準版", price: 199, color: "#3b82f6", popular: true },
  { id: "pro", name: "專業版", price: 399, color: "#f59e0b" },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlanSettings>(defaultPlanSettings);
  // 現在的方案、有沒有在 Stripe 付款訂閱（有的話改方案、取消都到 Stripe 的訂閱管理頁）
  const [me, setMe] = useState<{ tier: SubscriptionTier; paying: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { profile?: { subscription_tier?: SubscriptionTier; stripe_subscription_id?: string | null } } | null) => {
        if (d?.profile) setMe({ tier: d.profile.subscription_tier ?? "free", paying: Boolean(d.profile.stripe_subscription_id) });
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    fetch("/api/plan-settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { settings?: PlanSettings } | null) => { if (d?.settings) setSettings(d.settings); })
      .catch(() => undefined);
  }, []);
  const supabase = createSupabaseBrowser();
  const toast = useToast();

  const openPortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "訂閱管理頁暫時打不開，請稍後再試。");
      setLoading(null);
    }
  };

  const subscribe = async (plan: string) => {
    setLoading(plan);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("請先登入再選擇方案喔。");
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
      console.error("結帳失敗:", e);
      toast.error("結帳沒成功，請稍後再試一次。");
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
        {me?.paying && (
          <button
            type="button"
            onClick={openPortal}
            disabled={loading === "portal"}
            style={{
              marginTop: 16, padding: "14px 28px", minHeight: 52, borderRadius: 999,
              background: "#fff", color: "#3D2E20", border: "2px solid #E8845A",
              fontSize: 17, fontWeight: 700, cursor: "pointer",
            }}
          >
            {loading === "portal" ? "打開中…" : "管理我的訂閱（改方案、取消、換信用卡）"}
          </button>
        )}

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
                {pricingFeatures(settings, p.id).map((f) => (
                  <li key={f} style={{ display: "flex", gap: 10, fontSize: 15, color: "#3D2E20" }}>
                    <span style={{ color: p.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {(() => {
                const current = (me?.tier ?? "free") === p.id;
                // 已經在付款訂閱：換方案、改回免費都到 Stripe 訂閱管理頁（不會多開一份重複扣款）
                const action = current ? null : me?.paying ? openPortal : p.id === "free" ? null : () => subscribe(p.id);
                const label = current ? "目前方案"
                  : loading === p.id || (me?.paying && loading === "portal") ? "處理中…"
                  : me?.paying ? (p.id === "free" ? "取消訂閱" : "改成這個方案")
                  : p.id === "free" ? "免費使用" : "立即訂閱";
                return (
                  <button
                    onClick={() => action?.()}
                    disabled={!action || loading !== null}
                    style={{
                      width: "100%", marginTop: 32, padding: "16px", minHeight: 52,
                      background: !action ? "#E8DCC8" : p.color,
                      color: !action ? "#6B5848" : "#fff",
                      border: "none", borderRadius: 999,
                      fontSize: 16, fontWeight: 700,
                      cursor: !action ? "default" : "pointer",
                      opacity: loading === p.id ? 0.6 : 1,
                    }}
                  >
                    {label}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
