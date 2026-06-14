"use client";

import { Icon } from "./icons";
import { Tab } from "@/lib/types";

interface BottomNavProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  onCamera: () => void;
  onVoice: () => void;
}

export function BottomNav({ tab, setTab, onCamera, onVoice }: BottomNavProps) {
  const tabs = [
    { id: "home" as const, label: "首頁", icon: "home" },
    { id: "history" as const, label: "日記", icon: "calendar" },
    { id: "camera" as const, label: "", icon: "camera", fab: true },
    { id: "voice" as const, label: "對話", icon: "mic" },
    { id: "profile" as const, label: "我的", icon: "user" },
  ];

  const handle = (id: string) => {
    if (id === "camera") return onCamera();
    if (id === "voice") return onVoice();
    setTab(id as Tab);
  };

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "var(--surface)",
      borderTop: "1px solid var(--line)",
      padding: "8px 12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      boxShadow: "0 -4px 20px rgba(75, 50, 30, 0.05)",
      zIndex: 30,
    }}>
      {tabs.map(t => {
        if (t.fab) {
          return (
            <button key={t.id} onClick={() => handle(t.id)} aria-label="拍照記錄餐點" style={{
              width: 68, height: 68, borderRadius: "50%",
              background: "linear-gradient(135deg, #F4B58E, #E8845A)",
              boxShadow: "0 6px 0 var(--primary-deep), 0 10px 20px rgba(201, 94, 54, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: -28,
              border: "4px solid var(--surface)",
            }}>
              <Icon name="camera" size={32} color="#fff" stroke={2.2} />
            </button>
          );
        }
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => handle(t.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 6px", minWidth: 60,
            color: active ? "var(--primary-deep)" : "var(--ink-2)",
          }}>
            <Icon name={t.icon} size={28} color={active ? "var(--primary)" : "var(--ink-2)"} stroke={active ? 2.5 : 2} />
            <span style={{
              fontSize: "var(--fs-xs)",
              fontWeight: active ? 700 : 500,
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
