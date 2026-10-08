"use client";

// ────────────────────────────────────────────────
// 我的故事集：說一段人生故事給暖暖聽（暖暖一題一題問）→ 整理成文章 → 改好、配照片、存下來
// 每篇自己決定給不給家人看（預設給）；家人可以按讚留言；可以念給我聽、印成一本小書（/stories/book）
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { DictationButton } from "@/components/dictation-button";
import { VideoComments } from "@/components/video-comments";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/telemetry";
import { appendDictation } from "@/lib/dictation";
import { compressImage } from "@/lib/image-utils";
import { stagePhoto } from "@/lib/direct-upload";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import { ASK_MESSAGE_MAX, trimAskHistory, type AskMessage } from "@/lib/ask";
import {
  STORY_BODY_MAX,
  STORY_ERA_MAX,
  STORY_MIN_ANSWERS,
  STORY_PHOTOS_MAX,
  STORY_TITLE_MAX,
  STORY_TOPICS,
  storyAnswerCount,
  storySpeech,
  trimStoryInterview,
  type LifeStory,
  type StoryDraft,
} from "@/lib/life-stories";

type View = "list" | "interview" | "draft" | "detail" | "edit";

interface DraftPhoto {
  preview: string;
  path: string;
  width: number;
  height: number;
}

/** 還沒存的訪談與草稿：放在這個分頁（離開再回來還在；key 帶帳號） */
interface Work {
  messages: AskMessage[];
  draft: StoryDraft | null;
  share: boolean;
}

const EMPTY_WORK: Work = { messages: [], draft: null, share: true };

function workKey(uid: string | null) {
  return uid ? `nuannuan_story_work:${uid}` : null;
}

function loadWork(uid: string | null): Work {
  const key = workKey(uid);
  try {
    const raw = key ? sessionStorage.getItem(key) : null;
    if (raw) return { ...EMPTY_WORK, ...(JSON.parse(raw) as Work) };
  } catch { /* ignore */ }
  return EMPTY_WORK;
}

function saveWork(uid: string | null, w: Work) {
  const key = workKey(uid);
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(w));
  } catch { /* ignore */ }
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", { year: "numeric", month: "numeric", day: "numeric" });
}

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "var(--fs-base)",
  lineHeight: 1.6, fontFamily: "inherit", color: "var(--ink-1)", background: "var(--surface)",
  border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
};

const smallBtn: React.CSSProperties = {
  padding: "8px 14px", minHeight: 44, borderRadius: 999, border: "1px solid var(--line-strong)",
  background: "var(--surface)", color: "var(--ink-1)", fontSize: "var(--fs-sm)", cursor: "pointer",
};

const label: React.CSSProperties = { fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 6 };

