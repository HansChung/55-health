"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { api, type EmergencyContact } from "@/lib/api-client";

/**
 * 緊急求助（SOS）浮動按鈕。
 * - 放在首頁右下角，捲動時固定。
 * - 點一下開啟求助視窗：撥打緊急聯絡人 / 用 LINE 傳訊息 / 撥打 119。
 * - 第一次使用會先請用戶設定緊急聯絡人（姓名 + 電話）。
 * 直接讀 AuthContext（符合專案「共用 auth context」規範）。
 */
export function SosButton() {
  const { profile, setProfileDirectly } = useAuth();
  const [open, setOpen] = useState(false);

  if (!profile) return null;

  return (
    <>
      <button
        aria-label="緊急求助"
        onClick={() => setOpen(true)}
        style={{
          position: "absolute",
          right: 16,
          bottom: 104,
          zIndex: 60,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #E5484D 0%, #C2363B 100%)",
          color: "#fff",
          border: "3px solid #fff",
          boxShadow: "0 6px 18px rgba(197, 54, 59, 0.45)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Icon name="phone" size={22} color="#fff" stroke={2.4} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>求助</span>
      </button>

      {open && (
        <SosSheet
          profile={profile}
          onClose={() => setOpen(false)}
          onContactSaved={(contact) =>
            setProfileDirectly({ ...profile, emergency_contact: contact })
          }
        />
      )}
    </>
  );
}

function SosSheet({
  profile,
  onClose,
  onContactSaved,
}: {
  profile: NonNullable<ReturnType<typeof useAuth>["profile"]>;
  onClose: () => void;
  onContactSaved: (contact: EmergencyContact) => void;
}) {
  const contact = profile.emergency_contact ?? null;
  const [editing, setEditing] = useState(!contact);
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const myName = profile.display_name || "長輩";

  const callPhone = (num: string) => {
    window.location.href = `tel:${num.replace(/\s/g, "")}`;
  };

  const sendLine = () => {
    const text = `【緊急求助】我是 ${myName}，現在需要協助，請盡快與我聯絡！`;
    window.open(
      `https://line.me/R/msg/text/?${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const saveContact = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName || cleanPhone.length < 3) {
      setError("請填寫聯絡人姓名與電話");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const next: EmergencyContact = { name: cleanName, phone: cleanPhone };
      await api.updateProfile({ emergency_contact: next });
      onContactSaved(next);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message || "儲存失敗，請再試一次");
    }
    setSaving(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        background: "rgba(20, 14, 10, 0.55)",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--bg)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "24px 22px calc(24px + env(safe-area-inset-bottom))",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: 0 }}>緊急求助</h2>
          <button onClick={onClose} aria-label="關閉" style={{ padding: 6 }}>
            <Icon name="x" size={26} color="var(--ink-2)" stroke={2.5} />
          </button>
        </div>

        {!editing && contact ? (
          <>
            <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", margin: "0 0 18px" }}>
              需要幫忙嗎？點下面的按鈕馬上聯絡。
            </p>

            <button onClick={() => callPhone(contact.phone)} style={bigBtn("#E5484D")}>
              <Icon name="phone" size={28} color="#fff" stroke={2.4} />
              <span>
                打電話給 {contact.name}
                <span style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, opacity: 0.92 }}>
                  {contact.phone}
                </span>
              </span>
            </button>

            <button onClick={sendLine} style={bigBtn("#06C755")}>
              <Icon name="waveform" size={26} color="#fff" stroke={2.4} />
              <span>用 LINE 傳求助訊息</span>
            </button>

            <button onClick={() => callPhone("119")} style={bigBtn("#1F2937")}>
              <Icon name="plus" size={26} color="#fff" stroke={3} />
              <span>
                撥打 119
                <span style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, opacity: 0.92 }}>
                  消防 / 救護車
                </span>
              </span>
            </button>

            <button
              onClick={() => setEditing(true)}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "12px",
                background: "transparent",
                color: "var(--ink-2)",
                fontSize: "var(--fs-sm)",
                fontWeight: 700,
              }}
            >
              修改緊急聯絡人
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", margin: "0 0 18px" }}>
              先設定一位緊急聯絡人（例如家人），之後遇到狀況就能一鍵聯絡。
            </p>

            {error && (
              <div style={{
                padding: 12, marginBottom: 14,
                background: "var(--berry-soft)", borderRadius: 12,
                color: "var(--berry)", fontSize: "var(--fs-sm)", fontWeight: 600,
              }}>{error}</div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>聯絡人怎麼稱呼？</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：大兒子、女兒小美"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>聯絡電話</label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                style={inputStyle}
              />
            </div>

            <button
              onClick={saveContact}
              disabled={saving}
              style={{ ...bigBtn("var(--primary)"), opacity: saving ? 0.6 : 1, marginBottom: contact ? 8 : 0 }}
            >
              <Icon name="check" size={26} color="#fff" stroke={3} />
              <span>{saving ? "儲存中…" : "儲存緊急聯絡人"}</span>
            </button>

            {contact && (
              <button
                onClick={() => { setEditing(false); setError(""); }}
                style={{
                  width: "100%", padding: "12px", background: "transparent",
                  color: "var(--ink-2)", fontSize: "var(--fs-sm)", fontWeight: 700,
                }}
              >
                取消
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function bigBtn(bg: string): React.CSSProperties {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 20px",
    marginBottom: 12,
    borderRadius: 16,
    background: bg,
    color: "#fff",
    fontSize: "var(--fs-lg)",
    fontWeight: 800,
    textAlign: "left",
    border: "none",
    boxShadow: "var(--shadow-sm)",
  };
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "var(--fs-sm)",
  fontWeight: 700,
  color: "var(--ink-2)",
  marginBottom: 8,
};

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
