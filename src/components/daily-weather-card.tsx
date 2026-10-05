"use client";

// ────────────────────────────────────────────────
// 首頁：問一次縣市，每天早上 7 點推播天氣＋健康提醒（選好就開；提醒通知裡可以關、可以換縣市）
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { NotificationSettings, ProfileData } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { TAIWAN_COUNTIES } from "@/lib/weather";
import { DAILY_WEATHER_HOUR, shouldOfferDailyWeather } from "@/lib/daily-weather";
import { dailyWeatherAvailable, saveDailyWeather } from "@/lib/daily-weather-client";

export function DailyWeatherCard({
  settings,
  onSaved,
}: {
  settings: NotificationSettings | null | undefined;
  onSaved: (profile: ProfileData) => void;
}) {
  const toast = useToast();
  const offer = shouldOfferDailyWeather(settings);
  const [available, setAvailable] = useState(false);
  const [county, setCounty] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!offer) return;
    let cancelled = false;
    dailyWeatherAvailable()
      .then((ok) => { if (!cancelled) setAvailable(ok); })
      .catch(() => { /* 查不到就不顯示 */ });
    return () => { cancelled = true; };
  }, [offer]);

  if (!offer || !available) return null;

  const save = async (on: boolean) => {
    setBusy(true);
    try {
      onSaved(await saveDailyWeather({ on, county: on ? county : null }));
      if (on) toast.success(`好了！明天早上 ${DAILY_WEATHER_HOUR} 點告訴你${county}的天氣`);
    } catch (e) {
      console.warn("[daily-weather] save failed:", e);
      toast.error(on ? "要按「允許」通知才收得到，請再試一次" : "沒存成功，請再試一次");
    }
    setBusy(false);
  };

  return (
    <div style={{ padding: "20px 24px 0" }}>
      <div
        className="card"
        style={{
          padding: 18, display: "flex", flexDirection: "column", gap: 12,
          background: "linear-gradient(135deg, #E4EFF7 0%, #FFFFFF 100%)", border: "1px solid #BCD3E4",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 40, flexShrink: 0 }} aria-hidden="true">🌤️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)" }}>每天早上 {DAILY_WEATHER_HOUR} 點報天氣</div>
            <div style={{ color: "var(--ink-2)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
              今天幾度、會不會下雨，再提醒你保暖、喝水或量血壓
            </div>
          </div>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 700 }}>
          你住哪個縣市？
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            disabled={busy}
            style={{
              minHeight: 52, padding: "10px 12px", borderRadius: 12, fontSize: "var(--fs-base)",
              border: "2px solid var(--line-strong)", background: "var(--surface)", color: "var(--ink-1)",
            }}
          >
            <option value="">請選縣市</option>
            {TAIWAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <button onClick={() => save(true)} disabled={!county || busy} className="btn-primary" style={{ width: "100%" }}>
          {busy ? "設定中…" : "好，每天告訴我"}
        </button>
        <button
          onClick={() => save(false)}
          disabled={busy}
          style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: "var(--fs-sm)", minHeight: 44, cursor: "pointer" }}
        >
          不用了
        </button>
      </div>
    </div>
  );
}
