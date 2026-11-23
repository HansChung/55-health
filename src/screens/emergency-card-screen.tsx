"use client";

// ────────────────────────────────────────────────
// 緊急聯絡卡：血型、過敏、慢性病、目前用藥、緊急聯絡人（最多 3 位）、備註
// 給救護人員或路人看；一鍵打給家人、打 119；可以印成小卡放皮夾
// 慢性病、用藥直接讀「慢性病用藥」那一頁的資料（不用再填一次）；不花 AI
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { DictationButton } from "@/components/dictation-button";
import { api, type ProfileData } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { conditionLabels } from "@/lib/ask";
import { appendDictation } from "@/lib/dictation";
import {
  BLOOD_TYPES,
  EMERGENCY_LIMITS,
  bloodLabel,
  cleanPhone,
  emergencyFormError,
  isEmergencyEmpty,
  medicationLines,
  normalizeEmergencyInfo,
  telHref,
  toStoredEmergency,
  type BloodType,
  type EmergencyInfo,
} from "@/lib/emergency-card";

type CardProfile = Pick<ProfileData, "display_name" | "age" | "chronic_conditions" | "medications" | "emergency_contact">;

const RED = "#C2363B";

const fieldLabel: React.CSSProperties = { display: "block", fontSize: "var(--fs-base)", fontWeight: 800, marginBottom: 8 };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface)", border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
  padding: "14px 16px", fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--ink-1)", outline: "none", fontFamily: "inherit",
};
const callButton = (bg: string): React.CSSProperties => ({
  width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", minHeight: 72, borderRadius: 16,
  background: bg, color: "#fff", fontSize: "var(--fs-lg)", fontWeight: 800, textAlign: "left", border: "none",
  boxShadow: "var(--shadow-sm)", cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
});

function Row({ label, children, empty }: { label: string; children: React.ReactNode; empty?: boolean }) {
  return (
    // 小螢幕＋大字：右邊不到 150px 寬時，內容整個換到標題下面（電話才不會擠出卡片）
    <div className="emergency-row" style={{ display: "flex", flexWrap: "wrap", columnGap: 10, alignItems: "baseline", padding: "8px 0", borderTop: "1px solid var(--line)" }}>
      <div style={{ flexShrink: 0, width: "4.6em", fontSize: "var(--fs-sm)", fontWeight: 800, color: RED }}>{label}</div>
      <div style={{ flex: "1 1 150px", minWidth: 0, fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.4, color: empty ? "var(--ink-3)" : "var(--ink-1)", overflowWrap: "anywhere" }}>
        {children}
      </div>
    </div>
  );
}

interface Props {
  onBack: () => void;
  profile: CardProfile | null;
  onProfileUpdated: (profile: ProfileData) => void;
  /** 去「慢性病用藥」改病史和藥 */
  onEditHealth: () => void;
}

/** 個人資料還沒讀到就先等：不然會以為什麼都沒填，直接打開空白表單（存了會蓋掉原本的） */
export function EmergencyCardScreen(props: Props) {
  if (!props.profile) {
    return (
      <SubPage title="緊急聯絡卡" onBack={props.onBack}>
        <div style={{ padding: "48px 0", textAlign: "center", fontSize: "var(--fs-base)", color: "var(--ink-2)" }}>讀取中…</div>
      </SubPage>
    );
  }
  return <EmergencyCard {...props} profile={props.profile} />;
}

