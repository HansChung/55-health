"use client";

// ────────────────────────────────────────────────
// 家人看板：長輩的故事集（長輩有勾「給家人看」的篇），可以按讚、留言（長輩會收到通知）
// ────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { VideoComments } from "@/components/video-comments";
import type { LifeStory } from "@/lib/life-stories";

type Elder = { elder_id: string; name: string; stories: LifeStory[] };

export function FamilyStories() {
  const [elders, setElders] = useState<Elder[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.familyStories()
      .then((r) => setElders(r.elders))
      .catch(() => setElders([]));
  }, []);

  if (!elders || elders.length === 0) return null;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }} aria-label="長輩的故事">
      <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>📖 長輩的故事</div>
      {elders.map((e) =>
        e.stories.map((s) => {
          const open = openId === s.id;
          return (
            <div key={s.id} className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : s.id)}
                aria-expanded={open}
                style={{ display: "flex", gap: 12, alignItems: "center", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", width: "100%" }}
              >
                {s.photos[0] ? (
                  <img src={s.photos[0].url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                ) : (
                  <span style={{ fontSize: 28 }} aria-hidden="true">📖</span>
                )}
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontWeight: 800, color: "var(--ink-1)" }}>{e.name}・{s.title}</span>
                  <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
                    {s.era ? `${s.era}・` : ""}{new Date(s.created_at).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}
                  </span>
                </span>
                <span style={{ color: "var(--ink-3)" }}>{open ? "收起" : "閱讀"}</span>
              </button>
              {open && (
                <>
                  {s.photos.map((p, i) => (
                    <img key={i} src={p.url} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: "var(--r-md)", background: "var(--bg-deep)" }} />
                  ))}
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.85 }}>{s.body}</div>
                </>
              )}
              <VideoComments kind="story" videoId={s.id} initial={s.comments} viewer="family" />
            </div>
          );
        })
      )}
    </section>
  );
}
