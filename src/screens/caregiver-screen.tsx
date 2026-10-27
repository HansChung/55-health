"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deadlineLabel, taipeiClock } from "@/lib/daily-checkin";
import { appointmentPlace, appointmentTimeLabel, relativeDayLabel } from "@/lib/clinic-appointments";
import { SubPage } from "@/components/sub-page";
import { api, type ElderOverview } from "@/lib/api-client";
import { FamilyVideos } from "@/components/family-videos";
import { FamilyStories } from "@/components/family-stories";
import { FamilyScamChecks } from "@/components/family-scam-checks";
import { FamilyHealthTrends } from "@/components/family-health-trends";
import { useToast } from "@/hooks/use-toast";

interface CaregiverScreenProps {
  onBack: () => void;
  /** 開啟指定長輩的守護紀錄（警報中心） */
  onOpenAlerts?: (elder: { elderId: string; elderName: string }) => void;
}

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  normal: { label: "今天正常", color: "#4F7A4E", bg: "#EAF3E7", dot: "#7AA779" },
  attention: { label: "需要留意", color: "#9A6A00", bg: "#FFF6E0", dot: "#D9A441" },
  alert: { label: "需要關心", color: "#B23A4E", bg: "#FBE8EC", dot: "#C95B6E" },
};

export function CaregiverScreen({ onBack, onOpenAlerts }: CaregiverScreenProps) {
  const [elders, setElders] = useState<ElderOverview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.familyOverview()
      .then(({ elders }) => setElders(elders))
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <SubPage
      title="家人狀況"
      onBack={onBack}
      accent="linear-gradient(180deg, #DCEBD8 0%, transparent 100%)"
    >
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-2)" }}>載入中…</div>
      ) : elders.length === 0 ? (
        <div style={{
          background: "var(--surface)", borderRadius: "var(--r-lg)", padding: 30,
          textAlign: "center", border: "1px dashed var(--line-strong)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👨‍👩‍👧</div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 6 }}>
            還沒有關心中的長輩
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
            請長輩在他的暖暖「家人共享」產生邀請碼，<br />
            在下面輸入後，這裡就會顯示他的狀況。
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {elders.map((e) => (
            <ElderCard
              key={e.elder_id}
              elder={e}
              onOpenAlerts={
                onOpenAlerts
                  ? () => onOpenAlerts({ elderId: e.elder_id, elderName: e.name })
                  : undefined
              }
            />
          ))}
        </div>
      )}
      <InviteCodeCard first={!loading && elders.length === 0} onAccepted={load} />
      {/* 長輩按「通知家人幫我看」的可疑訊息（沒有就不顯示） */}
      <FamilyScamChecks />
      {/* 長輩做的出遊影片：按讚、留言（沒有影片就不顯示） */}
      <FamilyVideos />
      <FamilyStories />
    </SubPage>
  );
}

