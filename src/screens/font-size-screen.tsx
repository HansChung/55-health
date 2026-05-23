"use client";

import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { FontScale } from "@/lib/types";

interface FontSizeScreenProps {
  onBack: () => void;
  fontScale: FontScale;
  setFontScale: (v: FontScale) => void;
}

export function FontSizeScreen({ onBack, fontScale, setFontScale }: FontSizeScreenProps) {
  const opts: { id: FontScale; label: string; desc: string; sample: number }[] = [
    { id: "base", label: "加大", desc: "一般長者建議", sample: 22 },
    { id: "lg", label: "超大", desc: "視力較不好時", sample: 28 },
  ];

  return (
    <SubPage title="字級大小" onBack={onBack}>
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "0 0 20px" }}>
        選擇您看得清楚的大小，整個 App 都會跟著改變。
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {opts.map(o => {
          const on = fontScale === o.id;
          return (
            <button key={o.id} onClick={() => setFontScale(o.id)} style={{
              textAlign: "left",
              background: on ? "var(--primary-soft)" : "var(--surface)",
              border: on ? "3px solid var(--primary)" : "2px solid var(--line)",
              borderRadius: "var(--r-lg)", padding: 18,
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: on ? "#fff" : "var(--bg-deep)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: o.sample, fontWeight: 800,
                color: on ? "var(--primary-deep)" : "var(--ink-2)",
                flexShrink: 0,
              }}>大</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700 }}>{o.label}</div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{o.desc}</div>
              </div>
              {on && (
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="check" size={20} color="#fff" stroke={3.5} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 28, fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
        看看效果
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700, marginBottom: 6 }}>
          今天吃得不錯
        </div>
        <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", lineHeight: 1.5 }}>
          熱量剛好，記得多喝水。
        </div>
      </div>
    </SubPage>
  );
}
