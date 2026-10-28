"use client";

// ────────────────────────────────────────────────
// 數位名片：看名片（＝別人看到的樣子）＋分享（QR、LINE、印紙本）／改名片（照片、名字、介紹、聯絡方式、作品）
// 聯絡方式預設不公開；要按「開始分享」才有連結，隨時可以停止或換新連結（舊連結就失效）
// 伺服器還沒準備好（503 = 沒跑 SQL）就說一聲
// ────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { DictationButton } from "@/components/dictation-button";
import { BusinessCardFace, BusinessCardView } from "@/components/business-card-view";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { compressImage } from "@/lib/image-utils";
import { photoPayload } from "@/lib/direct-upload";
import { appendDictation } from "@/lib/dictation";
import { publicAppOrigin } from "@/lib/study-tours";
import {
  CARD_LAYOUTS,
  CARD_LIMITS,
  CARD_THEMES,
  CARD_WORKS_MAX,
  EMPTY_CARD_FIELDS,
  cardSharePath,
  cardTitle,
  toPublicCard,
  type BusinessCard,
  type CardFields,
  type CardWork,
  type CardWorkChoice,
  type CardWorkRef,
  type PublicBusinessCard,
} from "@/lib/business-card";

type View = "card" | "edit";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface)", border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
  padding: "14px 16px", fontSize: "var(--fs-lg)", fontWeight: 600, color: "var(--ink-1)", outline: "none", fontFamily: "inherit",
};
const sectionTitle: React.CSSProperties = { fontSize: "var(--fs-lg)", fontWeight: 800, margin: "22px 0 10px", color: "var(--ink-1)" };
const label: React.CSSProperties = { fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-2)", margin: "12px 0 8px" };
const note: React.CSSProperties = { fontSize: "var(--fs-sm)", color: "var(--ink-3)", lineHeight: 1.6, marginTop: 6 };

function fieldsOf(card: BusinessCard): CardFields {
  const { display_name, nickname, intro, interests, phone, line_id, email, show_phone, show_line, show_email, works, theme, layout } = card;
  return { display_name, nickname, intro, interests, phone, line_id, email, show_phone, show_line, show_email, works, theme, layout };
}

function shareUrl(slug: string): string {
  return `${publicAppOrigin(process.env.NEXT_PUBLIC_APP_URL, window.location.origin)}${cardSharePath(slug)}`;
}

