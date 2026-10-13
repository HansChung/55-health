"use client";

// ────────────────────────────────────────────────
// 首頁：今天、明天有回診（或領慢箋藥）才出現，點一下到看診小幫手
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import {
  APPOINTMENT_KINDS,
  appointmentPlace,
  appointmentTimeLabel,
  relativeDayLabel,
  taipeiDate,
  type ClinicAppointment,
} from "@/lib/clinic-appointments";

export function UpcomingAppointmentCard({ onOpen }: { onOpen: () => void }) {
  const [next, setNext] = useState<ClinicAppointment | null>(null);

  useEffect(() => {
    let alive = true;
    api.listAppointments()
      .then((r) => {
        const first = r.appointments[0];
        if (alive && first && first.appt_date <= taipeiDate(new Date(), 1)) setNext(first);
      })
      .catch(() => { /* 沒跑 SQL、沒網路：不顯示 */ });
    return () => { alive = false; };
  }, []);

  if (!next) return null;
  const kind = APPOINTMENT_KINDS.find((k) => k.id === next.kind)!;
  return (
    <div style={{ padding: "20px 24px 0" }}>
      <button
        type="button"
        onClick={onOpen}
        className="card"
        style={{
          width: "100%", padding: 18, display: "flex", gap: 12, alignItems: "center", textAlign: "left", cursor: "pointer",
          background: "linear-gradient(135deg, #E4EFF7 0%, #FFFFFF 100%)", border: "1px solid #BCD3E4", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 40, flexShrink: 0 }} aria-hidden="true">{kind.emoji}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 800, fontSize: "var(--fs-lg)" }}>
            {relativeDayLabel(next.appt_date)}{next.appt_time ? ` ${appointmentTimeLabel(next.appt_time)}` : ""}要{kind.label}
          </span>
          <span style={{ display: "block", color: "var(--ink-2)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
            {appointmentPlace(next)}{next.note ? `・${next.note}` : ""}
            {next.kind === "visit" ? "　點這裡先整理要問醫生的話" : ""}
          </span>
        </span>
      </button>
    </div>
  );
}
