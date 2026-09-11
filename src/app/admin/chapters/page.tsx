"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type AdminChapterListItem, type AdminChapterDetail } from "@/lib/api-client";
import {
  BLOCK_TYPE_LABELS,
  CUSTOM_CHAPTER_ID_RE,
  EDITABLE_TEXT_FIELDS,
  FIELD_LABELS,
  MULTILINE_FIELDS,
  youtubeEmbedUrl,
  type ChapterBlock,
  type ChapterBlockType,
  type ChapterOverrides,
} from "@/lib/chapter-content";

type Entry = NonNullable<ChapterOverrides["entries"]>[number];

const card = { background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 18 } as const;
const panel = { background: "#0f172a", borderRadius: 8, padding: 14, border: "1px solid #334155" } as const;
const input = {
  background: "#0f172a", color: "#fff", border: "1px solid #334155",
  padding: "8px 10px", borderRadius: 6, fontSize: 14, width: "100%", fontFamily: "inherit",
  boxSizing: "border-box",
} as const;
const area = { ...input, minHeight: 76, resize: "vertical" } as const;
const label = { fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" } as const;
const panelTitle = { fontSize: 13, fontWeight: 700, color: "#38bdf8" } as const;
const btn = (bg: string, color = "#fff") =>
  ({ background: bg, color, border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }) as const;
const smallBtn = { ...btn("#334155"), padding: "6px 10px", fontSize: 13 } as const;
const badge = (bg: string, color = "#0f172a") =>
  ({ fontSize: 10, background: bg, color, padding: "1px 6px", borderRadius: 6, fontWeight: 700, whiteSpace: "nowrap" }) as const;

const newId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function emptyBlock(type: ChapterBlockType): ChapterBlock {
  const id = newId();
  switch (type) {
    case "text": return { id, type, title: "", body: "" };
    case "image": return { id, type, url: "", caption: "" };
    case "video": return { id, type, url: "", caption: "" };
    case "example": return { id, type, title: "", prompt: "", note: "" };
    case "link": return { id, type, label: "", url: "" };
  }
}

export default function ChaptersAdminPage() {
  const [list, setList] = useState<AdminChapterListItem[]>([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminChapterDetail | null>(null);
  const [form, setForm] = useState<ChapterOverrides>({});
  const [published, setPublished] = useState(true);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  const reloadList = () => api.adminListChapters().then((d) => setList(d.chapters)).catch(console.error);
  useEffect(() => { reloadList(); }, []);

  const open = async (id: string) => {
    setSelectedId(id);
    setMsg("");
    try {
      const d = await api.adminGetChapter(id);
      setDetail(d);
      setForm(d.overrides ?? {});
      setPublished(d.published);
    } catch (e) {
      setMsg("載入失敗：" + (e as Error).message);
    }
  };

  const save = async () => {
    if (!selectedId || !detail) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await api.adminSaveChapter(selectedId, form, detail.custom ? published : undefined);
      setForm(r.overrides ?? {});
      setPublished(r.published);
      setDetail({ ...detail, updated_at: r.updated_at, published: r.published });
      setMsg(detail.custom && !r.published ? "✓ 已儲存（草稿，書本目錄還看不到）" : "✓ 已儲存，章節頁面立即生效");
      reloadList();
    } catch (e) {
      setMsg("儲存失敗：" + (e as Error).message);
    }
    setSaving(false);
  };

  const reset = async () => {
    if (!selectedId || !detail) return;
    const question = detail.custom
      ? `確定刪除章節 ${selectedId}「${detail.title}」？整章內容會被刪除，無法復原。`
      : "還原成程式預設內容？後台的修改（含新增的內容區塊）會被清除。";
    if (!confirm(question)) return;
    try {
      await api.adminResetChapter(selectedId);
      if (detail.custom) {
        setDetail(null);
        setSelectedId(null);
        setForm({});
        setMsg("");
      } else {
        setForm({});
        setMsg("✓ 已還原預設");
      }
      reloadList();
    } catch (e) {
      setMsg("操作失敗：" + (e as Error).message);
    }
  };

  const createChapter = async () => {
    setCreateMsg("");
    const code = newCode.trim();
    if (!CUSTOM_CHAPTER_ID_RE.test(code)) {
      setCreateMsg("QR 碼需為四碼，前兩碼 01–12（例如 0215 放在第二章）");
      return;
    }
    if (!newTitle.trim()) { setCreateMsg("請填標題"); return; }
    try {
      await api.adminCreateChapter({ id: code, title: newTitle.trim() });
      setCreating(false);
      setNewCode("");
      setNewTitle("");
      await reloadList();
      open(code);
    } catch (e) {
      setCreateMsg((e as Error).message);
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

  const blocks: ChapterBlock[] = form.blocks ?? [];
  const setBlock = (i: number, patch: Partial<ChapterBlock>) =>
    set("blocks", blocks.map((b, j) => (j === i ? ({ ...b, ...patch } as ChapterBlock) : b)));
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    set("blocks", next);
  };

  const embed = youtubeEmbedUrl(form.videoUrl);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>書本練習內容</h1>
      <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>
        編輯章節文字、<b style={{ color: "#e2e8f0" }}>新增內容區塊</b>（文字／圖片／YouTube 影片／練習範例／連結），或<b style={{ color: "#e2e8f0" }}>新增整個章節</b>。
        欄位留空＝使用預設（灰字）。儲存後不用重新部署，立即生效。
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>
        {/* 章節清單 */}
        <div style={card}>
          <button style={{ ...btn("#38bdf8", "#0f172a"), width: "100%", marginBottom: 10 }} onClick={() => setCreating((v) => !v)}>
            ＋ 新增章節
          </button>
          {creating && (
            <div style={{ ...panel, marginBottom: 10 }}>
              <label style={label}>QR 碼（四碼；前兩碼＝第幾章，例如 0215）</label>
              <input style={input} value={newCode} maxLength={4} inputMode="numeric" placeholder="0215" onChange={(e) => setNewCode(e.target.value.replace(/\D/g, ""))} />
              <label style={{ ...label, marginTop: 8 }}>章節標題</label>
              <input style={input} value={newTitle} placeholder="例如：用 AI 規劃週末小旅行" onChange={(e) => setNewTitle(e.target.value)} />
              {createMsg && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{createMsg}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={btn("#38bdf8", "#0f172a")} onClick={createChapter}>建立（先存草稿）</button>
                <button style={btn("transparent", "#94a3b8")} onClick={() => setCreating(false)}>取消</button>
              </div>
            </div>
          )}
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
                  {c.custom && <span style={badge("#a78bfa")}>新增</span>}
                  {c.custom && !c.published && <span style={badge("#475569", "#e2e8f0")}>草稿</span>}
                  {c.overridden && <span style={badge("#38bdf8")}>已修改</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 編輯區 */}
        <div style={card}>
          {!detail ? (
            <div style={{ color: "#64748b", padding: 40, textAlign: "center" }}>← 從左邊選一個章節，或按「＋ 新增章節」</div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, flex: 1, minWidth: 200 }}>
                  <span style={{ color: "#64748b", fontFamily: "monospace", marginRight: 8 }}>{detail.id}</span>{detail.title}
                  {detail.custom && <span style={{ ...badge("#a78bfa"), marginLeft: 8, verticalAlign: "middle" }}>後台新增</span>}
                </h2>
                <a href={`/smart/chapter/${detail.id}?preview=1`} target="_blank" rel="noreferrer" style={{ ...btn("#334155"), textDecoration: "none" }}>預覽章節 ↗</a>
              </div>

              {detail.custom && (
                <label style={{ ...panel, display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}>
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14, color: "#e2e8f0" }}>
                    <b>發布</b>：勾選並儲存後，章節會出現在書本目錄、所有人可開啟。未勾選＝草稿，只有管理員預覽看得到。
                  </span>
                </label>
              )}

              {/* 章首圖片 / 影片 */}
              <div style={{ ...panel, marginBottom: 16 }}>
                <div style={{ ...panelTitle, marginBottom: 10 }}>🖼️ 章首圖片與影片</div>
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
                    {embed && <VideoPreview src={embed} />}
                  </div>
                </div>
              </div>

              {/* 新增內容區塊 */}
              <div style={{ ...panel, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ ...panelTitle, flex: 1 }}>➕ 新增內容區塊（顯示在「今天的一小步」上方，可調整順序）</div>
                  {(Object.keys(BLOCK_TYPE_LABELS) as ChapterBlockType[]).map((t) => (
                    <button key={t} style={smallBtn} onClick={() => set("blocks", [...blocks, emptyBlock(t)])}>
                      {BLOCK_TYPE_LABELS[t].icon} {BLOCK_TYPE_LABELS[t].label}
                    </button>
                  ))}
                </div>
                {blocks.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>尚未新增。點上方按鈕加入文字、圖片、影片、練習範例或連結。</div>}
                {blocks.map((b, i) => (
                  <div key={b.id} style={{ border: "1px solid #334155", borderRadius: 8, padding: 12, marginTop: 10, background: "#111c30" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", flex: 1 }}>
                        {i + 1}. {BLOCK_TYPE_LABELS[b.type].icon} {BLOCK_TYPE_LABELS[b.type].label}
                      </span>
                      <button style={smallBtn} disabled={i === 0} onClick={() => moveBlock(i, -1)} title="上移">↑</button>
                      <button style={smallBtn} disabled={i === blocks.length - 1} onClick={() => moveBlock(i, 1)} title="下移">↓</button>
                      <button style={{ ...smallBtn, background: "transparent", color: "#f87171" }} onClick={() => set("blocks", blocks.filter((_, j) => j !== i))} title="刪除">✕</button>
                    </div>
                    <BlockFields block={b} onChange={(patch) => setBlock(i, patch)} />
                  </div>
                ))}
              </div>

              {/* 文字欄位 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {EDITABLE_TEXT_FIELDS.map((f) => {
                  const multi = MULTILINE_FIELDS.has(f);
                  const def = (detail.defaults[f] as string | undefined) ?? "";
                  const common = {
                    value: (form[f] as string | undefined) ?? "",
                    placeholder: def || "（預設為空）",
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(f, e.target.value),
                  };
                  return (
                    <div key={f} style={{ gridColumn: multi ? "1 / -1" : "auto" }}>
                      <label style={label}>{FIELD_LABELS[f]}{detail.custom && f === "title" ? "（必填）" : ""}</label>
                      {multi ? <textarea style={area} {...common} /> : <input style={input} {...common} />}
                    </div>
                  );
                })}

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={label}>章首導讀段落（一行一段）</label>
                  <textarea
                    style={{ ...area, minHeight: 120 }}
                    value={(form.guideParagraphs ?? []).join("\n")}
                    placeholder={(detail.defaults.guideParagraphs ?? []).join("\n") || "（預設為空）"}
                    onChange={(e) => set("guideParagraphs", e.target.value.split("\n"))}
                  />
                </div>
              </div>

              {/* 路線卡 entries */}
              <div style={{ ...panel, marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ ...panelTitle, flex: 1 }}>🗂️ 路線卡（沒有自訂就用預設 {detail.defaults.entries?.length ?? 0} 筆）</div>
                  {entries.length === 0 && (
                    <button style={smallBtn} onClick={() => set("entries", detail.defaults.entries ?? [])}>從預設帶入</button>
                  )}
                  <button style={smallBtn} onClick={() => set("entries", [...entries, { id: `e${Date.now().toString(36)}`, label: "", hint: "", emoji: "" }])}>＋ 新增</button>
                </div>
                {entries.map((e, i) => (
                  <div key={e.id + i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1.4fr 1fr 32px", gap: 6, marginBottom: 6 }}>
                    <input style={input} placeholder="表情" value={e.emoji ?? ""} onChange={(ev) => setEntry(i, { emoji: ev.target.value })} />
                    <input style={input} placeholder="標籤" value={e.label} onChange={(ev) => setEntry(i, { label: ev.target.value })} />
                    <input style={input} placeholder="提示" value={e.hint ?? ""} onChange={(ev) => setEntry(i, { hint: ev.target.value })} />
                    <input style={input} placeholder="連結 /smart/chapter/…" value={e.href ?? ""} onChange={(ev) => setEntry(i, { href: ev.target.value || undefined })} />
                    <button style={btn("transparent", "#f87171")} onClick={() => set("entries", entries.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>

              {/* 動作列 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap", position: "sticky", bottom: 0, background: "#1e293b", padding: "12px 0" }}>
                <button style={btn("#38bdf8", "#0f172a")} onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</button>
                <button style={btn("transparent", "#f87171")} onClick={reset}>{detail.custom ? "刪除此章節" : "還原預設"}</button>
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

function VideoPreview({ src }: { src: string }) {
  return (
    <div style={{ marginTop: 8, position: "relative", paddingTop: "56.25%", borderRadius: 6, overflow: "hidden" }}>
      <iframe src={src} title="預覽" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen />
    </div>
  );
}

/** 各類內容區塊的輸入欄位 */
function BlockFields({ block: b, onChange }: { block: ChapterBlock; onChange: (patch: Partial<ChapterBlock>) => void }) {
  switch (b.type) {
    case "text":
      return (
        <>
          <input style={{ ...input, marginBottom: 6 }} placeholder="小標題（選填）" value={b.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} />
          <textarea style={{ ...area, minHeight: 100 }} placeholder="內文（可換行）" value={b.body} onChange={(e) => onChange({ body: e.target.value })} />
        </>
      );
    case "image":
      return (
        <>
          <input style={{ ...input, marginBottom: 6 }} placeholder="圖片網址 https://…/photo.jpg" value={b.url} onChange={(e) => onChange({ url: e.target.value })} />
          <input style={input} placeholder="圖說（選填）" value={b.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} />
          {b.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.url} alt="" style={{ marginTop: 8, maxWidth: "100%", maxHeight: 180, borderRadius: 6 }} />
          )}
        </>
      );
    case "video": {
      const embed = youtubeEmbedUrl(b.url);
      return (
        <>
          <input style={{ ...input, marginBottom: 6 }} placeholder="YouTube 網址 https://www.youtube.com/watch?v=…" value={b.url} onChange={(e) => onChange({ url: e.target.value })} />
          <input style={input} placeholder="影片說明（選填）" value={b.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} />
          {b.url && !embed && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>只支援 YouTube 網址</div>}
          {embed && <div style={{ maxWidth: 360 }}><VideoPreview src={embed} /></div>}
        </>
      );
    }
    case "example":
      return (
        <>
          <input style={{ ...input, marginBottom: 6 }} placeholder="範例名稱（選填，例如：請 AI 幫忙規劃）" value={b.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} />
          <textarea style={{ ...area, marginBottom: 6 }} placeholder="練習語句（長輩可一鍵複製，或直接用 Gemini／ChatGPT／暖暖語音試）" value={b.prompt} onChange={(e) => onChange({ prompt: e.target.value })} />
          <input style={input} placeholder="小提醒（選填）" value={b.note ?? ""} onChange={(e) => onChange({ note: e.target.value })} />
        </>
      );
    case "link":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 6 }}>
          <input style={input} placeholder="按鈕文字" value={b.label} onChange={(e) => onChange({ label: e.target.value })} />
          <input style={input} placeholder="網址 https://… 或站內路徑 /smart/chapter/0203" value={b.url} onChange={(e) => onChange({ url: e.target.value })} />
        </div>
      );
  }
}
