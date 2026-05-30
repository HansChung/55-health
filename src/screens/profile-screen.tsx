"use client";

import { Icon } from "@/components/icons";
import { Subpage } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { tierLabel } from "@/lib/feature-gates";

interface ProfileScreenProps {
  onSubpage: (page: Subpage) => void;
  onOnboarding: () => void;
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

export function ProfileScreen({ onSubpage, onOnboarding }: ProfileScreenProps) {
  const { user, profile, signOut } = useAuth();

  const name = profile?.display_name ?? user?.email?.split("@")[0] ?? "用戶";
  const initial = name.charAt(0).toUpperCase();
  const subtitle = [
    profile?.age ? `${profile.age} 歲` : null,
    profile?.gender === "male" ? "男性" : profile?.gender === "female" ? "女性" : null,
  ].filter(Boolean).join("　·　");

  const memberDays = user?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000))
    : 0;

  const conditions = profile?.chronic_conditions ?? [];
  const conditionLabel = conditions.length > 0
    ? conditions.map(labelCondition).join("、")
    : "尚未設定";

  const tier = profile?.subscription_tier ?? "free";
  const currentTierLabel = tierLabel(tier);

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
          }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email}
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              {subtitle || "尚未設定個人資料"}　·　已使用 {memberDays} 天
            </div>
          </div>
          <button style={{ padding: 10 }} onClick={() => onSubpage("edit-profile")}>
            <Icon name="pencil" size={26} color="var(--ink-2)" />
          </button>
        </div>
      </div>

      <Section title="健康狀況">
        <Row icon="heart" iconColor="var(--berry)" label="慢性病與用藥" value={conditionLabel} arrow onClick={() => onSubpage("chronic")} />
        <Row icon="target" iconColor="var(--primary)" label="今日目標" value={`${profile?.calorie_goal ?? 1800} 大卡`} arrow />
        <Row icon="heart" iconColor="#7AA779" label="體重 / 血壓 / 血糖" value="健康數值追蹤" arrow onClick={() => onSubpage("health-metrics")} />
        <Row icon="flame" iconColor="var(--gold)" label="運動記錄" value="查看詳細" arrow onClick={() => onSubpage("exercise")} />
        <Row icon="book" iconColor="var(--primary-deep)" label="每週健康報告" value="查看本週摘要" arrow onClick={() => onSubpage("weekly-report")} />
        <Row icon="sparkle" iconColor="var(--gold)" label="健康成就" value="查看徽章與連續記錄" arrow onClick={() => onSubpage("achievements")} />
      </Section>

      <Section title="訂閱方案">
        <Row icon="sparkle" iconColor="var(--primary)" label="目前方案" value={currentTierLabel} arrow onClick={() => window.location.href = "/pricing"} />
      </Section>

      <Section title="使用設定">
        <Row icon="sun" iconColor="var(--gold)" label="字級大小" value={profile?.font_scale === "lg" ? "超大" : "加大"} arrow onClick={() => onSubpage("font")} />
        <Row icon="bell" iconColor="var(--primary)" label="提醒通知" value="設定提醒" arrow onClick={() => onSubpage("notif")} />
        <Row icon="user" iconColor="var(--sage)" label="家人共享" value="邀請家人" arrow onClick={() => onSubpage("family")} />
        <Row icon="book" iconColor="var(--gold)" label="重新看教學" value="熟悉新功能" arrow onClick={onOnboarding} />
        {profile?.is_admin && (
          <Row icon="settings" iconColor="var(--ink-2)" label="管理後台" value="Admin Dashboard" arrow onClick={() => window.location.href = "/admin"} />
        )}
      </Section>

      <div style={{ padding: "24px 24px 0" }}>
        <button
          onClick={async () => { if (confirm("確定要登出？")) { await signOut(); window.location.reload(); } }}
          style={{
            width: "100%", padding: "14px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            color: "var(--berry)",
            fontSize: "var(--fs-base)", fontWeight: 600,
          }}
        >登出</button>
      </div>

      <div style={{ padding: "16px 24px 0", fontSize: "var(--fs-xs)", color: "var(--ink-3)", textAlign: "center" }}>
        暖暖 v1.0　·　由 Gemini Pro + GPT realtime 提供
      </div>
    </div>
  );
}

function labelCondition(id: string): string {
  const map: Record<string, string> = {
    hypertension: "高血壓",
    diabetes: "糖尿病",
    prediabetes: "糖尿病前期",
    cholesterol: "高血脂",
    gout: "痛風",
    kidney: "腎臟病",
    osteoporosis: "骨質疏鬆",
    none: "無",
  };
  return map[id] ?? id;
}
