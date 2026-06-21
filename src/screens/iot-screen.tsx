"use client";

import { useEffect, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { api, type IotDevice, type IotEvent } from "@/lib/api-client";

interface IotScreenProps {
  onBack: () => void;
}

const DEVICE_ICON: Record<string, string> = {
  presence: "🚶", bed: "🛏️", sos: "🆘", env: "🌡️",
};
const EVENT_META: Record<string, { label: string; icon: string }> = {
  activity: { label: "偵測到活動", icon: "🚶" },
  fall: { label: "偵測到跌倒", icon: "🚨" },
  sos: { label: "緊急求助", icon: "🆘" },
  leave_bed: { label: "夜間離床過久", icon: "🌙" },
  in_bed: { label: "回到床上", icon: "🛏️" },
  environment: { label: "環境讀數", icon: "🌡️" },
};
const SEV_COLOR: Record<string, string> = {
  critical: "var(--berry)", warning: "var(--gold)", info: "var(--sage)",
};

// demo 用的模擬按鈕
const SIM_BUTTONS: { kind: string; label: string; color: string }[] = [
  { kind: "fall", label: "模擬跌倒", color: "var(--berry)" },
  { kind: "sos", label: "模擬求助", color: "var(--berry)" },
  { kind: "leave_bed", label: "模擬離床過久", color: "var(--gold)" },
  { kind: "environment", label: "模擬室溫過高", color: "var(--gold)" },
  { kind: "activity", label: "模擬正常活動", color: "var(--sage)" },
];

export function IotScreen({ onBack }: IotScreenProps) {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [events, setEvents] = useState<IotEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const reload = async () => {
    try {
      const [d, e] = await Promise.all([api.listIotDevices(), api.listIotEvents()]);
      setDevices(d.devices);
      setEvents(e.events);
    } catch (err) {
      console.warn(err);
    }
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const simulate = async (kind: string) => {
    setBusy(kind);
    setToast("");
    try {
      const res = await api.simulateIotEvent(kind);
      setToast(res.alerted ? `已觸發警報${res.notified ? `，通知 ${res.notified} 位家人` : ""}` : "已記錄事件");
      await reload();
    } catch (e) {
      setToast("失敗：" + (e as Error).message);
    }
    setBusy(null);
  };

  return (
    <SubPage
      title="居家守護"
      onBack={onBack}
      accent="linear-gradient(180deg, #EAF2F8 0%, transparent 100%)"
    >
      {/* 說明 */}
      <div style={{
        background: "#EAF2F8", border: "1px solid #CDE4F0", borderRadius: "var(--r-lg)",
        padding: 16, marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <div style={{ fontSize: 24 }}>🏠</div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-1)", lineHeight: 1.5 }}>
          連結居家感測器後，跌倒、離床、室溫異常會<strong>自動通知家人</strong>，不用長輩自己操作。
          <span style={{ color: "var(--ink-3)" }}>（目前為示範資料，正式裝置整合中）</span>
        </div>
      </div>

      {/* 裝置狀態 */}
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
        連結的裝置
      </div>
      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--ink-2)" }}>載入中…</div>
      ) : devices.length === 0 ? (
        <div style={{
          background: "var(--surface)", borderRadius: "var(--r-lg)", padding: 24,
          textAlign: "center", border: "1px dashed var(--line-strong)", marginBottom: 24,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📡</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
            還沒有連結裝置<br />按下方按鈕模擬一次，即可看到效果
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {devices.map((d) => (
            <div key={d.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{DEVICE_ICON[d.kind] ?? "📦"}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>{d.room ?? ""}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 模擬按鈕（demo） */}
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 10 }}>
        示範：模擬感測事件
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {SIM_BUTTONS.map((b) => (
          <button
            key={b.kind}
            onClick={() => simulate(b.kind)}
            disabled={busy !== null}
            style={{
              padding: "10px 14px", borderRadius: 999,
              border: `1.5px solid ${b.color}`, background: "var(--surface)",
              color: b.color, fontSize: "var(--fs-sm)", fontWeight: 700,
              cursor: "pointer", opacity: busy && busy !== b.kind ? 0.4 : 1,
            }}
          >
            {busy === b.kind ? "處理中…" : b.label}
          </button>
        ))}
      </div>
      {toast && (
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--sage)", fontWeight: 700, marginBottom: 16 }}>
          ✓ {toast}
        </div>
      )}

      {/* 最近事件 */}
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", margin: "16px 0 12px" }}>
        最近事件
      </div>
      {events.length === 0 ? (
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)", textAlign: "center", padding: 16 }}>
          尚無事件
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {events.map((ev) => {
            const meta = EVENT_META[ev.event_kind] ?? { label: ev.event_kind, icon: "•" };
            const color = SEV_COLOR[ev.severity] ?? "var(--ink-3)";
            return (
              <div key={ev.id} className="card" style={{
                padding: 14, display: "flex", alignItems: "center", gap: 12,
                borderLeft: `4px solid ${color}`,
              }}>
                <span style={{ fontSize: 22 }}>{meta.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>{meta.label}</div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
                    {fmtTime(ev.occurred_at)}
                    {ev.event_kind === "environment" && ev.data?.temp != null ? `　${ev.data.temp}°C` : ""}
                    {ev.event_kind === "leave_bed" && ev.data?.duration_min != null ? `　${ev.data.duration_min} 分鐘` : ""}
                  </div>
                </div>
                {ev.severity === "critical" && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: color, padding: "2px 8px", borderRadius: 8 }}>緊急</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SubPage>
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMin = Math.floor((now - d.getTime()) / 60000);
  if (diffMin < 1) return "剛剛";
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `今天 ${h}:${m}`;
}
