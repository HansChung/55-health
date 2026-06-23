"use client";

import { useEffect, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { api, type ElderOverview } from "@/lib/api-client";

interface CaregiverScreenProps {
  onBack: () => void;
}

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  normal: { label: "今天正常", color: "#4F7A4E", bg: "#EAF3E7", dot: "#7AA779" },
  attention: { label: "需要留意", color: "#9A6A00", bg: "#FFF6E0", dot: "#D9A441" },
  alert: { label: "需要關心", color: "#B23A4E", bg: "#FBE8EC", dot: "#C95B6E" },
};

export function CaregiverScreen({ onBack }: CaregiverScreenProps) {
  const [elders, setElders] = useState<ElderOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.familyOverview()
      .then(({ elders }) => setElders(elders))
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, []);

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
            請長輩在他的暖暖「家人共享」中邀請您，<br />
            並輸入邀請碼接受後，這裡就會顯示他的狀況。
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {elders.map((e) => (
            <ElderCard key={e.elder_id} elder={e} />
          ))}
        </div>
      )}
    </SubPage>
  );
}

function ElderCard({ elder }: { elder: ElderOverview }) {
  const st = STATUS[elder.overall] ?? STATUS.normal;
  const perms = elder.permissions ?? {};
  const canHealth = !!perms.alerts;

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

      {/* 最新警報（若有） */}
      {elder.latest_alert && (
        <div style={{
          padding: "12px 18px", background: "#FFF6F7",
          borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--berry)" }}>
            {elder.latest_alert.title}
          </span>
          {elder.alerts_unresolved > 1 && (
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
              等 {elder.alerts_unresolved} 則未處理
            </span>
          )}
        </div>
      )}

      {/* 狀態列表 */}
      <div style={{ padding: "8px 18px 16px" }}>
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
        {!canHealth && (
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", padding: "6px 0" }}>
            （長輩尚未開放健康與守護資訊的查看權限）
          </div>
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
