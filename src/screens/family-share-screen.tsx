"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { SubPage } from "@/components/sub-page";
import { Toggle } from "@/components/toggle";
import { api, type FamilyLink, type FamilyPermissions } from "@/lib/api-client";

interface FamilyShareScreenProps {
  onBack: () => void;
}

const AVATAR_COLORS = ["#7AA779", "#E8845A", "#D9A441", "#C95B6E", "#5BA0C9"];

export function FamilyShareScreen({ onBack }: FamilyShareScreenProps) {
  const [family, setFamily] = useState<FamilyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [lastInvite, setLastInvite] = useState<FamilyLink | null>(null);

  const reload = async () => {
    try {
      const { family } = await api.listFamily();
      setFamily(family);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const handleInviteCreated = (link: FamilyLink) => {
    setLastInvite(link);
    setShowInvite(false);
    reload();
  };

  const togglePermission = async (link: FamilyLink, key: keyof FamilyPermissions, value: boolean) => {
    const newPerms = { ...link.permissions, [key]: value };
    setFamily((arr) => arr.map((l) => l.id === link.id ? { ...l, permissions: newPerms } : l));
    try {
      await api.updateFamily(link.id, { permissions: newPerms });
    } catch (e) {
      alert("更新失敗：" + (e as Error).message);
      reload();
    }
  };

  const removeFamily = async (link: FamilyLink) => {
    if (!confirm(`確定要移除「${link.family_name}」？`)) return;
    try {
      await api.removeFamily(link.id);
      reload();
    } catch (e) {
      alert("移除失敗：" + (e as Error).message);
    }
  };

  return (
    <SubPage
      title="家人共享"
      onBack={onBack}
      accent="linear-gradient(180deg, #DCEBD8 0%, transparent 100%)"
      footer={
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => setShowInvite(true)}>
          <Icon name="plus" size={26} color="#fff" stroke={2.8} />
          邀請家人
        </button>
      }
    >
      <div style={{
        background: "var(--sage-soft)", borderRadius: "var(--r-lg)",
        padding: 18, marginBottom: 22,
        display: "flex", gap: 14, alignItems: "flex-start",
        border: "1px solid #B5D2B0",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--sage)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="heart" size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "#4F7A4E", marginBottom: 4 }}>
            為什麼讓家人看到？
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-1)", lineHeight: 1.5 }}>
            家人可以幫您留意飲食和健康。如果發現異常（例如連續沒吃飯），會立刻通知他們。
          </div>
        </div>
      </div>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 12 }}>
        已連結的家人
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--ink-2)" }}>載入中…</div>
      ) : family.length === 0 ? (
        <div style={{
          background: "var(--surface)", borderRadius: "var(--r-lg)",
          padding: 30, textAlign: "center", marginBottom: 28,
          border: "1px dashed var(--line-strong)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>👨‍👩‍👧</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
            還沒有連結的家人<br />
            點下方「邀請家人」開始分享
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {family.map((f, idx) => (
            <FamilyCard
              key={f.id}
              link={f}
              colorIdx={idx}
              onTogglePermission={togglePermission}
              onRemove={removeFamily}
            />
          ))}
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onCreated={handleInviteCreated}
        />
      )}

      {lastInvite && (
        <InviteCodeModal
          link={lastInvite}
          onClose={() => setLastInvite(null)}
        />
      )}
    </SubPage>
  );
}

function FamilyCard({ link, colorIdx, onTogglePermission, onRemove }: {
  link: FamilyLink;
  colorIdx: number;
  onTogglePermission: (link: FamilyLink, key: keyof FamilyPermissions, v: boolean) => void;
  onRemove: (link: FamilyLink) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
  const initial = link.family_name.charAt(0);

  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--r-lg)",
      padding: 16, border: "1px solid var(--line)",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: color + "33",
          color, fontSize: 26, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `2px solid ${color}`,
          flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{link.family_name}</span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>{link.relationship}</span>
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
            {link.status === "accepted" ? (
              <><span style={{ color: "var(--sage)" }}>● </span>已連結</>
            ) : link.status === "pending" ? (
              <><span style={{ color: "var(--gold)" }}>● </span>已邀請（等候中）</>
            ) : (
              <><span style={{ color: "var(--ink-3)" }}>● </span>已停用</>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ padding: 8 }}>
          <Icon name="settings" size={22} color="var(--ink-3)" />
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 8 }}>
            可以看到的內容
          </div>
          <PermissionRow
            label="今日卡路里" icon="flame"
            on={link.permissions.calories ?? true}
            onChange={(v) => onTogglePermission(link, "calories", v)}
          />
          <PermissionRow
            label="健康警示" icon="heart"
            on={link.permissions.alerts ?? true}
            onChange={(v) => onTogglePermission(link, "alerts", v)}
          />
          <PermissionRow
            label="飲食日記" icon="calendar"
            on={link.permissions.diary ?? true}
            onChange={(v) => onTogglePermission(link, "diary", v)}
          />
          <PermissionRow
            label="AI 對話內容" icon="mic"
            on={link.permissions.voice ?? false}
            onChange={(v) => onTogglePermission(link, "voice", v)}
          />
          {link.invite_code && link.status === "pending" && (
            <div style={{
              marginTop: 12, padding: 12,
              background: "var(--surface-warm)",
              borderRadius: 10, fontSize: "var(--fs-sm)",
            }}>
              邀請碼：<strong style={{ color: "var(--primary-deep)", letterSpacing: 2 }}>{link.invite_code}</strong>
            </div>
          )}
          <button
            onClick={() => onRemove(link)}
            style={{
              marginTop: 12, width: "100%", padding: 10,
              background: "transparent", color: "var(--berry)",
              border: "1px solid var(--berry-soft)", borderRadius: 10,
              fontSize: "var(--fs-sm)", fontWeight: 600,
            }}
          >
            移除這位家人
          </button>
        </div>
      )}
    </div>
  );
}

