"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { SubPage } from "@/components/sub-page";
import { Toggle } from "@/components/toggle";
import { api, type ProfileMedication } from "@/lib/api-client";
import { inferMedicationReminderTimes, isTakenToday } from "@/lib/medication-utils";

interface ChronicDiseaseScreenProps {
  onBack: () => void;
  onScanPrescription?: () => void;
}

const CONDITIONS = [
  { id: "hypertension", label: "高血壓", icon: "💢", tip: "少鹽、注意血壓" },
  { id: "diabetes", label: "糖尿病", icon: "🩸", tip: "控制醣類、規律進食" },
  { id: "prediabetes", label: "糖尿病前期", icon: "⚠️", tip: "減糖、運動" },
  { id: "cholesterol", label: "高血脂", icon: "🫀", tip: "少油、多蔬果" },
  { id: "gout", label: "痛風", icon: "🦴", tip: "少海鮮、多喝水" },
  { id: "kidney", label: "腎臟病", icon: "🫘", tip: "低鉀、低磷" },
  { id: "osteoporosis", label: "骨質疏鬆", icon: "🦴", tip: "補鈣、曬太陽" },
  { id: "none", label: "都沒有", icon: "🙂", tip: "保持健康習慣" },
];

export function ChronicDiseaseScreen({ onBack, onScanPrescription }: ChronicDiseaseScreenProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [meds, setMeds] = useState<ProfileMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [showAddMed, setShowAddMed] = useState(false);

  useEffect(() => {
    api.getProfile()
      .then(({ profile }) => {
        setSelected(profile.chronic_conditions ?? []);
        setMeds((profile.medications ?? []).map(normalizeMedication));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    if (id === "none") {
      setSelected(selected.includes("none") ? [] : ["none"]);
      return;
    }
    setSelected((s) => {
      const next = s.filter((x) => x !== "none");
      return next.includes(id) ? next.filter((x) => x !== id) : [...next, id];
    });
  };

  const addMed = () => {
    if (!newMedName.trim()) return;
    const text = newMedDose.trim();
    setMeds([...meds, {
      name: newMedName.trim(),
      dose: text,
      time: text,
      reminder_enabled: true,
      reminder_times: inferMedicationReminderTimes(text),
      taken_today: false,
    }]);
    setNewMedName("");
    setNewMedDose("");
    setShowAddMed(false);
  };

  const removeMed = (idx: number) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const updateMed = async (idx: number, patch: Partial<ProfileMedication>) => {
    const next = meds.map((m, i) => i === idx ? { ...m, ...patch } : m);
    setMeds(next);
    try {
      await api.updateProfile({ medications: next });
    } catch (e) {
      alert("儲存用藥提醒失敗：" + (e as Error).message);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        chronic_conditions: selected,
        medications: meds,
      });
      onBack();
    } catch (e) {
      alert("儲存失敗：" + (e as Error).message);
    }
    setSaving(false);
  };

  return (
    <SubPage
      title="健康狀況"
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
            <Mascot size={50} mood="happy" />
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, flex: 1 }}>
              告訴我您的狀況，我會幫您留意每餐的<strong style={{ color: "var(--primary-deep)" }}>鹽、糖、油</strong>，給更貼心的建議
            </div>
          </div>

          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
            您有哪些狀況？（可複選）
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
            {CONDITIONS.map((c) => {
              const on = selected.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggle(c.id)} style={{
                  textAlign: "left", padding: "14px",
                  borderRadius: 16,
                  background: on ? "var(--primary-soft)" : "var(--surface)",
                  border: on ? "3px solid var(--primary)" : "2px solid var(--line)",
                  display: "flex", flexDirection: "column", gap: 4,
                  minHeight: 96, position: "relative",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 26, lineHeight: 1 }}>{c.icon}</span>
                    {on && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        width: 24, height: 24, borderRadius: "50%",
                        background: "var(--primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon name="check" size={16} color="#fff" stroke={3.5} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: on ? "var(--primary-deep)" : "var(--ink-1)" }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>{c.tip}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)" }}>
              常用藥物
            </div>
            <button onClick={() => setShowAddMed(!showAddMed)} style={{
              fontSize: "var(--fs-sm)", color: "var(--primary-deep)", fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Icon name="plus" size={18} color="var(--primary-deep)" stroke={2.5} />
              {showAddMed ? "取消" : "手動新增"}
            </button>
          </div>

          {/* 拍藥袋（AI 辨識）大按鈕 */}
          {onScanPrescription && (
            <button
              onClick={onScanPrescription}
              style={{
                width: "100%", padding: "16px 18px", marginBottom: 12,
                background: "linear-gradient(135deg, #FBE6D4, #F7E6BD)",
                border: "2px solid var(--gold-soft)",
                borderRadius: 16,
                display: "flex", alignItems: "center", gap: 14,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "var(--berry-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, flexShrink: 0,
              }}>💊</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--berry)" }}>
                  📸 拍藥袋自動辨識
                </div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                  AI 幫您看藥名、用法、注意事項
                </div>
              </div>
              <Icon name="chevronR" size={22} color="var(--ink-3)" />
            </button>
          )}

          {showAddMed && (
            <div style={{
              background: "var(--surface-warm)", borderRadius: 12,
              padding: 14, marginBottom: 12,
              border: "1px solid var(--line)",
            }}>
              <input
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="藥物名稱"
                style={{ ...miniInput, marginBottom: 8 }}
              />
              <input
                value={newMedDose}
                onChange={(e) => setNewMedDose(e.target.value)}
                placeholder="劑量（例如：每天早上 1 顆）"
                style={miniInput}
              />
              <button onClick={addMed} style={{
                marginTop: 10, width: "100%",
                padding: "10px", borderRadius: 10,
                background: "var(--primary)", color: "#fff",
                fontSize: "var(--fs-sm)", fontWeight: 600,
              }}>新增</button>
            </div>
          )}

          {meds.length === 0 && !showAddMed && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>
              還沒有藥物記錄
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {meds.map((m, i) => (
              <div key={i} style={{
                background: "var(--surface)", borderRadius: 16, padding: 16,
                border: "1px solid var(--line)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "var(--berry-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, flexShrink: 0,
                  }}>💊</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{m.name}</div>
                    {m.dose && <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{m.dose}</div>}
                  </div>
                  <button onClick={() => removeMed(i)} style={{ padding: 8 }}>
                    <Icon name="x" size={20} color="var(--ink-3)" stroke={2.5} />
                  </button>
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700 }}>用藥提醒</div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>
                        {(m.reminder_times ?? []).join("、") || "尚未設定時間"}
                      </div>
                    </div>
                    <Toggle
                      on={m.reminder_enabled !== false}
                      onChange={(on) => updateMed(i, { reminder_enabled: on })}
                    />
                  </div>

                  {m.reminder_enabled !== false && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                      <input
                        type="time"
                        value={m.reminder_times?.[0] ?? "08:00"}
                        onChange={(e) => updateMed(i, { reminder_times: [e.target.value] })}
                        style={{ ...miniInput, width: 120, margin: 0 }}
                      />
                      <button
                        onClick={() => updateMed(i, {
                          taken_today: true,
                          last_taken_at: new Date().toISOString(),
                        })}
                        style={{
                          flex: 1, padding: "10px 12px", borderRadius: 10,
                          background: isTakenToday(m) ? "var(--sage-soft)" : "var(--primary-soft)",
                          color: isTakenToday(m) ? "#4F7A4E" : "var(--primary-deep)",
                          fontSize: "var(--fs-sm)", fontWeight: 700,
                          border: "1px solid var(--line)",
                        }}
                      >
                        {isTakenToday(m) ? "今天已吃" : "標記今天已吃"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </SubPage>
  );
}

const miniInput: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "var(--surface)", border: "1px solid var(--line-strong)",
  borderRadius: 8, fontSize: "var(--fs-sm)",
  outline: "none", fontFamily: "inherit",
};

function normalizeMedication(med: ProfileMedication): ProfileMedication {
  const reminderText = [med.time, med.dose].filter(Boolean).join(" ");
  return {
    ...med,
    dose: med.dose ?? "",
    time: med.time ?? "",
    reminder_enabled: med.reminder_enabled ?? true,
    reminder_times: med.reminder_times?.length
      ? med.reminder_times
      : inferMedicationReminderTimes(reminderText),
    taken_today: med.taken_today ?? false,
  };
}
