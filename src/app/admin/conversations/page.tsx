"use client";

import { useEffect, useState } from "react";
import { api, type AdminConversationSession, type ConversationMessage } from "@/lib/api-client";

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<AdminConversationSession[]>([]);
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    api.adminListConversationSessions({ days })
      .then(({ sessions }) => setSessions(sessions))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.user_email ?? "").toLowerCase().includes(q) ||
      (s.user_name ?? "").toLowerCase().includes(q) ||
      s.preview.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          對話記錄
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 400, marginLeft: 12 }}>
            共 {sessions.length} 次對話
          </span>
        </h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{
            background: "#1e293b", color: "#fff", border: "1px solid #334155",
            padding: "8px 12px", borderRadius: 6, fontSize: 14,
          }}
        >
          <option value={1}>過去 1 天</option>
          <option value={7}>過去 7 天</option>
          <option value={30}>過去 30 天</option>
          <option value={90}>過去 90 天</option>
        </select>
      </div>

      <input
        type="text"
        placeholder="搜尋 email / 姓名 / 訊息內容…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", maxWidth: 400, marginBottom: 16, marginTop: 12,
          background: "#1e293b", color: "#fff", border: "1px solid #334155",
          padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none",
        }}
      />

      {loading && <div style={{ color: "#94a3b8", padding: 20 }}>載入中…</div>}

      {error && (
        <div style={{ background: "#7f1d1d", padding: 16, borderRadius: 8, color: "#fecaca", fontSize: 14 }}>
          錯誤：{error}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div style={{
          background: "#1e293b", borderRadius: 12, padding: 40,
          border: "1px solid #334155", textAlign: "center", color: "#94a3b8",
        }}>
          {search ? "沒有符合的對話" : "這段時間還沒有對話記錄"}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((s, i) => (
          <SessionCard
            key={s.session_id ?? `lonely-${i}`}
            session={s}
            open={openSessionId === s.session_id}
            onToggle={() =>
              setOpenSessionId(openSessionId === s.session_id ? null : s.session_id)
            }
          />
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session, open, onToggle }: {
  session: AdminConversationSession;
  open: boolean;
  onToggle: () => void;
}) {
  const [messages, setMessages] = useState<ConversationMessage[] | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!open || messages || !session.session_id) return;
    setLoadingMessages(true);
    api.adminGetConversationSession(session.session_id)
      .then(({ messages }) => setMessages(messages))
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [open, session.session_id, messages]);

  const durationSec = Math.max(
    0,
    Math.floor((new Date(session.latest_at).getTime() - new Date(session.started_at).getTime()) / 1000)
  );

  return (
    <div style={{
      background: "#1e293b", borderRadius: 12,
      border: "1px solid #334155", overflow: "hidden",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "14px 16px",
          background: "transparent", border: "none",
          textAlign: "left", cursor: "pointer",
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 14, alignItems: "center",
          color: "#e2e8f0",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {session.user_name ?? session.user_email ?? session.user_id.substring(0, 8)}
            </span>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              {session.user_email && session.user_name ? session.user_email : ""}
            </span>
          </div>
          <div style={{
            fontSize: 13, color: "#94a3b8", marginTop: 4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            「{session.preview || "（無用戶訊息）"}」
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#64748b" }}>
          <div>{new Date(session.latest_at).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ marginTop: 2 }}>
            💬 {session.user_message_count} · ⏱ {durationSec}s
          </div>
        </div>
        <span style={{ color: "#64748b", fontSize: 18 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #334155", padding: 16, background: "#0f172a" }}>
          {loadingMessages && (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>載入訊息中…</div>
          )}
          {messages && messages.length === 0 && (
            <div style={{ color: "#64748b", fontSize: 13 }}>沒有訊息</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {messages?.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{
        maxWidth: "80%",
        padding: "8px 12px",
        borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
        background: isUser ? "#1e40af" : "#334155",
        color: isUser ? "#dbeafe" : "#e2e8f0",
        fontSize: 13, lineHeight: 1.5,
      }}>
        <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>
          {isUser ? "👤 用戶" : "🧡 暖暖"} · {new Date(message.created_at).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
        {message.content}
      </div>
    </div>
  );
}
