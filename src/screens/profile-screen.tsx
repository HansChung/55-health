"use client";

import { Icon } from "@/components/icons";
import { Subpage } from "@/lib/types";

interface ProfileScreenProps {
  onSubpage: (page: Subpage) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px 24px 0" }}>
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 10, padding: "0 4px", letterSpacing: "0.5px" }}>
        {title}
      </div>
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--line)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({ icon, iconColor, label, value, arrow, onClick }: {
  icon: string; iconColor: string; label: string; value: string; arrow?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left",
      padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
      borderBottom: "1px solid var(--line)",
      background: "transparent",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: iconColor + "22",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={icon} size={24} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 600 }}>{label}</div>
        {value && <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2 }}>{value}</div>}
      </div>
      {arrow && <Icon name="chevronR" size={22} color="var(--ink-3)" />}
    </button>
  );
}

export function ProfileScreen({ onSubpage }: ProfileScreenProps) {
  return (
    <div className="scroll-area" style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>
      <div style={{ padding: "8px 24px 16px" }}>
        <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          我的
        </h1>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div className="card" style={{
          padding: 20,
          background: "linear-gradient(135deg, #FFF9EF 0%, #FBE6D4 100%)",
          border: "1px solid var(--gold-soft)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--primary-soft)",
            border: "3px solid var(--surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38, fontWeight: 700, color: "var(--primary-deep)",
            boxShadow: "var(--shadow-sm)",
          }}>王</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700 }}>王月霞</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              62 歲　·　女性
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              已使用 28 天
            </div>
          </div>
          <button style={{ padding: 10 }}>
            <Icon name="pencil" size={26} color="var(--ink-2)" />
          </button>
        </div>
      </div>

      <Section title="健康狀況">
        <Row icon="heart" iconColor="var(--berry)" label="慢性病與用藥" value="高血壓、糖尿病前期" arrow onClick={() => onSubpage("chronic")} />
        <Row icon="target" iconColor="var(--primary)" label="今日目標" value="1,800 大卡　·　減重" arrow />
        <Row icon="flame" iconColor="var(--gold)" label="運動記錄" value="今天 40 分鐘" arrow onClick={() => onSubpage("exercise")} />
      </Section>

      <Section title="使用設定">
        <Row icon="sun" iconColor="var(--gold)" label="字級大小" value="加大" arrow onClick={() => onSubpage("font")} />
        <Row icon="bell" iconColor="var(--primary)" label="提醒通知" value="9 項已開啟" arrow onClick={() => onSubpage("notif")} />
        <Row icon="user" iconColor="var(--sage)" label="家人共享" value="2 位家人已連結" arrow onClick={() => onSubpage("family")} />
        <Row icon="settings" iconColor="var(--ink-2)" label="更多設定" value="" arrow />
      </Section>

      <div style={{ padding: "16px 24px 0", fontSize: "var(--fs-xs)", color: "var(--ink-3)", textAlign: "center" }}>
        暖暖 v1.0　·　由 Gemini Pro + GPT realtime 提供
      </div>
    </div>
  );
}
