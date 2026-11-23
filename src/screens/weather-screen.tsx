"use client";

// ────────────────────────────────────────────────
// 今天天氣：出門前看一眼——幾度、會不會下雨、適不適合出門、穿什麼、空氣好不好（可以念出來）
// 縣市記在這台手機（localStorage）；沒選過就用「每天早上天氣」選過的，都沒有就請他選
// 不花 AI：氣象署 36 小時預報＋環境部即時 AQI，伺服器 30 分鐘內共用同一份
// ────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { api, ApiError, type NotificationSettings, type ProfileData } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import { DAILY_WEATHER_HOUR, dailyWeatherCounty } from "@/lib/daily-weather";
import { dailyWeatherAvailable, saveDailyWeather } from "@/lib/daily-weather-client";
import { tempText, type OutingLevel, type TodayWeather, type WeatherSlot } from "@/lib/today-weather";
import { TAIWAN_COUNTIES, isTaiwanCounty, type TaiwanCounty } from "@/lib/weather";
import type { AirLevel } from "@/lib/air-quality";

const COUNTY_KEY = "nuannuan_weather_county";

function savedCounty(): TaiwanCounty | null {
  try {
    const v = localStorage.getItem(COUNTY_KEY);
    return isTaiwanCounty(v) ? v : null;
  } catch {
    return null;
  }
}

const OUTING_STYLE: Record<OutingLevel, { bg: string; border: string; emoji: string }> = {
  good: { bg: "var(--sage-soft)", border: "var(--sage)", emoji: "🟢" },
  care: { bg: "var(--gold-soft)", border: "var(--gold)", emoji: "🟡" },
  stay: { bg: "var(--berry-soft)", border: "var(--berry)", emoji: "🔴" },
};

const AIR_COLOR: Record<AirLevel, { bg: string; border: string }> = {
  good: { bg: "var(--sage-soft)", border: "var(--sage)" },
  moderate: { bg: "var(--gold-soft)", border: "var(--gold)" },
  sensitive: { bg: "var(--berry-soft)", border: "var(--berry)" },
  unhealthy: { bg: "var(--berry-soft)", border: "var(--berry)" },
  very_unhealthy: { bg: "var(--berry-soft)", border: "var(--berry)" },
  hazardous: { bg: "var(--berry-soft)", border: "var(--berry)" },
};

const sectionTitle: React.CSSProperties = { fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-2)", margin: 0 };

function InfoCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start", border: "1px solid var(--line)" }}>
      <span style={{ fontSize: 36, lineHeight: 1.1, flexShrink: 0 }} aria-hidden="true">{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={sectionTitle}>{title}</h2>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.45, marginTop: 2 }}>{children}</div>
      </div>
    </div>
  );
}