/** 輸入長輩給的邀請碼（還沒有長輩時直接展開；有了就收成一個「再加一位長輩」按鈕） */
function InviteCodeCard({ first, onAccepted }: { first: boolean; onAccepted: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const show = first || open;

  const submit = async () => {
    if (busyRef.current || !code.trim()) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const { elderName } = await api.acceptFamilyInvite(code);
      toast.success(`已經連上 ${elderName} 了`);
      setCode("");
      setOpen(false);
      onAccepted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "沒有連上，請再試一次");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!show) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}
        style={{ width: "100%", minHeight: 52, marginTop: 16 }}>
        ➕ 輸入邀請碼，再加一位長輩
      </button>
    );
  }
  return (
    <form
      className="card"
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      style={{ marginTop: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <label htmlFor="family-invite-code" style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>
        輸入長輩給你的邀請碼
      </label>
      <input
        id="family-invite-code"
        value={code}
        onChange={(e) => { setCode(e.target.value); setError(""); }}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="1234-5678"
        maxLength={20}
        style={{
          fontSize: "var(--fs-2xl)", fontWeight: 800, letterSpacing: 4, textAlign: "center",
          padding: "12px 14px", borderRadius: "var(--r-md)", border: "2px solid var(--line-strong)",
          background: "var(--surface)", color: "var(--ink-1)", fontFamily: "ui-monospace, monospace",
        }}
      />
      {error && (
        <div role="alert" style={{ fontSize: "var(--fs-sm)", color: "#B23A4E", lineHeight: 1.5 }}>{error}</div>
      )}
      <button type="submit" className="btn-primary" disabled={busy || !code.trim()} style={{ minHeight: 56 }}>
        {busy ? "連線中…" : "連上長輩"}
      </button>
    </form>
  );
}

function ElderCard({
  elder,
  onOpenAlerts,
}: {
  elder: ElderOverview;
  onOpenAlerts?: () => void;
}) {
  const st = STATUS[elder.overall] ?? STATUS.normal;
  const perms = elder.permissions ?? {};
  const canHealth = !!perms.alerts;
  const [trends, setTrends] = useState(false);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* 標頭 */}
      <div style={{ background: st.bg, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: "#fff", border: `2px solid ${st.dot}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: st.dot,
        }}>{elder.name.charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>{elder.name}</div>
          {elder.relationship && (
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>{elder.relationship}</div>
          )}
        </div>
        <span style={{
          fontSize: "var(--fs-sm)", fontWeight: 800, color: "#fff",
          background: st.dot, padding: "5px 12px", borderRadius: 99,
        }}>{st.label}</span>
      </div>

      {/* 最新警報（若有）— 可點進守護紀錄 */}
      {elder.latest_alert && (
        <button
          type="button"
          onClick={onOpenAlerts}
          disabled={!onOpenAlerts}
          style={{
            width: "100%", padding: "12px 18px", background: "#FFF6F7",
            border: "none", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 8,
            cursor: onOpenAlerts ? "pointer" : "default", textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--berry)", flex: 1 }}>
            {elder.latest_alert.title}
          </span>
          {elder.alerts_unresolved > 1 && (
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
              等 {elder.alerts_unresolved} 則未處理
            </span>
          )}
          {onOpenAlerts && (
            <span style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--berry)" }}>
              查看 →
            </span>
          )}
        </button>
      )}

      {/* 狀態列表 */}
      <div style={{ padding: "8px 18px 16px" }}>
        {elder.checkin && (
          <StatusRow icon="👋" label="報平安"
            value={
              elder.checkin.checked_at
                ? `今天 ${taipeiClock(elder.checkin.checked_at)} 報過平安`
                : elder.checkin.state === "late"
                  ? `過了${deadlineLabel(elder.checkin.deadline)}還沒報平安`
                  : `今天還沒報（${deadlineLabel(elder.checkin.deadline)}前）`
            }
            warn={elder.checkin.state === "late"}
          />
        )}
        {elder.next_appointment && (
          <StatusRow icon={elder.next_appointment.kind === "refill" ? "💊" : "📅"} label={elder.next_appointment.kind === "refill" ? "領藥" : "回診"}
            value={[
              relativeDayLabel(elder.next_appointment.appt_date),
              appointmentTimeLabel(elder.next_appointment.appt_time),
              appointmentPlace(elder.next_appointment),
            ].filter(Boolean).join(" ")}
          />
        )}
        {elder.iot && (
          <StatusRow
            icon="🏠" label="居家"
            value={
              (elder.iot.lastActivityAt ? "有活動" : "—") +
              (elder.iot.temp != null ? `　·　室溫 ${elder.iot.temp}°C` : "")
            }
          />
        )}
        {elder.meals && (
          <StatusRow icon="🍽️" label="飲食"
            value={elder.meals.logged > 0 ? `今天已記錄 ${elder.meals.logged} 餐` : "今天尚未記錄"}
            warn={elder.meals.logged === 0}
          />
        )}
        {canHealth && elder.meds && (
          <StatusRow icon="💊" label="用藥"
            value={`${elder.meds.taken}/${elder.meds.total} 已服用`}
            warn={elder.meds.taken < elder.meds.total}
          />
        )}
        {canHealth && elder.bp && (
          <StatusRow icon="🩺" label="血壓" value={`${elder.bp.systolic}/${elder.bp.diastolic} mmHg`} />
        )}
        {canHealth && elder.glucose && (
          <StatusRow icon="🩸" label="血糖" value={`${elder.glucose.value} mg/dL`} />
        )}
        {canHealth && elder.shi != null && (
          <StatusRow icon="🧭" label="幸福指數" value={`${elder.shi} 分`} />
        )}
        {canHealth && (
          <button
            type="button"
            onClick={() => setTrends(true)}
            style={{
              width: "100%", marginTop: 8, padding: "12px 14px",
              borderRadius: 12, border: "1px solid var(--line-strong)",
              background: "var(--surface)", fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            📈 看血壓、血糖趨勢
          </button>
        )}
        {trends && <FamilyHealthTrends elderId={elder.elder_id} elderName={elder.name} onClose={() => setTrends(false)} />}
        {!canHealth && (
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", padding: "6px 0" }}>
            （長輩尚未開放健康與守護資訊的查看權限）
          </div>
        )}
        {canHealth && onOpenAlerts && !elder.latest_alert && (
          <button
            type="button"
            onClick={onOpenAlerts}
            style={{
              width: "100%", marginTop: 8, padding: "12px 14px",
              borderRadius: 12, border: "1px solid var(--line-strong)",
              background: "var(--surface-warm, #F7F1E6)",
              fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            查看守護紀錄
            {elder.alerts_unresolved > 0 ? `（${elder.alerts_unresolved} 則未處理）` : ""}
          </button>
        )}
      </div>
    </div>
  );
}

function StatusRow({ icon, label, value, warn }: { icon: string; label: string; value: string; warn?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 0", borderBottom: "1px solid var(--line)",
    }}>
      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
      <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", width: 64 }}>{label}</span>
      <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: warn ? "var(--gold)" : "var(--ink-1)", flex: 1 }}>
        {value}
      </span>
    </div>
  );
}
