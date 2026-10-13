"use client";

// ────────────────────────────────────────────────
// 看診小幫手裡的「回診提醒」：記下回診（或領慢箋藥）的日子，前一天晚上 8 點、當天早上 7 點推播提醒
// 「也告訴家人」：家人也收到提醒，家人狀況看得到下一次回診
// 伺服器還沒跑 SQL（503）就整塊不顯示
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { enableWebPush, hasWebPushSubscription, isWebPushSupported } from "@/lib/push/client";
import {
  APPOINTMENT_DEPARTMENT_MAX,
  APPOINTMENT_HOSPITAL_MAX,
  APPOINTMENT_KINDS,
  APPOINTMENT_NOTE_MAX,
  REMIND_DAY_BEFORE_HOUR,
  REMIND_SAME_DAY_HOUR,
  appointmentPlace,
  appointmentTimeLabel,
  relativeDayLabel,
  sortAppointments,
  taipeiDate,
  type AppointmentInput,
  type AppointmentKind,
  type ClinicAppointment,
} from "@/lib/clinic-appointments";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "var(--fs-base)", minHeight: 52,
  fontFamily: "inherit", color: "var(--ink-1)", background: "var(--surface)",
  border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
};
const label: React.CSSProperties = { fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "14px 0 6px", display: "block" };