export function BusinessCardScreen({ onBack }: { onBack: () => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [savedWorks, setSavedWorks] = useState<CardWork[]>([]);
  const [choices, setChoices] = useState<CardWorkChoice[]>([]);
  const [draft, setDraft] = useState<CardFields>(EMPTY_CARD_FIELDS);
  const [view, setView] = useState<View>("card");
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLDivElement>(null);
  const jumpToDesign = useRef(false);

  // 看名片／改名片切換時回到最上面（子頁的捲動位置不會自己歸零）；按「換名片樣子」就直接到樣子那一段
  useEffect(() => {
    const target = jumpToDesign.current ? designRef.current : topRef.current;
    jumpToDesign.current = false;
    target?.scrollIntoView({ block: "start" });
  }, [view]);

  useEffect(() => {
    api.getBusinessCard()
      .then((r) => {
        setCard(r.card);
        setSavedWorks(r.works);
        setChoices(r.choices);
        setDraft(r.card ? fieldsOf(r.card) : { ...EMPTY_CARD_FIELDS, display_name: r.suggestedName });
        setView(r.card ? "card" : "edit");
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 503) setUnavailable(true);
        else toast.error("讀不到名片，請等一下再試");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slug = card?.is_public ? card.slug : null;
  useEffect(() => {
    if (!slug) { setQrSvg(""); return; }
    let alive = true;
    QRCode.toString(shareUrl(slug), { type: "svg", margin: 1, errorCorrectionLevel: "M" })
      .then((svg) => { if (alive) setQrSvg(svg); })
      .catch(() => { if (alive) setQrSvg(""); });
    return () => { alive = false; };
  }, [slug]);

  // 預覽：用正在改的內容（作品有存過的用存過的全文，剛選的先只有標題）
  const preview = useMemo(() => {
    const base: BusinessCard = card ?? { ...EMPTY_CARD_FIELDS, slug: "", photo_url: null, is_public: false, updated_at: "" };
    const works: CardWork[] = [];
    for (const ref of draft.works) {
      const saved = savedWorks.find((w) => w.kind === ref.kind && w.id === ref.id);
      const choice = choices.find((c) => c.kind === ref.kind && c.id === ref.id);
      if (saved) works.push(saved);
      else if (choice) works.push({ kind: choice.kind, id: choice.id, title: choice.title, photo_url: choice.photo_url, href: choice.kind === "video" ? `/v/${choice.id}` : null, body: null });
    }
    return toPublicCard({ ...base, ...draft }, works);
  }, [card, draft, savedWorks, choices]);

  const set = <K extends keyof CardFields>(key: K, value: CardFields[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const toggleWork = (ref: CardWorkRef) => {
    setDraft((d) => {
      const has = d.works.some((w) => w.kind === ref.kind && w.id === ref.id);
      if (has) return { ...d, works: d.works.filter((w) => !(w.kind === ref.kind && w.id === ref.id)) };
      if (d.works.length >= CARD_WORKS_MAX) {
        toast.info(`最多放 ${CARD_WORKS_MAX} 件，先拿掉一件再選`);
        return d;
      }
      return { ...d, works: [...d.works, ref] };
    });
  };

  const save = async () => {
    if (saving) return;
    if (!draft.display_name.trim() && !draft.nickname.trim()) {
      toast.error("請先填名字或稱呼");
      return;
    }
    setSaving(true);
    try {
      const r = await api.saveBusinessCard(draft);
      setCard(r.card);
      setSavedWorks(r.works);
      setDraft(fieldsOf(r.card));
      setView("card");
      trackEvent("business_card_save", { works: r.card.works.length, photo: Boolean(r.card.photo_url) });
      toast.success(r.card.is_public ? "存好了，分享出去的名片也更新了" : "存好了！按「開始分享」就能給別人看");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "沒存到，請再試一次");
    }
    setSaving(false);
  };

  const pickPhoto = async (file: File) => {
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImage(file, { maxSide: 800, quality: 0.85 });
      const r = await api.setBusinessCardPhoto(await photoPayload(dataUrl));
      // 照片馬上存好；正在改的文字不要被蓋掉
      setCard((c) => (c ? { ...c, photo_url: r.card.photo_url } : r.card));
      toast.success("照片換好了");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : (e as Error).message || "照片沒換成，請再試一次");
    }
    setPhotoBusy(false);
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    try {
      await api.removeBusinessCardPhoto();
      setCard((c) => (c ? { ...c, photo_url: null } : c));
    } catch {
      toast.error("照片沒拿掉，請再試一次");
    }
    setPhotoBusy(false);
  };

  const sharing = async (action: "share" | "unshare" | "new_link") => {
    if (shareBusy) return;
    if (action === "new_link" && !window.confirm("換新連結後，之前傳出去的連結和 QR 就打不開了。確定要換嗎？")) return;
    if (action === "unshare" && !window.confirm("停止分享後，別人就看不到您的名片了（之後可以再打開）。確定嗎？")) return;
    setShareBusy(true);
    try {
      const r = await api.businessCardSharing(action);
      setCard(r.card);
      trackEvent("business_card_sharing", { action });
      toast.success(action === "share" ? "名片可以分享了 🎉" : action === "unshare" ? "已經停止分享" : "換好新連結了");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "沒改到，請再試一次");
    }
    setShareBusy(false);
  };

  const shareLink = async () => {
    if (!card) return;
    const url = shareUrl(card.slug);
    const text = `這是我的名片：${cardTitle(card)}`;
    trackEvent("business_card_share_link");
    try {
      if (navigator.share) {
        await navigator.share({ title: "我的名片", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("連結複製好了，貼到 LINE 給朋友");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("沒分享成功，可以讓對方直接掃 QR");
    }
  };

  const copyLink = async () => {
    if (!card) return;
    try {
      await navigator.clipboard.writeText(shareUrl(card.slug));
      toast.success("連結複製好了");
    } catch {
      toast.error("這支手機不能複製，請改用「傳給朋友」");
    }
  };

  const printCard = () => {
    document.body.classList.add("printing-card");
    const done = () => {
      document.body.classList.remove("printing-card");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  const back = () => {
    if (view === "edit" && card) {
      setDraft(fieldsOf(card));
      setView("card");
    } else onBack();
  };

  return (
    <SubPage
      title={view === "edit" ? "改我的名片" : "數位名片"}
      onBack={back}
      accent="linear-gradient(180deg, #FBE6D4 0%, transparent 100%)"
      footer={view === "edit" && !unavailable && !loading ? (
        <button className="btn-primary" style={{ width: "100%", opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>
          {saving ? "儲存中…" : "✅ 存起來"}
        </button>
      ) : undefined}
    >
      <style>{`
        .bcard-qr svg { width: 100%; height: 100%; display: block; }
        @media print {
          body.printing-card * { visibility: hidden !important; }
          body.printing-card .bcard-print, body.printing-card .bcard-print * { visibility: visible !important; }
          body.printing-card .bcard-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          body.printing-card .bcard-no-print { display: none !important; }
        }
      `}</style>
      <div ref={topRef} />

      {loading ? (
        <div className="card" role="status" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Mascot size={48} mood="thinking" />
          <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700 }}>正在拿您的名片…</div>
        </div>
      ) : unavailable ? (
        <div className="card" style={{ textAlign: "center", lineHeight: 1.7 }}>
          <div style={{ fontSize: 44 }} aria-hidden="true">📇</div>
          <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>數位名片還在準備中</div>
          <div style={{ color: "var(--ink-2)" }}>過幾天再來看看</div>
        </div>
      ) : view === "card" && card ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="bcard-print" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BusinessCardView card={preview} preview />
            {card.is_public && qrSvg && (
              <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>📷 用手機相機掃這裡，就能看到我的名片</div>
                <div className="bcard-qr" role="img" aria-label="名片 QR code" style={{ width: 240, height: 240, background: "#fff", padding: 10, borderRadius: 12 }}
                  dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)", wordBreak: "break-all" }}>{shareUrl(card.slug)}</div>
              </div>
            )}
          </div>

          <div className="bcard-no-print" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {card.is_public ? (
              <>
                <button className="btn-primary" onClick={shareLink}>📤 用 LINE 傳給朋友</button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button className="btn-ghost" style={{ padding: "12px 8px" }} onClick={copyLink}>🔗 複製連結</button>
                  <button className="btn-ghost" style={{ padding: "12px 8px" }} onClick={printCard}>🖨️ 印紙本</button>
                </div>
              </>
            ) : (
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>名片現在只有您自己看得到</div>
                <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", lineHeight: 1.7 }}>
                  按下面的按鈕，就會有一個連結和 QR code，可以傳給朋友、或在聚會時給對方掃。上面看到的樣子，就是別人看到的。
                </div>
                <button className="btn-primary" disabled={shareBusy} onClick={() => sharing("share")}>📤 開始分享我的名片</button>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button className="btn-ghost" style={{ padding: "12px 8px" }} onClick={() => setView("edit")}>✏️ 改內容</button>
              <button className="btn-ghost" style={{ padding: "12px 8px" }} onClick={() => { jumpToDesign.current = true; setView("edit"); }}>🎨 換樣子</button>
            </div>
            {card.is_public && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button className="btn-ghost" style={{ fontSize: "var(--fs-sm)", padding: "12px 8px" }} disabled={shareBusy} onClick={() => sharing("unshare")}>🙈 停止分享</button>
                <button className="btn-ghost" style={{ fontSize: "var(--fs-sm)", padding: "12px 8px" }} disabled={shareBusy} onClick={() => sharing("new_link")}>🔄 換新連結</button>
              </div>
            )}
            {card.is_public && (
              <div style={note}>傳錯人了？按「換新連結」，之前的連結就打不開。名片不會出現在搜尋引擎上。</div>
            )}
          </div>
        </div>
      ) : (
        <EditForm
          draft={draft}
          set={set}
          photoUrl={card?.photo_url ?? null}
          photoBusy={photoBusy}
          onPickPhoto={() => fileRef.current?.click()}
          onRemovePhoto={removePhoto}
          choices={choices}
          onToggleWork={toggleWork}
          disabled={saving}
          preview={preview}
          designRef={designRef}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void pickPhoto(file);
        }}
      />
    </SubPage>
  );
}

function EditForm({
  draft, set, photoUrl, photoBusy, onPickPhoto, onRemovePhoto, choices, onToggleWork, disabled, preview, designRef,
}: {
  draft: CardFields;
  set: <K extends keyof CardFields>(key: K, value: CardFields[K]) => void;
  photoUrl: string | null;
  photoBusy: boolean;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
  choices: CardWorkChoice[];
  onToggleWork: (ref: CardWorkRef) => void;
  disabled: boolean;
  preview: PublicBusinessCard;
  designRef: React.RefObject<HTMLDivElement | null>;
}) {
  const picked = (c: CardWorkRef) => draft.works.some((w) => w.kind === c.kind && w.id === c.id);
  const pickedPrivate = choices.some((c) => c.private && picked(c));

  return (
    <div>
      <div style={{ ...sectionTitle, marginTop: 0 }}>① 大頭照</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 104, height: 104, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--primary-soft)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, border: "3px solid var(--line-strong)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photoUrl ? <img src={photoUrl} alt="我的大頭照" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span aria-hidden="true">🙂</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <button type="button" className="btn-ghost" disabled={photoBusy} onClick={onPickPhoto}>
            {photoBusy ? "處理中…" : photoUrl ? "📷 換一張" : "📷 選照片"}
          </button>
          {photoUrl && !photoBusy && (
            <button type="button" className="btn-ghost" style={{ minHeight: 44, fontSize: "var(--fs-sm)" }} onClick={onRemovePhoto}>不要照片</button>
          )}
        </div>
      </div>

      <div style={sectionTitle}>② 名字</div>
      <div style={label}>名字</div>
      <input style={inputStyle} value={draft.display_name} maxLength={CARD_LIMITS.display_name} placeholder="例如：王美玉"
        onChange={(e) => set("display_name", e.target.value)} disabled={disabled} />
      <div style={label}>大家怎麼叫您？（可以不填）</div>
      <input style={inputStyle} value={draft.nickname} maxLength={CARD_LIMITS.nickname} placeholder="例如：美玉阿姨"
        onChange={(e) => set("nickname", e.target.value)} disabled={disabled} />

      <div style={sectionTitle}>③ 介紹自己</div>
      <div style={label}>一句話介紹自己</div>
      <textarea style={{ ...inputStyle, minHeight: 110, resize: "vertical", lineHeight: 1.6 }} value={draft.intro} maxLength={CARD_LIMITS.intro}
        placeholder="例如：退休國小老師，現在每天爬山、學拍照"
        onChange={(e) => set("intro", e.target.value)} disabled={disabled} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 10 }}>
        <DictationButton where="business_card" disabled={disabled} onText={(t) => set("intro", appendDictation(draft.intro, t, CARD_LIMITS.intro))} />
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>{[...draft.intro].length}／{CARD_LIMITS.intro}</span>
      </div>
      <div style={label}>興趣（用「、」隔開）</div>
      <input style={inputStyle} value={draft.interests} maxLength={CARD_LIMITS.interests} placeholder="例如：種花、唱老歌、包水餃"
        onChange={(e) => set("interests", e.target.value)} disabled={disabled} />

      <div style={sectionTitle}>④ 聯絡方式</div>
      <div style={{ ...note, marginTop: 0, fontSize: "var(--fs-base)", color: "var(--ink-2)" }}>
        預設都<b>不給別人看</b>。想讓拿到名片的人聯絡您，再把那一項打開。
      </div>
      <ContactRow title="📞 電話" value={draft.phone} max={CARD_LIMITS.phone} placeholder="例如：0912 345 678" inputMode="tel"
        shown={draft.show_phone} onValue={(v) => set("phone", v)} onShown={(v) => set("show_phone", v)} disabled={disabled}
        warn="拿到名片的人都看得到電話。陌生人打來要錢、要驗證碼，一定是詐騙，直接掛掉。" />
      <ContactRow title="💬 LINE ID" value={draft.line_id} max={CARD_LIMITS.line_id} placeholder="LINE ID，或貼上加好友網址"
        shown={draft.show_line} onValue={(v) => set("line_id", v)} onShown={(v) => set("show_line", v)} disabled={disabled}
        hint="LINE →「主頁」→ 右上角齒輪 →「個人檔案」可以看到自己的 ID" />
      <ContactRow title="✉️ Email" value={draft.email} max={CARD_LIMITS.email} placeholder="例如：meiyu@example.com" inputMode="email"
        shown={draft.show_email} onValue={(v) => set("email", v)} onShown={(v) => set("show_email", v)} disabled={disabled} />
      <div style={note}>不放地址、不放年齡：名片會被轉傳，這些留在心裡就好。</div>

      <div style={sectionTitle}>⑤ 精選作品（最多 {CARD_WORKS_MAX} 件）</div>
      {choices.length === 0 ? (
        <div style={{ ...note, fontSize: "var(--fs-base)" }}>還沒有作品。做好的出遊影片、寫好的故事，都可以放上來。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="group" aria-label="精選作品">
          {choices.map((c) => {
            const on = picked(c);
            return (
              <button key={`${c.kind}:${c.id}`} type="button" aria-pressed={on} onClick={() => onToggleWork(c)} disabled={disabled} style={{
                display: "flex", alignItems: "center", gap: 12, padding: 10, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                borderRadius: "var(--r-md)", border: `3px solid ${on ? "var(--primary)" : "var(--line)"}`,
                background: on ? "var(--primary-soft)" : "var(--surface)", color: "var(--ink-1)",
              }}>
                <span aria-hidden="true" style={{ fontSize: 26, width: 30 }}>{on ? "✅" : "⬜"}</span>
                {c.photo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.photo_url} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  : <span aria-hidden="true" style={{ width: 64, height: 48, borderRadius: 8, background: "var(--gold-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>📖</span>}
                <span style={{ fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.4 }}>
                  {c.title}
                  {c.private && <span style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--ink-3)", fontWeight: 600 }}>🔒 原本只有自己看</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {pickedPrivate && (
        <div style={{ ...note, color: "var(--berry)", fontWeight: 700 }}>選了「原本只有自己看」的故事：放上名片後，拿到名片的人都看得到全文。</div>
      )}

      <div ref={designRef} style={{ ...sectionTitle, scrollMarginTop: 12 }}>⑥ 名片樣子</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} role="radiogroup" aria-label="排法">
        {CARD_LAYOUTS.map((l) => {
          const on = draft.layout === l.id;
          return (
            <button key={l.id} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => set("layout", l.id)} style={choiceStyle(on)}>
              <LayoutSketch layout={l.id} />
              <span style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>{l.label}</span>
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--ink-3)" }}>{l.desc}</span>
            </button>
          );
        })}
      </div>
      <div style={label}>顏色</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }} role="radiogroup" aria-label="顏色">
        {CARD_THEMES.map((t) => {
          const on = draft.theme === t.id;
          return (
            <button key={t.id} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => set("theme", t.id)} style={choiceStyle(on)}>
              <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: "50%", background: t.band, border: `3px solid ${t.swatch}` }} />
              <span style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
      <div style={label}>看起來會像這樣：</div>
      <BusinessCardFace card={preview} />
      <div style={{ height: 12 }} />
    </div>
  );
}

function choiceStyle(on: boolean): React.CSSProperties {
  return {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", minHeight: 52,
    borderRadius: "var(--r-md)", cursor: "pointer", fontFamily: "inherit", color: "var(--ink-1)",
    border: `3px solid ${on ? "var(--primary)" : "var(--line)"}`, background: on ? "var(--primary-soft)" : "var(--surface)",
  };
}

/** 直式／橫式的小示意圖 */
function LayoutSketch({ layout }: { layout: string }) {
  const bar = (w: number) => <span style={{ display: "block", width: w, height: 5, borderRadius: 3, background: "var(--line-strong)" }} />;
  return layout === "horizontal" ? (
    <span aria-hidden="true" style={{ width: 84, height: 50, borderRadius: 6, border: "2px solid var(--line-strong)", background: "var(--surface)", display: "flex", gap: 6, padding: 6, boxSizing: "border-box" }}>
      <span style={{ width: 24, height: 24, borderRadius: 5, background: "var(--primary-soft)", flexShrink: 0 }} />
      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>{bar(36)}{bar(28)}{bar(32)}</span>
    </span>
  ) : (
    <span aria-hidden="true" style={{ width: 50, height: 64, borderRadius: 6, border: "2px solid var(--line-strong)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 6, boxSizing: "border-box" }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--primary-soft)" }} />
      {bar(30)}{bar(22)}
    </span>
  );
}

function ContactRow({
  title, value, max, placeholder, inputMode, shown, onValue, onShown, disabled, warn, hint,
}: {
  title: string;
  value: string;
  max: number;
  placeholder: string;
  inputMode?: "tel" | "email";
  shown: boolean;
  onValue: (v: string) => void;
  onShown: (v: boolean) => void;
  disabled: boolean;
  warn?: string;
  hint?: string;
}) {
  const canShow = Boolean(value.trim());
  return (
    <div className="card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <input style={inputStyle} value={value} maxLength={max} placeholder={placeholder} inputMode={inputMode}
        autoComplete="off" onChange={(e) => onValue(e.target.value)} disabled={disabled} />
      {hint && <div style={note}>{hint}</div>}
      <button type="button" aria-pressed={shown && canShow} disabled={disabled || !canShow} onClick={() => onShown(!shown)} style={{
        marginTop: 10, width: "100%", minHeight: 52, borderRadius: "var(--r-pill)", cursor: canShow ? "pointer" : "default",
        fontFamily: "inherit", fontSize: "var(--fs-base)", fontWeight: 800,
        border: `2px solid ${shown && canShow ? "var(--sage)" : "var(--line-strong)"}`,
        background: shown && canShow ? "var(--sage-soft)" : "var(--surface)", color: "var(--ink-1)", opacity: canShow ? 1 : 0.55,
      }}>
        {shown && canShow ? "👀 會給別人看（點一下關掉）" : "🙈 不給別人看（點一下打開）"}
      </button>
      {shown && canShow && warn && <div style={{ ...note, color: "var(--berry)", fontWeight: 700 }}>{warn}</div>}
    </div>
  );
}