function EmergencyCard({ onBack, profile, onProfileUpdated, onEditHealth }: Props & { profile: CardProfile }) {
  const toast = useToast();
  const info = normalizeEmergencyInfo(profile.emergency_contact);
  const [editing, setEditing] = useState(() => isEmergencyEmpty(info));
  const [draft, setDraft] = useState<EmergencyInfo>(info);
  /** 表單裡的聯絡人（可以有空白列） */
  const [rows, setRows] = useState(() => (info.contacts.length ? info.contacts.map((c) => ({ ...c })) : [{ name: "", phone: "" }]));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 看卡片 ↔ 改資料 切換時回到最上面（同一個捲動區，不然會停在剛剛按鈕的位置）
  const topRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) topRef.current?.closest(".scroll-area")?.scrollTo({ top: 0 });
    mounted.current = true;
  }, [editing]);

  const conditions = conditionLabels(profile.chronic_conditions);
  const meds = medicationLines(profile.medications);
  const blood = bloodLabel(info);
  const name = profile.display_name?.trim() || "（還沒寫名字）";

  const startEdit = () => {
    setDraft(info);
    setRows(info.contacts.length ? info.contacts.map((c) => ({ ...c })) : [{ name: "", phone: "" }]);
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    const problem = emergencyFormError(rows);
    if (problem) return setError(problem);
    const stored = toStoredEmergency({ ...draft, contacts: rows.map((r) => ({ name: r.name, phone: cleanPhone(r.phone) })) });
    setSaving(true);
    setError(null);
    try {
      // 全部清空就存 null（卡片變回「還沒填」）
      const { profile: updated } = await api.updateProfile({ emergency_contact: stored });
      onProfileUpdated(updated);
      toast.success("緊急聯絡卡存好了");
      setEditing(false);
    } catch (e) {
      console.warn("[emergency-card] save failed:", e);
      setError("沒存成功，請再試一次");
    }
    setSaving(false);
  };

  const print = () => {
    document.body.classList.add("printing-emergency");
    const done = () => {
      document.body.classList.remove("printing-emergency");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  const setRow = (i: number, patch: Partial<{ name: string; phone: string }>) =>
    setRows((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  if (editing) {
    return (
      <SubPage title="緊急聯絡卡" onBack={isEmergencyEmpty(info) ? onBack : () => setEditing(false)}>
        <div ref={topRef} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
            萬一在外面不舒服，救護人員看這張卡就知道要注意什麼、要打給誰。知道多少填多少，不知道的可以空著。
          </div>

          <div>
            <div style={fieldLabel}>① 緊急聯絡人（最多 {EMERGENCY_LIMITS.contacts} 位）</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {rows.map((row, i) => (
                <div key={i} className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--ink-2)" }}>
                    第 {i + 1} 位
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRows((list) => list.filter((_, j) => j !== i))}
                        style={{ minHeight: 44, padding: "0 12px", background: "none", border: "none", color: "var(--berry)", fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        拿掉
                      </button>
                    )}
                  </div>
                  <input
                    aria-label={`第 ${i + 1} 位聯絡人怎麼稱呼`}
                    value={row.name}
                    maxLength={EMERGENCY_LIMITS.name}
                    onChange={(e) => setRow(i, { name: e.target.value })}
                    placeholder="怎麼稱呼？例如：女兒小美"
                    style={inputStyle}
                  />
                  <input
                    aria-label={`第 ${i + 1} 位聯絡人的電話`}
                    type="tel"
                    inputMode="tel"
                    value={row.phone}
                    maxLength={EMERGENCY_LIMITS.phone}
                    onChange={(e) => setRow(i, { phone: e.target.value })}
                    placeholder="電話，例如 0912345678"
                    style={inputStyle}
                  />
                </div>
              ))}
              {rows.length < EMERGENCY_LIMITS.contacts && (
                <button type="button" className="btn-ghost" style={{ width: "100%" }} onClick={() => setRows((list) => [...list, { name: "", phone: "" }])}>
                  ＋ 再加一位
                </button>
              )}
            </div>
          </div>

          <div>
            <div style={fieldLabel}>② 血型</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {([...BLOOD_TYPES, null] as (BloodType | null)[]).map((t) => {
                const on = draft.bloodType === t;
                return (
                  <button
                    key={t ?? "unknown"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDraft((d) => ({ ...d, bloodType: t, rhNegative: t ? d.rhNegative : false }))}
                    style={{
                      minHeight: 60, borderRadius: "var(--r-md)", cursor: "pointer", fontFamily: "inherit", padding: "4px 0",
                      fontSize: t ? "var(--fs-lg)" : "var(--fs-xs)", fontWeight: 800, color: "var(--ink-1)",
                      border: `2px solid ${on ? "var(--primary)" : "var(--line-strong)"}`,
                      background: on ? "var(--primary-soft)" : "var(--surface)",
                    }}
                  >
                    {t ?? "不知道"}
                  </button>
                );
              })}
            </div>
            {draft.bloodType && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, minHeight: 44, fontSize: "var(--fs-sm)", fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={draft.rhNegative}
                  onChange={(e) => setDraft((d) => ({ ...d, rhNegative: e.target.checked }))}
                  style={{ width: 26, height: 26, flexShrink: 0 }}
                />
                我是 Rh 陰性（很少見，醫院說過才勾）
              </label>
            )}
          </div>

          <div>
            <label htmlFor="emergency-allergies" style={fieldLabel}>③ 對什麼過敏？</label>
            <textarea
              id="emergency-allergies"
              value={draft.allergies}
              maxLength={EMERGENCY_LIMITS.allergies}
              onChange={(e) => setDraft((d) => ({ ...d, allergies: e.target.value }))}
              placeholder="例如：盤尼西林、阿斯匹靈、蝦子。沒有就寫「沒有」"
              rows={2}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
            <div style={{ marginTop: 8 }}>
              <DictationButton where="emergency_card" disabled={saving} onText={(t) => setDraft((d) => ({ ...d, allergies: appendDictation(d.allergies, t, EMERGENCY_LIMITS.allergies) }))} />
            </div>
          </div>

          <div>
            <label htmlFor="emergency-note" style={fieldLabel}>④ 還有什麼要讓救護人員知道？</label>
            <textarea
              id="emergency-note"
              value={draft.note}
              maxLength={EMERGENCY_LIMITS.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="例如：裝了心律調節器、吃抗凝血的藥、重聽"
              rows={2}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
            <div style={{ marginTop: 8 }}>
              <DictationButton where="emergency_card" disabled={saving} onText={(t) => setDraft((d) => ({ ...d, note: appendDictation(d.note, t, EMERGENCY_LIMITS.note) }))} />
            </div>
          </div>

          {error && (
            <div role="alert" style={{ padding: 12, background: "var(--berry-soft)", borderRadius: 12, color: "#9B2F44", fontSize: "var(--fs-sm)", fontWeight: 700 }}>
              {error}
            </div>
          )}
          <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={save} disabled={saving}>
            {saving ? "儲存中…" : "存起來"}
          </button>
        </div>
      </SubPage>
    );
  }

  return (
    <SubPage title="緊急聯絡卡" onBack={onBack}>
      <style>{`
        @media print {
          body.printing-emergency * { visibility: hidden !important; }
          body.printing-emergency .emergency-print, body.printing-emergency .emergency-print * { visibility: visible !important; }
          /* 皮夾大小的小卡：寬 9 公分，沿虛線剪下來 */
          body.printing-emergency .emergency-print {
            position: absolute; left: 1cm; top: 1cm; width: 9cm; padding: 0.35cm !important;
            border: 1px dashed #666 !important; border-radius: 0 !important; box-shadow: none !important; background: #fff !important;
          }
          body.printing-emergency .emergency-print, body.printing-emergency .emergency-print * { font-size: 10.5pt !important; line-height: 1.35 !important; }
          body.printing-emergency .emergency-print .emergency-name { font-size: 15pt !important; }
          body.printing-emergency .emergency-print .emergency-row { padding: 2pt 0 !important; }
        }
      `}</style>
      <div ref={topRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card emergency-print" style={{ padding: 18, border: `3px solid ${RED}`, background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: RED, fontSize: "var(--fs-sm)", fontWeight: 800, letterSpacing: 1 }}>
            <span aria-hidden="true">🆘</span> 緊急聯絡卡
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 12, margin: "6px 0 10px" }}>
            <span className="emergency-name" style={{ fontSize: "var(--fs-xl)", fontWeight: 800, lineHeight: 1.25, overflowWrap: "anywhere" }}>{name}</span>
            {profile.age != null && <span style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-2)", whiteSpace: "nowrap" }}>{profile.age} 歲</span>}
          </div>
          <Row label="血型" empty={!blood}>{blood ?? "沒有填"}</Row>
          <Row label="過敏" empty={!info.allergies}>{info.allergies || "沒有填"}</Row>
          <Row label="慢性病" empty={conditions.length === 0}>{conditions.length ? conditions.join("、") : "沒有填"}</Row>
          <Row label="目前用藥" empty={meds.lines.length === 0}>
            {meds.lines.length ? `${meds.lines.join("、")}${meds.more ? `…還有 ${meds.more} 種` : ""}` : "沒有填"}
          </Row>
          {info.note && <Row label="注意">{info.note}</Row>}
          <Row label="聯絡人" empty={info.contacts.length === 0}>
            {info.contacts.length
              ? info.contacts.map((c) => (
                  // 電話整串不斷行：放不下就整串換到下一行
                  <div key={c.phone} style={{ display: "flex", flexWrap: "wrap", columnGap: 12 }}>
                    <span style={{ overflowWrap: "anywhere" }}>{c.name}</span>
                    <span style={{ whiteSpace: "nowrap" }}>{c.phone}</span>
                  </div>
                ))
              : "沒有填"}
          </Row>
        </div>

        {info.contacts.map((c) => (
          <a key={c.phone} href={telHref(c.phone) ?? undefined} style={callButton("#2E8B57")}>
            <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">📞</span>
            <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              打給 {c.name}
              <span style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, opacity: 0.95 }}>{c.phone}</span>
            </span>
          </a>
        ))}
        <a href="tel:119" style={callButton("#1F2937")}>
          <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">🚑</span>
          <span>
            撥打 119
            <span style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, opacity: 0.95 }}>消防、救護車</span>
          </span>
        </a>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button type="button" className="btn-ghost" onClick={startEdit} style={{ padding: "12px 8px" }}>✏️ 改資料</button>
          <button type="button" className="btn-ghost" onClick={print} style={{ padding: "12px 8px" }}>🖨️ 印成小卡</button>
        </div>
        <button type="button" className="btn-ghost" onClick={onEditHealth} style={{ width: "100%", fontSize: "var(--fs-sm)" }}>
          💊 慢性病、用藥在「慢性病用藥」改
        </button>

        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6, background: "var(--surface-warm)", border: "1px solid var(--gold-soft)", borderRadius: "var(--r-md)", padding: 14 }}>
          💡 手機鎖住時別人看不到這一頁。建議印成小卡放皮夾、健保卡旁邊；或把這一頁截圖，設成手機的鎖定畫面。
          <br />這張卡只有你自己看得到，不會給家人或其他人。
        </div>
      </div>
    </SubPage>
  );
}