export function StoriesScreen({ onBack }: { onBack: () => void }) {
  const toast = useToast();
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [view, setView] = useState<View>("list");
  const [stories, setStories] = useState<LifeStory[] | null>(null);
  const [current, setCurrent] = useState<LifeStory | null>(null);
  const [work, setWork] = useState<Work>(EMPTY_WORK);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [edit, setEdit] = useState<StoryDraft | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  // 等暖暖回覆時長輩可能按返回、重新開始：回來的結果要寫進「最新的」草稿，且草稿被丟掉後就不寫
  const workRef = useRef<Work>(EMPTY_WORK);
  const workGen = useRef(0);
  const viewRef = useRef<View>("list");
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const load = () =>
    api.listStories()
      .then((r) => setStories(r.stories))
      .catch(() => setStories((s) => s ?? []));

  useEffect(() => {
    if (!uid) return;
    load();
    const w = loadWork(uid);
    workGen.current++;
    workRef.current = w;
    setWork(w);
    api.askQuota().then((r) => setQuota(r.quota)).catch(() => undefined);
  }, [uid]);

  useEffect(() => () => stopGuideSpeech(), []);
  useEffect(() => {
    if (view === "interview") endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [work.messages.length, busy, view]);

  const updateWork = (w: Work) => {
    workRef.current = w;
    setWork(w);
    saveWork(uid, w);
  };

  /** 丟掉進行中的故事；還在等的回覆回來也不會再寫回去 */
  const resetWork = () => {
    workGen.current++;
    updateWork(EMPTY_WORK);
    setPhotos([]);
    setBusy(false);
  };

  const fail = (e: unknown, fallback: string) =>
    toast.error(e instanceof ApiError && !e.isNetwork ? e.message : fallback);

  // ── 訪談 ──
  const send = async (text: string, base: AskMessage[] = work.messages) => {
    const q = [...text.trim()].slice(0, ASK_MESSAGE_MAX).join("");
    if (!q || busy) return;
    const gen = workGen.current;
    const messages: AskMessage[] = [...base, { role: "user", text: q }];
    updateWork({ ...workRef.current, messages });
    setInput("");
    setBusy(true);
    try {
      const res = await api.ask({ messages: trimAskHistory(messages), mode: "story" });
      setQuota(res.quota);
      if (gen !== workGen.current) return;
      updateWork({ ...workRef.current, messages: [...messages, { role: "assistant", text: res.reply }] });
    } catch (e) {
      if (gen !== workGen.current) return;
      updateWork({ ...workRef.current, messages: base });
      setInput(q);
      fail(e, "網路不太穩，等一下再說一次");
    } finally {
      if (gen === workGen.current) setBusy(false);
    }
  };

  const startTopic = (topic: string) => {
    const t = topic.trim();
    if (!t) return;
    trackEvent("story_start", { preset: (STORY_TOPICS as readonly string[]).includes(t) });
    send(`我想講的故事：${t}`, []);
  };

  const writeArticle = async () => {
    if (busy) return;
    const gen = workGen.current;
    const messages = workRef.current.messages;
    setBusy(true);
    try {
      const res = await api.writeStory(trimStoryInterview(messages));
      setQuota(res.quota);
      if (gen !== workGen.current) return;
      updateWork({ ...workRef.current, draft: res.draft });
      trackEvent("story_written", { answers: storyAnswerCount(messages) });
      // 等的時候回到清單了就不硬跳過去，清單上「繼續剛剛的故事」會打開草稿
      if (viewRef.current === "interview") setView("draft");
      else toast.success("暖暖把故事整理好了，按「繼續剛剛的故事」看看");
    } catch (e) {
      if (gen !== workGen.current) return;
      fail(e, "暖暖這次沒整理好，請再按一次");
    } finally {
      if (gen === workGen.current) setBusy(false);
    }
  };

  // ── 照片（直傳 Supabase 暫存區；存檔時在 Supabase 裡複製過去） ──
  const addPhoto = async (file: File | undefined) => {
    if (!file || photos.length >= STORY_PHOTOS_MAX) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImage(file, { maxSide: 1280, quality: 0.85 });
      const [path, size] = await Promise.all([stagePhoto(dataUrl), imageSize(dataUrl)]);
      if (!path) throw new Error("upload failed");
      setPhotos((p) => [...p, { preview: dataUrl, path, ...size }].slice(0, STORY_PHOTOS_MAX));
    } catch {
      toast.error("照片傳不上去，請換一張或再試一次");
    }
    setPhotoBusy(false);
  };

  const saveStory = async () => {
    const d = work.draft;
    if (!d || busy) return;
    if (!d.title.trim() || !d.body.trim()) {
      toast.info("標題和內容都要寫喔");
      return;
    }
    setBusy(true);
    try {
      const res = await api.createStory({
        title: d.title,
        era: d.era,
        body: d.body,
        shareWithFamily: work.share,
        photoPaths: photos.map((p) => p.path),
        photoSizes: photos.map(({ width, height }) => ({ width, height })),
        interview: trimStoryInterview(work.messages),
      });
      trackEvent("story_saved", { photos: photos.length, share: work.share });
      resetWork();
      setCurrent(res.story);
      setStories((s) => [res.story, ...(s ?? [])]);
      setView("detail");
      toast.success(work.share ? "存好了！家人也看得到這篇故事" : "存好了！這篇只有你看得到");
    } catch (e) {
      fail(e, "存不進去，請再試一次");
    }
    setBusy(false);
  };

  // ── 一篇故事 ──
  const openStory = (s: LifeStory) => {
    stopGuideSpeech();
    setSpeaking(false);
    setCurrent(s);
    setView("detail");
  };

  const toggleSpeak = () => {
    if (!current) return;
    if (speaking) {
      stopGuideSpeech();
      setSpeaking(false);
      return;
    }
    const ok = speakGuideParagraphs(storySpeech(current), { rate: 0.9, onEnd: () => setSpeaking(false), onError: () => setSpeaking(false) });
    setSpeaking(ok);
    if (!ok) toast.info("這支手機不支援朗讀，請直接看文字");
  };

  const patchCurrent = async (patch: { title?: string; era?: string; body?: string; shareWithFamily?: boolean }) => {
    if (!current || busy) return false;
    setBusy(true);
    try {
      const res = await api.updateStory(current.id, patch);
      const merged = { ...res.story, comments: current.comments };
      setCurrent(merged);
      setStories((s) => (s ?? []).map((x) => (x.id === merged.id ? merged : x)));
      setBusy(false);
      return true;
    } catch (e) {
      fail(e, "沒存成功，請再試一次");
      setBusy(false);
      return false;
    }
  };

  const removeCurrent = async () => {
    if (!current || busy || !confirm("確定要刪掉這篇故事？刪掉就找不回來了")) return;
    setBusy(true);
    try {
      await api.deleteStory(current.id);
      setStories((s) => (s ?? []).filter((x) => x.id !== current.id));
      setCurrent(null);
      setView("list");
    } catch (e) {
      fail(e, "刪除沒成功，請再試一次");
    }
    setBusy(false);
  };

  const back = () => {
    stopGuideSpeech();
    setSpeaking(false);
    if (view === "list") onBack();
    else if (view === "draft") setView("interview");
    else if (view === "edit") setView("detail");
    else setView("list");
  };

  const remaining = quota && quota.limit < 99999 ? Math.max(0, quota.limit - quota.used) : null;
  const answers = storyAnswerCount(work.messages);
  const inProgress = work.messages.length > 0 || Boolean(work.draft);

  return (
    <SubPage title="我的故事集" onBack={back}>
      {view === "list" && (
        <>
          <div style={{
            background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
            borderRadius: "var(--r-lg)", padding: 16, display: "flex", gap: 12, alignItems: "center",
          }}>
            <Mascot size={60} mood="happy" />
            <div style={{ flex: 1, fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
              把人生故事<strong>說給暖暖聽</strong>，暖暖一題一題陪你回想，再幫你<strong>整理成文章</strong>，慢慢收成一本回憶錄。
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", marginTop: 16, minHeight: 56 }}
            onClick={() => setView(work.draft ? "draft" : "interview")}
          >
            {inProgress ? "✍️ 繼續剛剛的故事" : "🎙 說一個新故事"}
          </button>
          {inProgress && (
            <button type="button" onClick={() => { resetWork(); setView("interview"); }} style={{ ...smallBtn, display: "block", margin: "10px auto 0" }}>
              不要了，重新開始
            </button>
          )}

          {stories && stories.length > 0 && (
            <a href="/stories/book" className="btn-ghost" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 12 }}>
              📖 印成一本小書
            </a>
          )}

          <div style={{ fontWeight: 800, margin: "24px 0 10px" }}>我的故事（{stories?.length ?? 0} 篇）</div>
          {stories === null ? (
            <div style={{ color: "var(--ink-2)", textAlign: "center", padding: 20 }}>載入中…</div>
          ) : stories.length === 0 ? (
            <div style={{ color: "var(--ink-2)", textAlign: "center", padding: 20, border: "1px dashed var(--line-strong)", borderRadius: "var(--r-lg)" }}>
              還沒有故事。從「小時候住的家」開始也很好。
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openStory(s)}
                  className="card"
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, textAlign: "left", width: "100%", cursor: "pointer", border: "1px solid var(--line)" }}
                >
                  {s.photos[0] ? (
                    <img src={s.photos[0].url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 64, height: 64, borderRadius: 10, background: "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }} aria-hidden="true">📖</span>
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 800, color: "var(--ink-1)" }}>{s.title}</span>
                    <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>
                      {s.era ? `${s.era}・` : ""}{formatDay(s.created_at)}・{s.share_with_family ? "👪 家人看得到" : "🔒 只有我"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {view === "interview" && (
        <>
          {work.messages.length === 0 ? (
            <>
              <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)", margin: "4px 0 6px" }}>想講哪一段故事？</div>
              <div style={{ color: "var(--ink-2)", fontSize: "var(--fs-sm)", lineHeight: 1.6, marginBottom: 12 }}>
                選一個，或自己說一個題目。暖暖會一次問一題，陪你慢慢回想。
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STORY_TOPICS.map((t) => (
                  <button key={t} type="button" onClick={() => startTopic(t)} disabled={busy} style={smallBtn}>{t}</button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {work.messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} style={{ alignSelf: "flex-end", maxWidth: "88%", padding: "12px 14px", borderRadius: 16, background: "var(--primary-soft)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </div>
                ) : (
                  <div key={i} style={{ alignSelf: "flex-start", maxWidth: "92%" }}>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", fontWeight: 700, marginBottom: 4 }}>🧡 暖暖</div>
                    <div style={{ padding: "12px 14px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--line)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {m.text}
                    </div>
                  </div>
                )
              )}
              {busy && <div role="status" style={{ color: "var(--ink-2)" }}>暖暖想一下…</div>}
              <div ref={endRef} />
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              value={input}
              onChange={(e) => setInput([...e.target.value].slice(0, ASK_MESSAGE_MAX).join(""))}
              placeholder={work.messages.length ? "回答暖暖，或接著說…" : "也可以自己說一個題目，例如：我第一次搭火車到台北"}
              rows={3}
              disabled={busy}
              aria-label="回答暖暖"
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <DictationButton where="story" disabled={busy} onText={(t) => setInput((prev) => appendDictation(prev, t, ASK_MESSAGE_MAX))} />
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, minHeight: 56 }}
                disabled={busy || !input.trim()}
                onClick={() => (work.messages.length ? send(input) : startTopic(input))}
              >
                {busy ? "暖暖想一下…" : "送出"}
              </button>
            </div>
            {work.messages.length > 0 && (
              <button
                type="button"
                className="btn-ghost"
                onClick={writeArticle}
                disabled={busy || answers < STORY_MIN_ANSWERS}
                style={{ width: "100%" }}
              >
                📝 整理成文章{answers < STORY_MIN_ANSWERS ? `（再回答 ${STORY_MIN_ANSWERS - answers} 題）` : ""}
              </button>
            )}
            {remaining !== null && (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", textAlign: "center" }}>
                今天還可以和暖暖說 {remaining} 句（和「問暖暖」共用）
              </div>
            )}
          </div>
        </>
      )}

      {view === "draft" && work.draft && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: "var(--ink-2)", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
            暖暖整理好了，看看有沒有要改的地方，都可以直接改。
          </div>
          <div>
            <div style={label}>標題</div>
            <input
              value={work.draft.title}
              onChange={(e) => updateWork({ ...work, draft: { ...work.draft!, title: [...e.target.value].slice(0, STORY_TITLE_MAX).join("") } })}
              style={inputStyle}
              aria-label="故事標題"
            />
          </div>
          <div>
            <div style={label}>年代或那時幾歲（可不填）</div>
            <input
              value={work.draft.era}
              onChange={(e) => updateWork({ ...work, draft: { ...work.draft!, era: [...e.target.value].slice(0, STORY_ERA_MAX).join("") } })}
              placeholder="例如：民國 62 年、我 20 歲那年"
              style={inputStyle}
              aria-label="年代"
            />
          </div>
          <div>
            <div style={label}>內容</div>
            <textarea
              value={work.draft.body}
              onChange={(e) => updateWork({ ...work, draft: { ...work.draft!, body: [...e.target.value].slice(0, STORY_BODY_MAX).join("") } })}
              rows={14}
              style={{ ...inputStyle, resize: "vertical" }}
              aria-label="故事內容"
            />
          </div>

          <div>
            <div style={label}>配幾張照片（最多 {STORY_PHOTOS_MAX} 張，可不放）</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {photos.map((p, i) => (
                <div key={p.path} style={{ position: "relative" }}>
                  <img src={p.preview} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12 }} />
                  <button
                    type="button"
                    onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                    aria-label="拿掉這張照片"
                    style={{ position: "absolute", top: -8, right: -8, width: 32, height: 32, borderRadius: 999, border: "none", background: "var(--ink-1)", color: "#fff", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {photos.length < STORY_PHOTOS_MAX && (
                <label style={{
                  width: 96, height: 96, borderRadius: 12, border: "2px dashed var(--line-strong)", display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer",
                  color: "var(--ink-2)", fontSize: "var(--fs-xs)", position: "relative",
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }}
                    style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
                  />
                  <span style={{ fontSize: 28 }} aria-hidden="true">🖼️</span>
                  {photoBusy ? "傳送中…" : "加照片"}
                </label>
              )}
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--fs-base)", padding: "8px 0" }}>
            <input
              type="checkbox"
              checked={work.share}
              onChange={(e) => updateWork({ ...work, share: e.target.checked })}
              style={{ width: 24, height: 24 }}
            />
            給家人看（他們可以按讚、留言）
          </label>

          <button type="button" className="btn-primary" onClick={saveStory} disabled={busy || photoBusy} style={{ width: "100%", minHeight: 56 }}>
            {busy ? "存檔中…" : "💾 存進我的故事集"}
          </button>
          <button type="button" onClick={() => setView("interview")} style={{ ...smallBtn, alignSelf: "center" }}>
            回去再跟暖暖多說一點
          </button>
        </div>
      )}

      {view === "detail" && current && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {current.photos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.photos.map((p, i) => (
                <img key={i} src={p.url} alt="" style={{ width: "100%", maxHeight: 360, objectFit: "contain", borderRadius: "var(--r-md)", background: "var(--bg-deep)" }} />
              ))}
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: "var(--fs-xl, 26px)", fontWeight: 800, lineHeight: 1.35 }}>{current.title}</h2>
            <div style={{ color: "var(--ink-3)", fontSize: "var(--fs-sm)", marginTop: 4 }}>
              {current.era ? `${current.era}・` : ""}記於 {formatDay(current.created_at)}
            </div>
          </div>
          <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{current.body}</div>

          <div style={{ display: "grid", gridTemplateColumns: canSpeakGuide() ? "1fr 1fr" : "1fr", gap: 10 }}>
            {canSpeakGuide() && (
              <button type="button" className="btn-ghost" onClick={toggleSpeak}>{speaking ? "⏹ 停止" : "🔊 念給我聽"}</button>
            )}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setEdit({ title: current.title, era: current.era ?? "", body: current.body }); setView("edit"); }}
            >
              ✏️ 修改
            </button>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--fs-base)" }}>
            <input
              type="checkbox"
              checked={current.share_with_family}
              disabled={busy}
              onChange={(e) => patchCurrent({ shareWithFamily: e.target.checked })}
              style={{ width: 24, height: 24 }}
            />
            給家人看
          </label>

          {current.share_with_family && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>💬 家人的按讚和留言</div>
              <VideoComments key={current.id} kind="story" videoId={current.id} initial={current.comments} viewer="owner" />
            </div>
          )}

          <button type="button" onClick={removeCurrent} disabled={busy} style={{ ...smallBtn, alignSelf: "center", color: "var(--ink-3)", border: "none" }}>
            🗑️ 刪掉這篇故事
          </button>
        </div>
      )}

      {view === "edit" && current && edit && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={label}>標題</div>
            <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: [...e.target.value].slice(0, STORY_TITLE_MAX).join("") })} style={inputStyle} aria-label="故事標題" />
          </div>
          <div>
            <div style={label}>年代或那時幾歲</div>
            <input value={edit.era} onChange={(e) => setEdit({ ...edit, era: [...e.target.value].slice(0, STORY_ERA_MAX).join("") })} style={inputStyle} aria-label="年代" />
          </div>
          <div>
            <div style={label}>內容</div>
            <textarea value={edit.body} onChange={(e) => setEdit({ ...edit, body: [...e.target.value].slice(0, STORY_BODY_MAX).join("") })} rows={14} style={{ ...inputStyle, resize: "vertical" }} aria-label="故事內容" />
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            style={{ width: "100%", minHeight: 56 }}
            onClick={async () => {
              if (await patchCurrent({ title: edit.title, era: edit.era, body: edit.body })) {
                toast.success("改好了");
                setView("detail");
              }
            }}
          >
            {busy ? "存檔中…" : "💾 存好"}
          </button>
        </div>
      )}
      <div style={{ height: 24 }} />
    </SubPage>
  );
}
