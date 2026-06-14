"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { Toggle } from "@/components/toggle";
import { api, type NotificationSettings } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface NotificationScreenProps {
  onBack: () => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  meal_breakfast: { on: true, time: "07:00" },
  meal_lunch: { on: true, time: "12:00" },
  meal_dinner: { on: true, time: "18:00" },
  water: { on: true, interval_hours: 2 },
  walk: { on: true, time: "15:00" },
  blood_pressure: { on: false, times: ["08:00", "20:00"] },
  family_alerts: { on: true },
};

export function NotificationScreen({ onBack }: NotificationScreenProps) {
  const toast = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getProfile()
      .then(({ profile }) => {
        if (profile.notification_settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...profile.notification_settings });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = async (key: keyof NotificationSettings, value: unknown) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    try {
      await api.updateProfile({ notification_settings: newSettings });
    } catch (e) {
      console.error("儲存通知設定失敗:", e);
      toast.error("沒存成功，請再試一次。");
    }
    setSaving(false);
  };

  return (
    <SubPage title="提醒通知" onBack={onBack}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--ink-2)" }}>載入中…</div>
      ) : (
        <>
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
              {saving && <span style={{ color: "var(--sage)", marginLeft: 6 }}>儲存中…</span>}
            </div>
          </div>

          <SectionTitle>用餐提醒</SectionTitle>
          <Card>
            <NotifRow icon="🍚" label="早餐記錄"
              time={settings.meal_breakfast?.time ?? "07:00"}
              on={settings.meal_breakfast?.on ?? true}
              onChange={(on) => updateSetting("meal_breakfast", { ...settings.meal_breakfast, on })}
            />
            <NotifRow icon="🍱" label="午餐記錄"
              time={settings.meal_lunch?.time ?? "12:00"}
              on={settings.meal_lunch?.on ?? true}
              onChange={(on) => updateSetting("meal_lunch", { ...settings.meal_lunch, on })}
            />
            <NotifRow icon="🍲" label="晚餐記錄"
              time={settings.meal_dinner?.time ?? "18:00"}
              on={settings.meal_dinner?.on ?? true}
              onChange={(on) => updateSetting("meal_dinner", { ...settings.meal_dinner, on })}
              last
            />
          </Card>

          <SectionTitle>健康提醒</SectionTitle>
          <Card>
            <NotifRow icon="💧" label="喝水提醒"
              time={`每 ${settings.water?.interval_hours ?? 2} 小時一次`}
              on={settings.water?.on ?? true}
              onChange={(on) => updateSetting("water", { ...settings.water, on })}
            />
            <NotifRow icon="🚶" label="散步提醒"
              time={settings.walk?.time ?? "15:00"}
              on={settings.walk?.on ?? true}
              onChange={(on) => updateSetting("walk", { ...settings.walk, on })}
            />
            <NotifRow icon="🩺" label="量血壓"
              time={(settings.blood_pressure?.times ?? ["08:00", "20:00"]).join(" · ")}
              on={settings.blood_pressure?.on ?? false}
              onChange={(on) => updateSetting("blood_pressure", { ...settings.blood_pressure, on })}
              last
            />
          </Card>

          <SectionTitle>家人通知</SectionTitle>
          <Card>
            <NotifRow icon="👨" label="家人收到警示"
              time="連續沒吃飯 / 健康異常"
              on={settings.family_alerts?.on ?? true}
              onChange={(on) => updateSetting("family_alerts", { on })}
              last
            />
          </Card>

          <div style={{
            marginTop: 24, padding: 14,
            background: "var(--surface-warm)", borderRadius: 12,
            fontSize: "var(--fs-xs)", color: "var(--ink-3)", textAlign: "center",
          }}>
            ⚠️ 提醒功能需要瀏覽器/App 允許推播權限，且 App 開啟才會通知。
            真正的背景排程提醒在 Android/iOS 原生 App 才會運作。
          </div>

          <div style={{ height: 24 }} />
        </>
      )}
    </SubPage>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "var(--fs-sm)", fontWeight: 700,
      color: "var(--ink-2)", margin: "20px 4px 10px", letterSpacing: "0.5px",
    }}>{children}</div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--r-lg)",
      border: "1px solid var(--line)", overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>{children}</div>
  );
}

function NotifRow({ icon, label, time, on, onChange, last }: {
  icon: string; label: string; time: string; on: boolean; onChange: (on: boolean) => void; last?: boolean;
}) {
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
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