function chip(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: "8px 14px", minHeight: 52, borderRadius: 999, cursor: "pointer",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `2px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-1)",
  };
}

interface Draft {
  id: string | null;
  kind: AppointmentKind;
  date: string;
  time: string;
  hospital: string;
  department: string;
  note: string;
  notifyFamily: boolean;
}

function emptyDraft(prefill?: { department?: string | null; hospital?: string | null }): Draft {
  return {
    id: null, kind: "visit", date: "", time: "", hospital: prefill?.hospital ?? "", department: prefill?.department ?? "",
    note: "", notifyFamily: true,
  };
}

/** 要提醒就試著打開這台裝置的推播；不允許也照樣存（家人那邊還是收得到） */
async function tryEnablePush(): Promise<boolean> {
  try {
    if (!isWebPushSupported() || Notification.permission === "denied") return false;
    if (!(await hasWebPushSubscription())) await enableWebPush();
    return true;
  } catch (e) {
    console.warn("[appointments] push not enabled:", e);
    return false;
  }
}

export function ClinicAppointments({
  prefill,
  onPrefillUsed,
}: {
  /** 從看診紀錄按「設定下次回診」帶過來的科別 */
  prefill?: { department?: string | null } | null;
  onPrefillUsed?: () => void;
}) {
  const toast = useToast();
  const [list, setList] = useState<ClinicAppointment[] | null>(null);
  const [hidden, setHidden] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.listAppointments()
      .then((r) => { if (alive) setList(r.appointments); })
      .catch(() => { if (alive) setHidden(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!prefill) return;
    setDraft(emptyDraft({ department: prefill.department, hospital: list?.[0]?.hospital ?? "" }));
    onPrefillUsed?.();
  }, [prefill, onPrefillUsed, list]);

  if (hidden) return null;

  const hospitals = [...new Set((list ?? []).map((a) => a.hospital).filter((h): h is string => Boolean(h)))];

  const edit = (a: ClinicAppointment) =>
    setDraft({
      id: a.id, kind: a.kind, date: a.appt_date, time: a.appt_time ?? "", hospital: a.hospital ?? "",
      department: a.department ?? "", note: a.note ?? "", notifyFamily: a.notify_family,
    });

  const save = async () => {
    if (!draft || busy) return;
    if (!draft.date) {
      toast.info("請選日期");
      return;
    }
    setBusy(true);
    const input: AppointmentInput = {
      kind: draft.kind, date: draft.date, time: draft.time || null, hospital: draft.hospital,
      department: draft.department, note: draft.note, notifyFamily: draft.notifyFamily,
    };
    try {
      const pushOk = await tryEnablePush();
      const res = draft.id ? await api.updateAppointment(draft.id, input) : await api.createAppointment(input);
      setList((l) => sortAppointments([res.appointment, ...(l ?? []).filter((a) => a.id !== res.appointment.id)]));
      if (!draft.id) trackEvent("clinic_appointment", { kind: draft.kind, family: draft.notifyFamily, time: Boolean(draft.time) });
      setDraft(null);
      toast.success(
        pushOk
          ? `記好了！前一天晚上 ${REMIND_DAY_BEFORE_HOUR - 12} 點、當天早上 ${REMIND_SAME_DAY_HOUR} 點提醒你`
          : `記好了！這支手機沒開通知，收不到提醒${draft.notifyFamily ? "（家人還是會收到）" : ""}`
      );
    } catch (e) {
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "沒存成功，請再試一次");
    }
    setBusy(false);
  };

  const remove = async (a: ClinicAppointment) => {
    if (busy || !confirm(`刪掉 ${relativeDayLabel(a.appt_date)} 的${a.kind === "refill" ? "領藥" : "回診"}提醒？`)) return;
    setBusy(true);
    try {
      await api.deleteAppointment(a.id);
      setList((l) => (l ?? []).filter((x) => x.id !== a.id));
      if (draft?.id === a.id) setDraft(null);
    } catch (e) {
      toast.error(e instanceof ApiError && !e.isNetwork ? e.message : "刪除沒成功，請再試一次");
    }
    setBusy(false);
  };

  return (
    <section id="clinic-appointments" aria-label="回診提醒" style={{ marginTop: 20, scrollMarginTop: 80 }}>
      <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)" }}>📅 回診提醒</div>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: "4px 0 12px", lineHeight: 1.5 }}>
        記下回診、領慢箋藥的日子，前一天晚上 {REMIND_DAY_BEFORE_HOUR - 12} 點和當天早上 {REMIND_SAME_DAY_HOUR} 點提醒你
      </div>

      {list === null ? (
        <div style={{ color: "var(--ink-2)", textAlign: "center", padding: 12 }}>載入中…</div>
      ) : (
        list.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            {list.map((a) => {
              const kind = APPOINTMENT_KINDS.find((k) => k.id === a.kind)!;
              const soon = a.appt_date <= taipeiDate(new Date(), 1);
              return (
                <div key={a.id} className="card" style={{
                  padding: 14, display: "flex", gap: 12, alignItems: "center",
                  border: `1px solid ${soon ? "var(--primary)" : "var(--line)"}`, background: soon ? "var(--primary-soft)" : undefined,
                }}>
                  <span style={{ fontSize: 30 }} aria-hidden="true">{kind.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>
                      {relativeDayLabel(a.appt_date)}{a.appt_time ? ` ${appointmentTimeLabel(a.appt_time)}` : ""}
                    </div>
                    <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
                      {a.kind === "refill" && (a.hospital || a.department) ? "領慢箋藥・" : ""}{appointmentPlace(a)}
                      {a.note ? `・${a.note}` : ""}
                      {a.notify_family ? "・家人也會收到" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button type="button" onClick={() => edit(a)} disabled={busy} className="btn-ghost" style={{ minHeight: 44, padding: "4px 12px" }} aria-label="修改">✏️ 改</button>
                    <button type="button" onClick={() => remove(a)} disabled={busy} className="btn-ghost" style={{ minHeight: 44, padding: "4px 12px" }} aria-label="刪掉">🗑️ 刪</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {draft ? (
        <div className="card" style={{ padding: 16, border: "2px solid var(--primary-soft)" }}>
          <div style={{ fontWeight: 800 }}>{draft.id ? "修改提醒" : "記下回診的日子"}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }} role="radiogroup" aria-label="種類">
            {APPOINTMENT_KINDS.map((k) => (
              <button key={k.id} type="button" role="radio" aria-checked={draft.kind === k.id} style={chip(draft.kind === k.id)} onClick={() => setDraft({ ...draft, kind: k.id })}>
                {k.emoji} {k.label}
              </button>
            ))}
          </div>
          {draft.kind === "refill" && (
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 8, lineHeight: 1.5 }}>
              慢性處方箋第 2、3 次領藥，可以在上次的藥吃完前 10 天內去領
            </div>
          )}
          <label style={label}>
            哪一天
            <input type="date" value={draft.date} min={taipeiDate()} onChange={(e) => setDraft({ ...draft, date: e.target.value })} style={{ ...inputStyle, marginTop: 6 }} />
          </label>
          <label style={label}>
            幾點（不知道可以不填）
            <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} style={{ ...inputStyle, marginTop: 6 }} />
          </label>
          <label style={label}>
            醫院、診所
            <input
              value={draft.hospital}
              list="appointment-hospitals"
              onChange={(e) => setDraft({ ...draft, hospital: [...e.target.value].slice(0, APPOINTMENT_HOSPITAL_MAX).join("") })}
              placeholder="例如：台大醫院"
              style={{ ...inputStyle, marginTop: 6 }}
            />
            <datalist id="appointment-hospitals">{hospitals.map((h) => <option key={h} value={h} />)}</datalist>
          </label>
          <label style={label}>
            科別
            <input
              value={draft.department}
              onChange={(e) => setDraft({ ...draft, department: [...e.target.value].slice(0, APPOINTMENT_DEPARTMENT_MAX).join("") })}
              placeholder="例如：心臟科"
              style={{ ...inputStyle, marginTop: 6 }}
            />
          </label>
          <label style={label}>
            要記得的事（可以不填）
            <input
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: [...e.target.value].slice(0, APPOINTMENT_NOTE_MAX).join("") })}
              placeholder="例如：要空腹抽血、帶上次的報告"
              style={{ ...inputStyle, marginTop: 6 }}
            />
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, fontWeight: 700, minHeight: 44, cursor: "pointer" }}>
            <input type="checkbox" checked={draft.notifyFamily} onChange={(e) => setDraft({ ...draft, notifyFamily: e.target.checked })} style={{ width: 26, height: 26 }} />
            也提醒家人（家人可以陪你去）
          </label>
          <button type="button" className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={save} disabled={busy || !draft.date}>
            {busy ? "存檔中…" : "💾 記下來"}
          </button>
          <button type="button" className="btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setDraft(null)} disabled={busy}>取消</button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-ghost"
          style={{ width: "100%", minHeight: 60 }}
          onClick={() => setDraft(emptyDraft({ hospital: hospitals[0] ?? "" }))}
          disabled={list === null}
        >
          ➕ 記下回診、領藥的日子
        </button>
      )}
    </section>
  );
}
