"use client";

// ────────────────────────────────────────────────
// 首頁：3 天內有家人、朋友生日才出現，點一下到「家人生日」
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { birthdayHeadline, homeBirthdays, type Birthday } from "@/lib/birthdays";
import { appointmentDayLabel } from "@/lib/clinic-appointments";

export function UpcomingBirthdayCard({ onOpen }: { onOpen: () => void }) {
  const [soon, setSoon] = useState<Birthday[]>([]);

  useEffect(() => {
    let alive = true;
    api.listBirthdays({ retries: 0 })
      .then((r) => { if (alive) setSoon(homeBirthdays(r.birthdays)); })
      .catch(() => { /* 沒跑 SQL、沒網路：不顯示 */ });
    return () => { alive = false; };
  }, []);

  const first = soon[0];
  if (!first?.next) return null;
  const today = first.next.days <= 0;
  const others = soon.length - 1;
  return (
    <div style={{ padding: "20px 24px 0" }}>
      <button
        type="button"
        onClick={onOpen}
        className="card"
        style={{
          width: "100%", padding: 18, display: "flex", gap: 12, alignItems: "center", textAlign: "left", cursor: "pointer",
          background: "linear-gradient(135deg, #FFF1DC 0%, #FFFFFF 100%)", border: "1px solid #F0CF9B", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 40, flexShrink: 0 }} aria-hidden="true">🎂</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 800, fontSize: "var(--fs-lg)", lineHeight: 1.35, overflowWrap: "anywhere" }}>
            {birthdayHeadline(first, first.next.days)}
          </span>
          <span style={{ display: "block", color: "var(--ink-2)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
            {today ? "打個電話說聲生日快樂" : `${appointmentDayLabel(first.next.date)}，可以先準備紅包、禮物`}
            {others > 0 ? `　還有 ${others} 位也快生日了` : ""}
          </span>
        </span>
      </button>
    </div>
  );
}
