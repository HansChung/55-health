"use client";

// ────────────────────────────────────────────────
// 首頁：每日平安打卡
// ・還沒設定過 → 問一次：幾點前沒按要通知家人（「不用了」就不再出現；提醒通知裡可以再打開）
// ・有開 → 大按鈕「我今天很好」；按過了顯示今天幾點報的平安
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api, type NotificationSettings, type ProfileData } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import {
  CHECKIN_DEADLINES,
  DEFAULT_CHECKIN_DEADLINE,
  checkinSetting,
  checkinState,
  deadlineLabel,
  isCheckinDeadline,
  taipeiClock,
  type CheckinDeadline,
} from "@/lib/daily-checkin";
import { saveDailyCheckin } from "@/lib/daily-checkin-client";

const cardStyle: React.CSSProperties = {
  padding: 18, display: "flex", flexDirection: "column", gap: 12,
  background: "linear-gradient(135deg, #FFF3E2 0%, #FFFFFF 100%)", border: "1px solid #F0CFA0",
};

export function DailyCheckinCard({
  settings,
  onSaved,
}: {
  settings: NotificationSettings | null | undefined;
  onSaved: (profile: ProfileData) => void;
}) {
  const toast = useToast();
  const raw = settings?.daily_checkin;
  const setting = checkinSetting(raw);
  const [deadline, setDeadline] = useState<CheckinDeadline>(DEFAULT_CHECKIN_DEADLINE);
  const [busy, setBusy] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!setting.on) return;
    let cancelled = false;
    api.checkinToday()
      .then((r) => { if (!cancelled) setCheckedAt(r.checkedAt); })
      .catch(() => { /* 讀不到就當還沒報 */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [setting.on]);

  // 說過「不用了」：不再出現
  if (raw && !setting.on) return null;

  const save = async (on: boolean) => {
    setBusy(true);
    try {
      const { profile, pushOk } = await saveDailyCheckin({ on, deadline });
      onSaved(profile);
      if (on) {
        trackEvent("daily_checkin_enabled", { deadline });
        toast.success(
          pushOk
            ? `好了！每天${deadlineLabel(deadline)}前按一下，家人就放心`
            : `好了！${deadlineLabel(deadline)}前沒按會通知家人（這支手機沒開通知，收不到提醒）`
        );
      }
    } catch (e) {
      console.warn("[checkin] save failed:", e);
      toast.error("沒存成功，請再試一次");
    }
    setBusy(false);
  };

  const checkin = async () => {
    setBusy(true);
    try {
      const r = await api.checkin();
      setCheckedAt(r.checkedAt);
      if (r.first) {
        trackEvent("daily_checkin");
        toast.success("收到了！家人知道你今天很好 😊");
      }
    } catch (e) {
      console.warn("[checkin] failed:", e);
      toast.error("沒記到，請再按一次");
    }
    setBusy(false);
  };

  // 還沒設定過：問一次
  if (!raw) {
    return (
      <div style={{ padding: "20px 24px 0" }}>
        <div className="card" style={cardStyle}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 40, flexShrink: 0 }} aria-hidden="true">👋</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)" }}>每天報個平安</div>
              <div style={{ color: "var(--ink-2)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
                每天按一下「我今天很好」；到了時間還沒按，暖暖先提醒你，再過兩個小時還沒按就通知家人
              </div>
            </div>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 700 }}>
            每天幾點前要按？
            <select
              value={deadline}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (isCheckinDeadline(v)) setDeadline(v);
              }}
              disabled={busy}
              style={{
                minHeight: 52, padding: "10px 12px", borderRadius: 12, fontSize: "var(--fs-base)",
                border: "2px solid var(--line-strong)", background: "var(--surface)", color: "var(--ink-1)",
              }}
            >
              {CHECKIN_DEADLINES.map((h) => <option key={h} value={h}>{deadlineLabel(h)}前</option>)}
            </select>
          </label>
          <button onClick={() => save(true)} disabled={busy} className="btn-primary" style={{ width: "100%" }}>
            {busy ? "設定中…" : "好，開始每天報平安"}
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

  if (!loaded) return null;
  const state = checkinState(setting, checkedAt);

  if (state === "done" && checkedAt) {
    return (
      <div style={{ padding: "20px 24px 0" }}>
        <div className="card" style={{ ...cardStyle, flexDirection: "row", alignItems: "center", background: "linear-gradient(135deg, #EAF3E7 0%, #FFFFFF 100%)", border: "1px solid #C3DDBB" }}>
          <div style={{ fontSize: 36, flexShrink: 0 }} aria-hidden="true">✅</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: "var(--fs-base)" }}>今天報過平安了</div>
            <div style={{ color: "var(--ink-2)", fontSize: "var(--fs-sm)" }}>{taipeiClock(checkedAt)} 按的，家人看得到</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px 0" }}>
      <div className="card" style={cardStyle}>
        <button
          onClick={checkin}
          disabled={busy}
          className="btn-primary"
          style={{ width: "100%", minHeight: 72, fontSize: "var(--fs-lg)", fontWeight: 800 }}
        >
          {busy ? "傳送中…" : "👋 我今天很好"}
        </button>
        <div style={{ color: state === "late" ? "var(--berry)" : "var(--ink-2)", fontSize: "var(--fs-sm)", textAlign: "center", lineHeight: 1.5 }}>
          {state === "late"
            ? `已經過了${deadlineLabel(setting.deadline)}，快按一下讓家人放心`
            : `${deadlineLabel(setting.deadline)}前按一下，家人就知道你很好`}
        </div>
      </div>
    </div>
  );
}
