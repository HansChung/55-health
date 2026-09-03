"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type AdminChapterListItem, type AdminChapterDetail } from "@/lib/api-client";
import {
  EDITABLE_TEXT_FIELDS,
  FIELD_LABELS,
  MULTILINE_FIELDS,
  youtubeEmbedUrl,
  type ChapterOverrides,
} from "@/lib/chapter-content";

type Entry = NonNullable<ChapterOverrides["entries"]>[number];

const card = { background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 18 } as const;
const input = {
  background: "#0f172a", color: "#fff", border: "1px solid #334155",
  padding: "8px 10px", borderRadius: 6, fontSize: 14, width: "100%", fontFamily: "inherit",
} as const;
const label = { fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" } as const;
const btn = (bg: string, color = "#fff") =>
  ({ background: bg, color, border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }) as const;

export default function ChaptersAdminPage() {
  const [list, setList] = useState<AdminChapterListItem[]>([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminChapterDetail | null>(null);
  const [form, setForm] = useState<ChapterOverrides>({});
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const reloadList = () => api.adminListChapters().then((d) => setList(d.chapters)).catch(console.error);
  useEffect(() => { reloadList(); }, []);

  const open = async (id: string) => {
    setSelectedId(id);
    setMsg("");
    try {
      const d = await api.adminGetChapter(id);
      setDetail(d);
      setForm(d.overrides ?? {});
    } catch (e) {
      setMsg("載入失敗：" + (e as Error).message);
    }
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await api.adminSaveChapter(selectedId, form);
      setForm(r.overrides ?? {});
      setMsg("✓ 已儲存，章節頁面立即生效");
      reloadList();
    } catch (e) {
      setMsg("儲存失敗：" + (e as Error).message);
    }
    setSaving(false);
  };

  const reset = async () => {
    if (!selectedId || !confirm("還原成程式預設內容？後台的修改會被清除。")) return;
    try {
      await api.adminResetChapter(selectedId);
      setForm({});
      setMsg("✓ 已還原預設");
      reloadList();
    } catch (e) {
      setMsg("還原失敗：" + (e as Error).message);
    }
  };

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return list;
    return list.filter((c) => c.id.includes(k) || c.title.toLowerCase().includes(k));
  }, [list, q]);

  const set = (key: keyof ChapterOverrides, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const entries: Entry[] = form.entries ?? [];
  const setEntry = (i: number, patch: Partial<Entry>) =>
    set("entries", entries.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const embed = youtubeEmbedUrl(form.videoUrl);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>書本練習內容</h1>
      <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
        修改章節文字、加入圖片與 YouTube 影片。欄位<b style={{ color: "#e2e8f0" }}>留空＝使用程式預設</b>（灰字顯示預設內容）。儲存後不用重新部署，立即生效。
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>
        {/* 章節清單 */}
        <div style={card}>
          <input style={input} placeholder="搜尋編號或標題…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ marginTop: 10, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => open(c.id)}
                style={{
                  textAlign: "left", background: selectedId === c.id ? "#334155" : "#0f172a",
                  border: "1px solid " + (selectedId === c.id ? "#38bdf8" : "#1e293b"),
                  borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: "#e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <span style={{ color: "#64748b", fontFamily: "monospace" }}>{c.id}</span>
                  <span>{c.emoji}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                  {c.overridden && <span style={{ fontSize: 10, background: "#38bdf8", color: "#0f172a", padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>已修改</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 編輯區 */}
        <div style={card}>
          {!detail ? (
            <div style={{ color: "#64748b", padding: 40, textAlign: "center" }}>← 從左邊選一個章節開始編輯</div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, flex: 1 }}>
                  <span style={{ color: "#64748b", fontFamily: "monospace", marginRight: 8 }}>{detail.id}</span>{detail.title}
                </h2>
                <a href={`/smart/chapter/${detail.id}`} target="_blank" rel="noreferrer" style={{ ...btn("#334155"), textDecoration: "none" }}>預覽章節 ↗</a>
              </div>

              {/* 圖片 / 影片 */}
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 14, marginBottom: 16, border: "1px solid #334155" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", marginBottom: 10 }}>🖼️ 圖片與影片</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={label}>章首圖片網址（jpg/png，建議 1200px 寬）</label>
                    <input style={input} value={form.heroImageUrl ?? ""} onChange={(e) => set("heroImageUrl", e.target.value)} placeholder="https://…/image.jpg" />
                    {form.heroImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.heroImageUrl} alt="" style={{ marginTop: 8, width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 6 }} />
                    )}
                  </div>
                  <div>
                    <label style={label}>YouTube 影片網址（畫面內嵌播放）</label>
                    <input style={input} value={form.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
                    {form.videoUrl && !embed && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>只支援 YouTube 網址</div>}
                    {embed && (
                      <div style={{ marginTop: 8, position: "relative", paddingTop: "56.25%", borderRadius: 6, overflow: "hidden" }}>
                        <iframe src={embed} title="預覽" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 文字欄位 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {EDITABLE_TEXT_FIELDS.map((f) => {
                  const multi = MULTILINE_FIELDS.has(f);
                  const def = (detail.defaults[f] as string | undefined) ?? "";
                  const common = {
                    style: { ...input, ...(multi ? { minHeight: 76, resize: "vertical" as const } : {}) },
                    value: (form[f] as string | undefined) ?? "",
                    placeholder: def || "（預設為空）",
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(f, e.target.value),
                  };
                  return (
                    <div key={f} style={{ gridColumn: multi ? "1 / -1" : "auto" }}>
                      <label style={label}>{FIELD_LABELS[f]}</label>
                      {multi ? <textarea {...common} /> : <input {...common} />}
                    </div>
                  );
                })}

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={label}>章首導讀段落（一行一段）</label>
                  <textarea
                    style={{ ...input, minHeight: 120, resize: "vertical" }}
                    value={(form.guideParagraphs ?? []).join("\n")}
                    placeholder={(detail.defaults.guideParagraphs ?? []).join("\n")}
                    onChange={(e) => set("guideParagraphs", e.target.value.split("\n"))}
                  />
                </div>
              </div>

              {/* 路線卡 entries */}
              <div style={{ marginTop: 16, background: "#0f172a", borderRadius: 8, padding: 14, border: "1px solid #334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", flex: 1 }}>🗂️ 路線卡（沒有自訂就用預設 {detail.defaults.entries?.length ?? 0} 筆）</div>
                  {entries.length === 0 && (
                    <button style={btn("#334155")} onClick={() => set("entries", detail.defaults.entries ?? [])}>從預設帶入</button>
                  )}
                  <button style={btn("#334155")} onClick={() => set("entries", [...entries, { id: `e${entries.length + 1}`, label: "", hint: "", emoji: "" }])}>＋ 新增</button>
                </div>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1.4fr 1fr 32px", gap: 6, marginBottom: 6 }}>
                    <input style={input} placeholder="表情" value={e.emoji ?? ""} onChange={(ev) => setEntry(i, { emoji: ev.target.value })} />
                    <input style={input} placeholder="標籤" value={e.label} onChange={(ev) => setEntry(i, { label: ev.target.value })} />
                    <input style={input} placeholder="提示" value={e.hint ?? ""} onChange={(ev) => setEntry(i, { hint: ev.target.value })} />
                    <input style={input} placeholder="連結 /smart/chapter/…" value={e.href ?? ""} onChange={(ev) => setEntry(i, { href: ev.target.value || undefined })} />
                    <button style={btn("transparent", "#f87171")} onClick={() => set("entries", entries.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>

              {/* 動作列 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
                <button style={btn("#38bdf8", "#0f172a")} onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</button>
                <button style={btn("transparent", "#f87171")} onClick={reset}>還原預設</button>
                {detail.updated_at && <span style={{ fontSize: 12, color: "#64748b" }}>上次修改 {new Date(detail.updated_at).toLocaleString("zh-TW")}</span>}
                {msg && <span style={{ fontSize: 14, color: msg.startsWith("✓") ? "#4ade80" : "#f87171" }}>{msg}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
