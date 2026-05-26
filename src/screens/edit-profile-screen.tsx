"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { api } from "@/lib/api-client";
import type { AppProfile } from "@/hooks/use-auth";

interface EditProfileScreenProps {
  onBack: () => void;
  profile: AppProfile | null;
  onSaved: () => void;
}

export function EditProfileScreen({ onBack, profile, onSaved }: EditProfileScreenProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">(profile?.gender as "male" | "female" | "other" | "" ?? "");
  const [calorieGoal, setCalorieGoal] = useState(profile?.calorie_goal?.toString() ?? "1800");
  const [voiceTone, setVoiceTone] = useState<"warm" | "strict" | "grandchild">(profile?.voice_tone ?? "warm");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { profile: updated } = await api.updateProfile({
        display_name: displayName || undefined,
        age: age ? Number(age) : null,
        gender: gender || null,
        calorie_goal: Number(calorieGoal),
        voice_tone: voiceTone,
      });
      console.log("[edit-profile] saved:", updated);
      onSaved();      // 觸發 useAuth 重新載入
      // 稍等一下讓 refreshProfile 把新資料抓回來
      await new Promise((r) => setTimeout(r, 300));
      onBack();
    } catch (e) {
      console.error("[edit-profile] save failed:", e);
      setError((e as Error).message);
    }
    setSaving(false);
  };

  return (
    <SubPage
      title="編輯個人資料"
      onBack={onBack}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
      footer={
        <button
          className="btn-primary"
          style={{ width: "100%", opacity: saving ? 0.6 : 1 }}
          disabled={saving}
          onClick={save}
        >
          <Icon name="check" size={26} color="#fff" stroke={3} />
          {saving ? "儲存中…" : "儲存"}
        </button>
      }
    >
      {error && (
        <div style={{
          padding: 12, marginBottom: 16,
          background: "var(--berry-soft)", borderRadius: 12,
          color: "var(--berry)", fontSize: "var(--fs-sm)",
        }}>儲存失敗：{error}</div>
      )}

      <Field label="姓名（怎麼稱呼您？）">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例如：王奶奶"
          style={inputStyle}
        />
      </Field>

      <Field label="年齡">
        <input
          type="number"
          inputMode="numeric"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="62"
          style={inputStyle}
        />
      </Field>

      <Field label="性別">
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { v: "female" as const, label: "女性" },
            { v: "male" as const, label: "男性" },
            { v: "other" as const, label: "其他" },
          ].map((g) => (
            <button
              key={g.v}
              onClick={() => setGender(g.v)}
              style={{
                flex: 1, padding: "14px",
                borderRadius: 14,
                background: gender === g.v ? "var(--primary)" : "var(--surface)",
                color: gender === g.v ? "#fff" : "var(--ink-1)",
                border: gender === g.v ? "none" : "2px solid var(--line-strong)",
                fontSize: "var(--fs-base)", fontWeight: 700,
              }}
            >{g.label}</button>
          ))}
        </div>
      </Field>

      <Field label="每日卡路里目標">
        <input
          type="number"
          inputMode="numeric"
          value={calorieGoal}
          onChange={(e) => setCalorieGoal(e.target.value)}
          placeholder="1800"
          style={inputStyle}
        />
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 6 }}>
          建議成年女性 1500-1800，男性 1800-2200
        </div>
      </Field>

      <Field label="暖暖的說話語氣">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { v: "warm" as const, label: "🤗 溫和體貼", desc: "像家人一樣關心您" },
            { v: "strict" as const, label: "👨‍⚕️ 專業嚴謹", desc: "提供精確的健康建議" },
            { v: "grandchild" as const, label: "👧 孫輩撒嬌", desc: "可愛活潑陪您聊天" },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setVoiceTone(t.v)}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                background: voiceTone === t.v ? "var(--primary-soft)" : "var(--surface)",
                border: voiceTone === t.v ? "3px solid var(--primary)" : "2px solid var(--line)",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{t.label}</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </Field>
    </SubPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "2px solid var(--line-strong)",
  borderRadius: "var(--r-md)",
  padding: "16px 18px",
  fontSize: "var(--fs-lg)",
  fontWeight: 600,
  color: "var(--ink-1)",
  outline: "none",
  fontFamily: "inherit",
};