function LaterRow({ slot }: { slot: WeatherSlot }) {
  const temp = tempText(slot);
  return (
    <div className="card" style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", border: "1px solid var(--line)" }}>
      <span style={{ fontSize: 34, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{slot.emoji}</span>
      {/* 每一小段都不斷行，放不下就整段換到下一行（小螢幕＋大字也不會一個字一行） */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", columnGap: 10, fontSize: "var(--fs-base)", fontWeight: 800, lineHeight: 1.3 }}>
          <span style={{ whiteSpace: "nowrap" }}>{slot.label}</span>
          {temp && <span style={{ whiteSpace: "nowrap" }}>{temp}</span>}
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.4, display: "flex", flexWrap: "wrap", columnGap: 10 }}>
          <span>{slot.wx}</span>
          {slot.pop != null && <span style={{ whiteSpace: "nowrap" }}>降雨 {slot.pop}%</span>}
        </div>
      </div>
    </div>
  );
}

export function WeatherScreen({
  onBack,
  settings,
  onProfileUpdated,
}: {
  onBack: () => void;
  settings: NotificationSettings | null | undefined;
  onProfileUpdated: (profile: ProfileData) => void;
}) {
  const toast = useToast();
  const [weather, setWeather] = useState<TodayWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** 還在準備中（沒設金鑰）：不給「再試一次」 */
  const [unavailable, setUnavailable] = useState(false);
  const [picking, setPicking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [pushAvailable, setPushAvailable] = useState(false);
  const [savingPush, setSavingPush] = useState(false);
  /** 換縣市換得快：舊的回應晚到不要蓋掉新的 */
  const requestId = useRef(0);
  const lastCounty = useRef<TaiwanCounty | null>(null);

  const load = useCallback(async (county: TaiwanCounty | null) => {
    const id = ++requestId.current;
    lastCounty.current = county;
    setLoading(true);
    setError(null);
    stopGuideSpeech();
    setSpeaking(false);
    try {
      const { weather: w } = await api.todayWeather(county);
      if (id !== requestId.current) return;
      setWeather(w);
      setPicking(!w);
      if (w) {
        try { localStorage.setItem(COUNTY_KEY, w.county); } catch { /* 存不了就每次用伺服器記得的 */ }
      }
    } catch (e) {
      if (id !== requestId.current) return;
      if (e instanceof ApiError && e.status === 503) setUnavailable(true);
      // 502＝氣象署那邊拿不到（伺服器給的那句話可以直接顯示）
      setError(e instanceof ApiError && e.status === 502 ? e.message : "天氣暫時看不到，請等一下再試");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(savedCounty());
    dailyWeatherAvailable().then(setPushAvailable).catch(() => { /* 查不到就不顯示那顆按鈕 */ });
    return () => stopGuideSpeech();
  }, [load]);

  const speak = () => {
    if (!weather) return;
    if (speaking) {
      stopGuideSpeech();
      setSpeaking(false);
      return;
    }
    const ok = speakGuideParagraphs(weather.speech, { onEnd: () => setSpeaking(false), onError: () => setSpeaking(false) });
    setSpeaking(ok);
  };

  const enablePush = async () => {
    if (!weather) return;
    setSavingPush(true);
    try {
      onProfileUpdated(await saveDailyWeather({ on: true, county: weather.county }));
      toast.success(`好了！每天早上 ${DAILY_WEATHER_HOUR} 點告訴你${weather.county}的天氣`);
    } catch (e) {
      console.warn("[weather] enable daily push failed:", e);
      toast.error("要按「允許」通知才收得到，請再試一次");
    }
    setSavingPush(false);
  };

  const outing = weather ? OUTING_STYLE[weather.outing.level] : null;
  const nowTemp = weather ? tempText(weather.now) : null;
  const showPushOffer = Boolean(weather) && pushAvailable && dailyWeatherCounty(settings) === null;

  return (
    <SubPage title="今天天氣" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {picking ? (
          <>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, lineHeight: 1.3 }}>你住哪個縣市？</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: -8 }}>點一下，下次就記得了</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {TAIWAN_COUNTIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => void load(c)}
                  disabled={loading}
                  style={{
                    minHeight: 64, borderRadius: "var(--r-md)", cursor: "pointer", fontFamily: "inherit",
                    fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", padding: "8px 2px",
                    border: `2px solid ${weather?.county === c ? "var(--primary)" : "var(--line-strong)"}`,
                    background: weather?.county === c ? "var(--primary-soft)" : "var(--surface)",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            {weather && (
              <button type="button" onClick={() => setPicking(false)} className="btn-ghost" style={{ width: "100%" }}>
                不換了
              </button>
            )}
          </>
        ) : loading && !weather ? (
          <div style={{ padding: "48px 0", textAlign: "center", fontSize: "var(--fs-base)", color: "var(--ink-2)" }}>
            <div style={{ fontSize: 56 }} aria-hidden="true">🌤️</div>
            正在看天氣…
          </div>
        ) : error && !weather ? (
          <div className="card" style={{ padding: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 14, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 56 }} aria-hidden="true">{unavailable ? "🛠️" : "🌫️"}</div>
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.5 }}>{unavailable ? "天氣還在準備中，過幾天再來看看" : error}</div>
            {!unavailable && (
              <button type="button" onClick={() => void load(lastCounty.current)} className="btn-primary" style={{ width: "100%" }}>
                再試一次
              </button>
            )}
          </div>
        ) : weather && outing ? (
          <>
            {/* 現在：最大的一張 */}
            <div
              className="card"
              style={{
                padding: 18, display: "flex", flexDirection: "column", gap: 10, opacity: loading ? 0.6 : 1,
                background: "linear-gradient(135deg, #E4EFF7 0%, #FFFFFF 100%)", border: "1px solid #BCD3E4",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, minWidth: 0 }}>📍 {weather.county}</div>
                <button
                  type="button"
                  onClick={() => setPicking(true)}
                  style={{
                    minHeight: 48, padding: "0 16px", borderRadius: "var(--r-pill)", cursor: "pointer", fontFamily: "inherit",
                    fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-1)", flexShrink: 0,
                    background: "var(--surface)", border: "2px solid var(--line-strong)",
                  }}
                >
                  換縣市
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: "min(72px, 18vw)", lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{weather.now.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)" }}>{weather.now.label}</div>
                  {/* 小螢幕＋大字：數字跟著螢幕縮，不要斷成兩行 */}
                  {nowTemp && (
                    <div style={{ fontSize: "min(var(--fs-2xl), 10.5vw)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>
                      {nowTemp}
                    </div>
                  )}
                  <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.35 }}>{weather.now.wx}</div>
                </div>
              </div>
              {weather.now.pop != null && (
                <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>☔ 降雨機率 {weather.now.pop}%</div>
              )}
            </div>

            {/* 適不適合出門 */}
            <div className="card" style={{ padding: 16, background: outing.bg, border: `2px solid ${outing.border}` }}>
              <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, lineHeight: 1.3 }}>
                <span aria-hidden="true">{outing.emoji} </span>{weather.outing.title}
              </div>
              {weather.outing.reasons.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
                  {weather.outing.reasons.map((r) => (
                    <li key={r} style={{ fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.4 }}>{r}</li>
                  ))}
                </ul>
              )}
            </div>

            {canSpeakGuide() && (
              <button type="button" onClick={speak} className="btn-ghost" style={{ width: "100%" }}>
                {speaking ? "⏹️ 不念了" : "🔊 念給我聽"}
              </button>
            )}

            {weather.clothing && <InfoCard emoji={weather.clothing.emoji} title="穿什麼">{weather.clothing.text}</InfoCard>}
            <InfoCard emoji="❤️" title="健康提醒">{weather.healthTip}</InfoCard>

            {weather.air && (
              <div
                className="card"
                style={{
                  padding: 16, display: "flex", gap: 14, alignItems: "center",
                  background: AIR_COLOR[weather.air.level].bg, border: `2px solid ${AIR_COLOR[weather.air.level].border}`,
                }}
              >
                <div style={{ textAlign: "center", flexShrink: 0, minWidth: 72 }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--ink-2)" }}>空氣 AQI</div>
                  <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, lineHeight: 1.1 }}>{weather.air.aqi}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, lineHeight: 1.3 }}>現在空氣：{weather.air.label}</div>
                  <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, lineHeight: 1.45 }}>{weather.air.tip}</div>
                  {weather.air.worst && (
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 4 }}>
                      {weather.air.worst.site}比較差（AQI {weather.air.worst.aqi}）
                    </div>
                  )}
                </div>
              </div>
            )}

            {weather.later.length > 0 && (
              <>
                <h2 style={{ ...sectionTitle, marginTop: 6 }}>接下來</h2>
                {weather.later.map((slot) => <LaterRow key={slot.label} slot={slot} />)}
              </>
            )}

            {showPushOffer && (
              <button type="button" onClick={enablePush} disabled={savingPush} className="btn-primary" style={{ width: "100%", marginTop: 6 }}>
                {savingPush ? "設定中…" : `🔔 每天早上 ${DAILY_WEATHER_HOUR} 點告訴我`}
              </button>
            )}

            <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", textAlign: "center", lineHeight: 1.5 }}>
              資料來源：中央氣象署{weather.air ? "、環境部" : ""}（以縣市為單位，山上、海邊會不一樣）
            </div>
          </>
        ) : null}
      </div>
    </SubPage>
  );
}
