"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { Toggle } from "@/components/toggle";

interface NotificationScreenProps {
  onBack: () => void;
}

function NotifRow({ icon, label, time, on: initial, last }: {
  icon: string; label: string; time: string; on: boolean; last?: boolean;
}) {
  const [on, setOn] = useState(initial);
  return (
    <div style={{
      padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 14,
      borderBottom: last ? "none" : "1px solid var(--line)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "var(--bg-deep)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{time}</div>
      </div>
      <button onClick={() => setOn(!on)} style={{ padding: 4 }}>
        <Toggle on={on} />
      </button>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--r-lg)",
      border: "1px solid var(--line)", overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>{children}</div>
  );
}

export function NotificationScreen({ onBack }: NotificationScreenProps) {
  return (
    <SubPage title="提醒通知" onBack={onBack}>
      <div style={{
        display: "flex", gap: 14, marginBottom: 22,
        padding: "14px 16px",
        background: "var(--surface-warm)",
        borderRadius: "var(--r-md)", border: "1px solid var(--line)",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--primary-soft)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="bell" size={24} color="var(--primary-deep)" />
        </div>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, flex: 1 }}>
          適合的提醒會讓您更安心。<strong style={{ color: "var(--primary-deep)" }}>不會太多</strong>，只在該提醒的時候才響。
        </div>
      </div>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", margin: "20px 4px 10px", letterSpacing: "0.5px" }}>用餐提醒</div>
      <SectionCard>
        <NotifRow icon="🍚" label="早餐記錄" time="07:00" on={true} />
        <NotifRow icon="🍱" label="午餐記錄" time="12:00" on={true} />
        <NotifRow icon="🍲" label="晚餐記錄" time="18:00" on={true} last />
      </SectionCard>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", margin: "20px 4px 10px", letterSpacing: "0.5px" }}>用藥提醒</div>
      <SectionCard>
        <NotifRow icon="💊" label="降血壓藥" time="07:30 · 早餐後" on={true} />
        <NotifRow icon="💊" label="阿斯匹靈" time="12:30 · 午餐後" on={true} last />
      </SectionCard>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", margin: "20px 4px 10px", letterSpacing: "0.5px" }}>健康提醒</div>
      <SectionCard>
        <NotifRow icon="💧" label="喝水提醒" time="每 2 小時一次" on={true} />
        <NotifRow icon="🚶" label="散步提醒" time="15:00" on={true} />
        <NotifRow icon="🩺" label="量血壓" time="每天 早 · 晚" on={false} last />
      </SectionCard>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", margin: "20px 4px 10px", letterSpacing: "0.5px" }}>家人通知</div>
      <SectionCard>
        <NotifRow icon="👨" label="兒子收到警示" time="連續沒吃飯 / 健康異常" on={true} last />
      </SectionCard>

      <div style={{ height: 24 }} />
    </SubPage>
  );
}
