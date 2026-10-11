"use client";

// ────────────────────────────────────────────────
// 家人看板：長輩按了「通知家人幫我看」的可疑訊息（最近 30 天）
// 只有暖暖的判斷和訊息大意（帳號、驗證碼已遮住），沒有截圖
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { SCAM_VERDICT_META, type ScamCheck } from "@/lib/scam-check";

type Elder = { elder_id: string; name: string; checks: ScamCheck[] };

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function FamilyScamChecks() {
  const [elders, setElders] = useState<Elder[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.familyScamChecks()
      .then((r) => setElders(r.elders))
      .catch(() => setElders([]));
  }, []);

  if (!elders || elders.length === 0) return null;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }} aria-label="長輩請你看的可疑訊息">
      <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>🛡️ 請你幫忙看的可疑訊息</div>
      {elders.map((e) =>
        e.checks.map((c) => {
          const meta = SCAM_VERDICT_META[c.verdict];
          const open = openId === c.id;
          return (
            <div key={c.id} className="card" style={{ padding: 14, borderLeft: `6px solid ${meta.color}` }}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : c.id)}
                aria-expanded={open}
                style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
              >
                <span style={{ fontSize: 28 }} aria-hidden="true">{meta.emoji}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 800 }}>{e.name}・{meta.label}</span>
                  <span style={{ display: "block", fontSize: "var(--fs-sm)" }}>{c.title}</span>
                  <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>{formatWhen(c.shared_at ?? c.created_at)}</span>
                </span>
                <span style={{ color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>{open ? "收起" : "看看"}</span>
              </button>
              {open && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
                  {c.excerpt && <div><strong>訊息大意：</strong>{c.excerpt}</div>}
                  {c.signals.length > 0 && (
                    <div>
                      <strong>疑點：</strong>
                      <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>{c.signals.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  <div style={{ padding: 10, borderRadius: "var(--r-md)", background: "var(--surface-warm)" }}>
                    打個電話給{e.name}，提醒先不要點連結、不要匯款、不要給驗證碼；不確定可以一起打 165 反詐騙專線問。
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