function PermissionRow({ label, icon, on, onChange }: {
  label: string; icon: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      padding: "10px 0",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <Icon name={icon} size={20} color="var(--ink-2)" />
      <span style={{ flex: 1, fontSize: "var(--fs-sm)" }}>{label}</span>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function InviteModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (link: FamilyLink) => void;
}) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [perm, setPerm] = useState<FamilyPermissions>({
    calories: true, alerts: true, diary: true, voice: false,
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !relationship.trim()) return;
    setSaving(true);
    try {
      const { link } = await api.inviteFamily({
        family_name: name.trim(),
        relationship: relationship.trim(),
        permissions: perm,
      });
      onCreated(link);
    } catch (e) {
      alert("建立邀請失敗：" + (e as Error).message);
    }
    setSaving(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 100,
        background: "rgba(45, 28, 14, 0.5)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", background: "var(--bg)",
          borderRadius: "28px 28px 0 0",
          padding: "12px 24px 32px",
          maxHeight: "85%", overflowY: "auto",
          animation: "slide-up 0.3s ease both",
        }}
      >
        <div style={{
          width: 48, height: 5, borderRadius: 3,
          background: "var(--line-strong)", margin: "6px auto 18px",
        }} />
        <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: "0 0 8px" }}>
          邀請家人
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "0 0 20px" }}>
          填寫家人資料，產生邀請碼
        </p>

        <Field label="家人的稱呼">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：王志明"
            style={inputStyle}
          />
        </Field>
        <Field label="關係">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["兒子", "女兒", "孫子", "孫女", "配偶", "其他"].map((r) => (
              <button
                key={r}
                onClick={() => setRelationship(r)}
                style={{
                  padding: "8px 14px", borderRadius: 999,
                  background: relationship === r ? "var(--primary)" : "var(--surface)",
                  color: relationship === r ? "#fff" : "var(--ink-1)",
                  border: relationship === r ? "none" : "1px solid var(--line-strong)",
                  fontSize: "var(--fs-sm)", fontWeight: 600,
                }}
              >{r}</button>
            ))}
          </div>
        </Field>
        <Field label="家人可以看到">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <PermissionRow label="今日卡路里" icon="flame" on={perm.calories ?? true}
              onChange={(v) => setPerm({ ...perm, calories: v })} />
            <PermissionRow label="健康警示" icon="heart" on={perm.alerts ?? true}
              onChange={(v) => setPerm({ ...perm, alerts: v })} />
            <PermissionRow label="飲食日記" icon="calendar" on={perm.diary ?? true}
              onChange={(v) => setPerm({ ...perm, diary: v })} />
            <PermissionRow label="AI 對話內容" icon="mic" on={perm.voice ?? false}
              onChange={(v) => setPerm({ ...perm, voice: v })} />
          </div>
        </Field>

        <button
          className="btn-primary"
          style={{ width: "100%", opacity: saving || !name || !relationship ? 0.5 : 1 }}
          disabled={saving || !name || !relationship}
          onClick={submit}
        >
          {saving ? "建立中…" : "產生邀請碼"}
        </button>
      </div>
    </div>
  );
}

function InviteCodeModal({ link, onClose }: { link: FamilyLink; onClose: () => void }) {
  const copyCode = () => {
    if (link.invite_code && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(link.invite_code);
      alert("已複製：" + link.invite_code);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 100,
        background: "rgba(45, 28, 14, 0.5)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", background: "var(--bg)",
          borderRadius: "28px 28px 0 0",
          padding: "12px 24px 32px",
          animation: "slide-up 0.3s ease both",
        }}
      >
        <div style={{
          width: 48, height: 5, borderRadius: 3,
          background: "var(--line-strong)", margin: "6px auto 18px",
        }} />
        <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: "0 0 8px" }}>
          邀請已建立
        </h2>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "0 0 24px" }}>
          請家人下載「暖暖」App 並輸入邀請碼
        </p>

        <div style={{
          background: "linear-gradient(135deg, #FFF9EF 0%, #FBE6D4 100%)",
          borderRadius: "var(--r-lg)", padding: 24,
          textAlign: "center", border: "1px solid var(--gold-soft)",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 8 }}>
            {link.family_name} 的邀請碼
          </div>
          <div style={{
            fontSize: "var(--fs-3xl)", fontWeight: 800,
            color: "var(--primary-deep)", letterSpacing: "8px",
            fontFamily: "ui-monospace, monospace",
          }}>{link.invite_code}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 8 }}>
            24 小時內有效
          </div>
        </div>

        <button className="btn-primary" style={{ width: "100%" }} onClick={copyCode}>
          複製邀請碼
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px",
  background: "var(--surface)", border: "2px solid var(--line-strong)",
  borderRadius: 12, fontSize: "var(--fs-base)",
  outline: "none", fontFamily: "inherit",
};
