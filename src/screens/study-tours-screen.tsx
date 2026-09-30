"use client";

// ────────────────────────────────────────────────
// 研學團：找活動 → 看介紹 → 報名（不收費，額滿排候補）
//         我的研學護照：每一站掃 QR Code 蓋章，集滿領結業證書
// ────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { SubPage } from "@/components/sub-page";
import { Mascot } from "@/components/mascot";
import { api, ApiError } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";
import { canSpeakGuide, speakGuideParagraphs, stopGuideSpeech } from "@/lib/speak-guide";
import {
  MAX_PARTY_SIZE,
  formatCertificateDate,
  formatTourDateRange,
  formatTourDay,
  isPassportComplete,
  ownRegistration,
  publicAppOrigin,
  registrationStatusLabel,
  seatsLabel,
  stampProgress,
  tourShareUrl,
  walkingLevelMeta,
  type StudyTourElder,
  type StudyTourRegistrationView,
  type StudyTourView,
} from "@/lib/study-tours";

type View = "list" | "passport";

interface StudyToursScreenProps {
  onBack: () => void;
  /** 深連結／推播帶進來要直接打開的活動 */
  initialTourId?: string | null;
  initialView?: View;
  displayName?: string | null;
  /** 拍照問暖暖（帶目前這團的名稱當地點；從某一團打開時帶 id，返回時回到那一團） */
  onPhotoAsk?: (place?: string, tourId?: string) => void;
}

const sectionTitle: React.CSSProperties = {
  fontSize: "var(--fs-base)", fontWeight: 800, color: "var(--ink-1)", margin: "24px 0 12px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "14px 16px", minHeight: 56,
  fontSize: "var(--fs-base)", color: "var(--ink-1)", fontFamily: "inherit",
  background: "var(--surface)", border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
};

function tabButton(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: "12px 8px", minHeight: 56, borderRadius: "var(--r-md)",
    background: active ? "var(--primary)" : "var(--surface)",
    color: active ? "#fff" : "var(--ink-1)",
    border: `2px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-base)", fontWeight: 800,
  };
}

function choiceButton(active: boolean): React.CSSProperties {
  return {
    padding: "12px 14px", minHeight: 52, borderRadius: "var(--r-md)",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: `3px solid ${active ? "var(--primary)" : "var(--line)"}`,
    fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--ink-1)",
  };
}

function isOver(tour: StudyTourView, now = Date.now()) {
  return new Date(tour.ends_at).getTime() < now;
}

function hasStarted(tour: StudyTourView, now = Date.now()) {
  return new Date(tour.starts_at).getTime() <= now;
}

export function StudyToursScreen({ onBack, initialTourId = null, initialView = "list", displayName, onPhotoAsk }: StudyToursScreenProps) {
  const [tours, setTours] = useState<StudyTourView[] | null>(null);
  const [elders, setElders] = useState<StudyTourElder[]>([]);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>(initialView);
  const [selectedId, setSelectedId] = useState<string | null>(initialTourId);
  const [certificateTourId, setCertificateTourId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const data = await api.listStudyTours();
      setTours(data.tours);
      setElders(data.elders);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "載入失敗，請檢查網路");
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => stopGuideSpeech(), []);

  const upcoming = useMemo(
    () => (tours ?? []).filter((t) => t.status === "published" && !isOver(t)),
    [tours]
  );
  const passportTours = useMemo(() => {
    const mine = (tours ?? []).filter((t) => ownRegistration(t));
    // 進行中／快出發的排前面，已結束的排後面
    return mine.sort((a, b) => Number(isOver(a)) - Number(isOver(b)) || a.starts_at.localeCompare(b.starts_at));
  }, [tours]);

  const selected = selectedId ? (tours ?? []).find((t) => t.id === selectedId) ?? null : null;
  const ongoing = passportTours.find((t) => hasStarted(t) && !isOver(t)) ?? null;
  const certificateTour = certificateTourId ? (tours ?? []).find((t) => t.id === certificateTourId) ?? null : null;

  const back = () => {
    if (selectedId) {
      setSelectedId(null);
      return;
    }
    onBack();
  };

  return (
    <SubPage title={selected ? "研學團介紹" : "研學團"} onBack={back}>
      {loadError && (
        <div className="card" style={{ textAlign: "center", marginBottom: 16 }}>
          <div role="alert" style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{loadError}</div>
          <button onClick={load} className="btn-ghost" style={{ marginTop: 12 }}>再試一次</button>
        </div>
      )}

      {!loadError && tours === null && (
        <div role="status" style={{ textAlign: "center", padding: 40, color: "var(--ink-2)", fontSize: "var(--fs-base)" }}>
          載入中…
        </div>
      )}

      {tours !== null && selectedId && !selected && (
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>找不到這個研學團，可能已經下架了</div>
          <button onClick={() => setSelectedId(null)} className="btn-ghost" style={{ marginTop: 12 }}>看其他活動</button>
        </div>
      )}

      {tours !== null && selected && (
        <TourDetail
          tour={selected}
          elders={elders}
          displayName={displayName}
          onToursChanged={(next) => (next ? setTours(next) : load())}
          onOpenCertificate={() => setCertificateTourId(selected.id)}
          onPhotoAsk={onPhotoAsk ? () => onPhotoAsk(selected.title, selected.id) : undefined}
        />
      )}

      {tours !== null && !selectedId && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }} role="tablist">
            <button role="tab" aria-selected={view === "list"} onClick={() => setView("list")} style={tabButton(view === "list")}>
              🧭 找活動
            </button>
            <button role="tab" aria-selected={view === "passport"} onClick={() => setView("passport")} style={tabButton(view === "passport")}>
              📘 我的護照
            </button>
          </div>

          {onPhotoAsk && (
            <button
              onClick={() => onPhotoAsk(ongoing?.title)}
              className="card"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 16, textAlign: "left" }}
            >
              <span style={{ fontSize: 32 }} aria-hidden="true">📷</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: "var(--fs-base)", fontWeight: 800 }}>拍照問暖暖</span>
                <span style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>路上看到不懂的，拍給暖暖看</span>
              </span>
            </button>
          )}

          {view === "list" ? (
            <>
              <div style={{
                background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
                borderRadius: "var(--r-lg)", padding: 16, display: "flex", gap: 12, alignItems: "center", marginBottom: 16,
              }}>
                <Mascot size={60} mood="excited" />
                <div style={{ flex: 1, fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
                  跟著暖暖出門走走、學新知！每到一站<strong>掃 QR Code 蓋章</strong>，集滿就能拿結業證書。
                </div>
              </div>
              {upcoming.length === 0 ? (
                <div className="card" style={{ textAlign: "center", color: "var(--ink-2)", fontSize: "var(--fs-base)", lineHeight: 1.6 }}>
                  目前還沒有開放報名的研學團<br />有新活動會放在這裡
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {upcoming.map((t) => (
                    <TourCard key={t.id} tour={t} onOpen={() => setSelectedId(t.id)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <Passport
              tours={passportTours}
              onFindTours={() => setView("list")}
              onOpenTour={(id) => setSelectedId(id)}
              onOpenCertificate={(id) => setCertificateTourId(id)}
            />
          )}
        </>
      )}

      {certificateTour && (
        <Certificate tour={certificateTour} onClose={() => setCertificateTourId(null)} />
      )}
    </SubPage>
  );
}

// ── 活動卡片 ──

function TourCard({ tour, onOpen }: { tour: StudyTourView; onOpen: () => void }) {
  const walking = walkingLevelMeta(tour.walking_level);
  const mine = tour.registrations;
  return (
    <button
      onClick={onOpen}
      className="card"
      style={{ padding: 0, overflow: "hidden", textAlign: "left", width: "100%" }}
    >
      {tour.cover_image_url && (
        <img
          src={tour.cover_image_url}
          alt=""
          loading="lazy"
          style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block", background: "var(--bg-deep)" }}
        />
      )}
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, lineHeight: 1.3 }}>{tour.title}</div>
        {tour.summary && (
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 4 }}>{tour.summary}</div>
        )}
        <div style={{ fontSize: "var(--fs-sm)", marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <div>📅 {formatTourDateRange(tour.starts_at, tour.ends_at)}</div>
          {tour.meeting_point && <div>📍 {tour.meeting_point}</div>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <Chip>{walking.emoji} {walking.label}</Chip>
          <Chip tone={tour.seats_left > 0 ? "good" : "warn"}>{seatsLabel(tour)}</Chip>
          {tour.stops.length > 0 && <Chip>🏮 {tour.stops.length} 站可蓋章</Chip>}
        </div>
        {mine.length > 0 && (
          <div style={{ marginTop: 12, fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)" }}>
            {mine.map((r) => (
              <div key={r.id}>
                {registrationStatusLabel(r)}{r.for_self ? "" : `（幫 ${r.participant_name} 報名）`}
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "good" | "warn" }) {
  const bg = tone === "good" ? "var(--sage-soft)" : tone === "warn" ? "var(--gold-soft)" : "var(--bg-deep)";
  const color = tone === "good" ? "#35613A" : "var(--ink-1)";
  return (
    <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: bg, color }}>
      {children}
    </span>
  );
}

// ── 活動介紹＋報名 ──

function InfoRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 26, lineHeight: 1.2 }} aria-hidden="true">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.5, wordBreak: "break-word" }}>{children}</div>
      </div>
    </div>
  );
}

function TourDetail({
  tour,
  elders,
  displayName,
  onToursChanged,
  onOpenCertificate,
  onPhotoAsk,
}: {
  tour: StudyTourView;
  elders: StudyTourElder[];
  displayName?: string | null;
  onToursChanged: (tours: StudyTourView[] | null) => void;
  onOpenCertificate: () => void;
  onPhotoAsk?: () => void;
}) {
  const toast = useToast();
  const walking = walkingLevelMeta(tour.walking_level);
  const started = hasStarted(tour);
  const own = ownRegistration(tour);
  const [showForm, setShowForm] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // 還可以幫誰報名：自己（還沒報）＋已連結、還沒報名的長輩
  const registeredIds = new Set(tour.registrations.map((r) => r.participant_user_id));
  const candidates: { id: string | null; label: string; name: string }[] = [
    ...(own ? [] : [{ id: null, label: "我自己", name: displayName?.trim() || "" }]),
    ...elders
      .filter((e) => !registeredIds.has(e.id))
      .map((e) => ({ id: e.id, label: `幫 ${e.name} 報名`, name: e.name })),
  ];
  const canRegister = tour.registration_open && candidates.length > 0;

  const share = async () => {
    const url = tourShareUrl(publicAppOrigin(process.env.NEXT_PUBLIC_APP_URL, window.location.origin), tour.id);
    const text = `一起去「${tour.title}」吧！${formatTourDateRange(tour.starts_at, tour.ends_at)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: tour.title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("已複製活動連結，可以貼到 LINE 給朋友");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("分享沒成功，請再試一次");
    }
  };

  const cancel = async (r: StudyTourRegistrationView) => {
    const who = r.for_self ? "" : `${r.participant_name} 的`;
    if (!confirm(`確定要取消${who}報名嗎？\n名額會讓給候補的人`)) return;
    setCancelling(r.id);
    try {
      const res = await api.cancelStudyTourRegistration(r.id);
      trackEvent("study_tour_cancel", { tour: tour.id });
      toast.success("已經取消報名");
      onToursChanged(res.tours);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "取消沒成功，請再試一次");
    }
    setCancelling(null);
  };

  return (
    <div>
      {tour.cover_image_url && (
        <img
          src={tour.cover_image_url}
          alt=""
          style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block", borderRadius: "var(--r-lg)", background: "var(--bg-deep)" }}
        />
      )}
      <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: "16px 0 4px", lineHeight: 1.3 }}>{tour.title}</h2>
      {tour.summary && <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)" }}>{tour.summary}</div>}

      {tour.status === "cancelled" && (
        <div role="alert" style={{
          marginTop: 14, padding: 14, borderRadius: "var(--r-md)", background: "var(--berry-soft)",
          color: "var(--berry)", fontSize: "var(--fs-base)", fontWeight: 800,
        }}>
          這個研學團已經取消了，詳情請聯絡主辦單位
        </div>
      )}

      <div className="card" style={{ padding: "4px 18px", marginTop: 16 }}>
        <InfoRow icon="📅" label="時間">{formatTourDateRange(tour.starts_at, tour.ends_at)}</InfoRow>
        {tour.meeting_point && <InfoRow icon="📍" label="集合地點">{tour.meeting_point}</InfoRow>}
        <InfoRow icon="💰" label="費用">
          {tour.fee_text || "請洽主辦單位"}
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>App 報名不收錢，費用由主辦單位另外收</div>
        </InfoRow>
        <InfoRow icon={walking.emoji} label="走路量">
          {walking.label}
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", marginTop: 2 }}>{walking.desc}</div>
        </InfoRow>
        {tour.accessibility_note && <InfoRow icon="♿" label="貼心提醒">{tour.accessibility_note}</InfoRow>}
        <InfoRow icon="👥" label="名額">
          {seatsLabel(tour)}
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>（共 {tour.capacity} 位）</span>
        </InfoRow>
        {tour.organizer_name && <InfoRow icon="🏢" label="主辦單位">{tour.organizer_name}</InfoRow>}
        {tour.contact_phone && (
          <InfoRow icon="📞" label="聯絡電話">
            <a href={`tel:${tour.contact_phone.replace(/[^0-9+#]/g, "")}`} style={{ color: "var(--primary-deep)", fontWeight: 800 }}>
              {tour.contact_phone}
            </a>
          </InfoRow>
        )}
      </div>

      {tour.description && (
        <>
          <div style={sectionTitle}>活動介紹</div>
          <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{tour.description}</div>
        </>
      )}

      {tour.stops.length > 0 && (
        <>
          <div style={sectionTitle}>這趟會去的地方（每站可以蓋章）</div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {tour.stops.map((s, i) => (
              <li key={s.id} className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 30 }} aria-hidden="true">{s.stamp_emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--fs-base)", fontWeight: 800 }}>
                    第 {i + 1} 站　{s.name}{s.stamped_at ? "　✅" : ""}
                  </div>
                  {s.description && <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2 }}>{s.description}</div>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {/* 我的報名 */}
      {tour.registrations.length > 0 && (
        <>
          <div style={sectionTitle}>我的報名</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tour.registrations.map((r) => (
              <div key={r.id} className="card" style={{
                padding: 16,
                border: `2px solid ${r.status === "confirmed" ? "#B5D2B0" : "var(--gold-soft)"}`,
                background: r.status === "confirmed" ? "linear-gradient(135deg, #EEF6EC 0%, #FFFFFF 100%)" : "linear-gradient(135deg, #FFF8E8 0%, #FFFFFF 100%)",
              }}>
                <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>{registrationStatusLabel(r)}</div>
                <div style={{ fontSize: "var(--fs-sm)", marginTop: 4, lineHeight: 1.6 }}>
                  {r.for_self ? "參加者" : "幫家人報名"}：{r.participant_name}　共 {r.party_size} 位
                  {r.note && <div>備註：{r.note}</div>}
                </div>
                {r.status === "waitlisted" && (
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 6 }}>
                    有人取消會依序遞補，轉正取時會通知你
                  </div>
                )}
                {r.for_self && isPassportComplete(tour) && (
                  <button onClick={onOpenCertificate} className="btn-primary" style={{ width: "100%", marginTop: 12, fontSize: "var(--fs-base)" }}>
                    🎓 看結業證書
                  </button>
                )}
                {!started && tour.status === "published" && (
                  <button
                    onClick={() => cancel(r)}
                    disabled={cancelling === r.id}
                    style={{
                      display: "block", margin: "10px auto 0", padding: "8px 16px", minHeight: 44,
                      color: "var(--ink-2)", fontSize: "var(--fs-sm)", textDecoration: "underline",
                    }}
                  >
                    {cancelling === r.id ? "取消中…" : "取消報名"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 報名 */}
      {tour.status === "published" && !started && (
        <div style={{ marginTop: 24 }}>
          {canRegister ? (
            showForm ? (
              <RegisterForm
                tour={tour}
                candidates={candidates}
                onCancel={() => setShowForm(false)}
                onDone={(tours) => {
                  setShowForm(false);
                  onToursChanged(tours);
                }}
              />
            ) : (
              <button onClick={() => setShowForm(true)} className="btn-primary" style={{ width: "100%" }}>
                {tour.seats_left > 0 ? "✍️ 我要報名" : "✍️ 排候補"}
              </button>
            )
          ) : !tour.registration_open ? (
            <div style={{ textAlign: "center", fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--ink-2)" }}>
              報名已經截止了
            </div>
          ) : null}
        </div>
      )}

      <button onClick={share} className="btn-ghost" style={{ width: "100%", marginTop: 14 }}>
        📤 分享給朋友
      </button>
      {onPhotoAsk && (hasStarted(tour) && !isOver(tour)) && (
        <button onClick={onPhotoAsk} className="btn-ghost" style={{ width: "100%", marginTop: 10 }}>
          📷 拍照問暖暖
        </button>
      )}
    </div>
  );
}

function RegisterForm({
  tour,
  candidates,
  onCancel,
  onDone,
}: {
  tour: StudyTourView;
  candidates: { id: string | null; label: string; name: string }[];
  onCancel: () => void;
  onDone: (tours: StudyTourView[] | null) => void;
}) {
  const toast = useToast();
  const [who, setWho] = useState(0);
  const [name, setName] = useState(candidates[0]?.name ?? "");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pick = (i: number) => {
    setWho(i);
    setName(candidates[i]?.name ?? "");
  };

  const submit = async () => {
    setError("");
    if (!name.trim()) return setError("請填參加者的名字");
    if (phone.replace(/[^0-9]/g, "").length < 8) return setError("請填聯絡電話，主辦單位會用這支電話聯絡");
    setSaving(true);
    try {
      const res = await api.registerStudyTour(tour.id, {
        participant_name: name.trim(),
        participant_phone: phone.trim(),
        party_size: partySize,
        note: note.trim() || undefined,
        for_user_id: candidates[who]?.id ?? undefined,
      });
      trackEvent("study_tour_register", { tour: tour.id, status: res.registration.status });
      if (res.registration.status === "confirmed") toast.success("報名成功！出發前記得準備好");
      else toast.info("目前額滿，已經幫你排候補，有名額會通知你");
      onDone(res.tours);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "報名沒送出去，請再試一次");
    }
    setSaving(false);
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, marginBottom: 4 }}>報名資料</div>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBottom: 12 }}>
        {tour.seats_left > 0 ? seatsLabel(tour) : "目前額滿，送出後會排候補"}
      </div>

      {candidates.length > 1 && (
        <>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, margin: "4px 0 8px" }}>幫誰報名？</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {candidates.map((c, i) => (
              <button key={c.id ?? "self"} onClick={() => pick(i)} aria-pressed={who === i} style={choiceButton(who === i)}>
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, marginBottom: 6 }}>參加者姓名</div>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name" style={inputStyle} />
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, marginBottom: 6 }}>聯絡電話</div>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0912-345-678"
          maxLength={20}
          style={inputStyle}
        />
      </label>

      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, marginBottom: 6 }}>幾個人去？（含本人）</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <button
          onClick={() => setPartySize((n) => Math.max(1, n - 1))}
          disabled={partySize <= 1}
          aria-label="少一位"
          className="btn-ghost"
          style={{ width: 60, minHeight: 60, padding: 0, fontSize: 30, opacity: partySize <= 1 ? 0.4 : 1 }}
        >−</button>
        <div aria-live="polite" style={{ fontSize: "var(--fs-xl)", fontWeight: 800, minWidth: 80, textAlign: "center" }}>
          {partySize} 位
        </div>
        <button
          onClick={() => setPartySize((n) => Math.min(MAX_PARTY_SIZE, n + 1))}
          disabled={partySize >= MAX_PARTY_SIZE}
          aria-label="多一位"
          className="btn-ghost"
          style={{ width: 60, minHeight: 60, padding: 0, fontSize: 30, opacity: partySize >= MAX_PARTY_SIZE ? 0.4 : 1 }}
        >＋</button>
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, marginBottom: 6 }}>備註（可不填）</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="例如：要坐輪椅、吃素、有家人陪同"
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
        />
      </label>

      {error && <div role="alert" style={{ color: "var(--berry)", fontSize: "var(--fs-sm)", fontWeight: 700, marginBottom: 10 }}>{error}</div>}

      <button onClick={submit} disabled={saving} className="btn-primary" style={{ width: "100%" }}>
        {saving ? "送出中…" : tour.seats_left > 0 ? "送出報名" : "送出，排候補"}
      </button>
      <button onClick={onCancel} disabled={saving} className="btn-ghost" style={{ width: "100%", marginTop: 10 }}>
        先不要
      </button>
    </div>
  );
}

// ── 我的研學護照 ──

function Passport({
  tours,
  onFindTours,
  onOpenTour,
  onOpenCertificate,
}: {
  tours: StudyTourView[];
  onFindTours: () => void;
  onOpenTour: (id: string) => void;
  onOpenCertificate: (id: string) => void;
}) {
  const [openFact, setOpenFact] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  if (tours.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48 }} aria-hidden="true">📘</div>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.6, margin: "8px 0 16px" }}>
          還沒有研學護照<br />報名研學團後，這裡會出現你的護照
        </div>
        <button onClick={onFindTours} className="btn-primary" style={{ width: "100%" }}>🧭 去找活動</button>
      </div>
    );
  }

  const speak = (id: string, paragraphs: string[]) => {
    if (speakingId === id) {
      stopGuideSpeech();
      setSpeakingId(null);
      return;
    }
    const ok = speakGuideParagraphs(paragraphs, { onEnd: () => setSpeakingId(null), onError: () => setSpeakingId(null) });
    setSpeakingId(ok ? id : null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        padding: 14, borderRadius: "var(--r-md)", background: "var(--surface-warm)", border: "1px solid var(--gold-soft)",
        fontSize: "var(--fs-sm)", lineHeight: 1.6,
      }}>
        📷 到了每一站，打開<strong>手機相機</strong>對準 QR Code，點跳出來的連結就能蓋章
      </div>

      {tours.map((tour) => {
        const own = ownRegistration(tour)!;
        const { stamped, total } = stampProgress(tour);
        const done = isPassportComplete(tour);
        return (
          <div key={tour.id} className="card" style={{ padding: 16, border: done ? "2px solid var(--gold)" : undefined }}>
            <button onClick={() => onOpenTour(tour.id)} style={{ textAlign: "left", width: "100%" }}>
              <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, lineHeight: 1.3 }}>{tour.title}</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 2 }}>
                {formatTourDay(tour.starts_at)}　{registrationStatusLabel(own)}
                {tour.status === "cancelled" ? "（活動已取消）" : ""}
              </div>
            </button>

            <div style={{ fontSize: "var(--fs-base)", fontWeight: 800, margin: "12px 0 10px", color: done ? "var(--gold)" : "var(--primary-deep)" }}>
              {total === 0 ? "這團還沒設定集章站" : done ? `🎓 已集滿 ${total} 章` : `已集 ${stamped}／${total} 章`}
            </div>

            {total > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {tour.stops.map((s, i) => {
                  const has = Boolean(s.stamped_at);
                  const factOpen = openFact === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => has && setOpenFact(factOpen ? null : s.id)}
                      aria-label={`第 ${i + 1} 站 ${s.name}${has ? "，已蓋章" : "，還沒蓋章"}`}
                      aria-expanded={has ? factOpen : undefined}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: has ? "pointer" : "default" }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 76, height: 76, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: has ? 38 : "var(--fs-lg)", fontWeight: 800,
                          border: has ? "4px double #C0392B" : "3px dashed var(--line-strong)",
                          background: has ? "rgba(192, 57, 43, 0.06)" : "var(--bg)",
                          color: has ? "#C0392B" : "var(--ink-3)",
                          transform: has ? "rotate(-8deg)" : undefined,
                          outline: factOpen ? "3px solid var(--primary)" : undefined,
                        }}
                      >
                        {has ? s.stamp_emoji : i + 1}
                      </span>
                      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textAlign: "center", lineHeight: 1.3, wordBreak: "break-word" }}>
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {tour.stops.map((s) =>
              openFact === s.id && s.stamped_at ? (
                <div key={s.id} style={{ marginTop: 12, padding: 14, borderRadius: "var(--r-md)", background: "var(--surface-warm)" }}>
                  <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--gold)" }}>💡 {s.name}的小知識</div>
                  <div style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, marginTop: 4 }}>
                    {s.fun_fact || s.description || "這一站沒有小知識，下次問問領隊吧！"}
                  </div>
                  {canSpeakGuide() && (s.fun_fact || s.description) && (
                    <button
                      onClick={() => speak(s.id, [s.name, s.fun_fact || s.description])}
                      className="btn-ghost"
                      style={{ width: "100%", marginTop: 10, minHeight: 52, fontSize: "var(--fs-sm)" }}
                    >
                      {speakingId === s.id ? "⏹ 停止" : "🔊 念給我聽"}
                    </button>
                  )}
                </div>
              ) : null
            )}

            {done && (
              <button onClick={() => onOpenCertificate(tour.id)} className="btn-primary" style={{ width: "100%", marginTop: 14, fontSize: "var(--fs-base)" }}>
                🎓 看結業證書
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 結業證書（掛在 body 上，列印時只印證書） ──

function Certificate({ tour, onClose }: { tour: StudyTourView; onClose: () => void }) {
  const own = ownRegistration(tour);
  useEffect(() => {
    document.body.classList.add("printing-certificate");
    return () => document.body.classList.remove("printing-certificate");
  }, []);
  if (!own || !isPassportComplete(tour) || typeof document === "undefined") return null;

  const completedDay = formatCertificateDate(own.completed_at ?? tour.ends_at);
  return createPortal(
    <div
      className="certificate-print-root"
      role="dialog"
      aria-modal="true"
      aria-label="結業證書"
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: "rgba(20, 14, 10, 0.7)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 16, overflowY: "auto",
      }}
    >
      <div
        className="certificate-paper"
        style={{
          width: "100%", maxWidth: 400, background: "#FFFDF7", borderRadius: 8,
          padding: 12, boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          fontFamily: "\"Noto Serif TC\", \"Songti TC\", \"PMingLiU\", serif", color: "#3D2E20",
        }}
      >
        <div style={{ border: "3px double #B8862F", padding: "28px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 42 }} aria-hidden="true">🎓</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 8, margin: "4px 0 18px", color: "#8C5A1B" }}>結業證書</div>
          <div style={{ fontSize: 18, lineHeight: 2 }}>茲證明</div>
          <div style={{ fontSize: 34, fontWeight: 800, margin: "4px 0 8px", borderBottom: "1px solid #D9C4A3", paddingBottom: 6 }}>
            {own.participant_name}
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.9 }}>
            完成「{tour.title}」研學之旅
            {tour.stops.length > 0 && (
              <>
                <br />走訪 {tour.stops.map((s) => s.name).join("、")}
              </>
            )}
            <br />集滿 {tour.stops.length} 枚研學章，特頒此證。
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", margin: "16px 0" }} aria-hidden="true">
            {tour.stops.map((s) => (
              <span key={s.id} style={{
                width: 40, height: 40, borderRadius: "50%", border: "3px double #C0392B",
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, transform: "rotate(-8deg)",
              }}>{s.stamp_emoji}</span>
            ))}
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.8, color: "#6B5848" }}>
            {tour.organizer_name && <div>主辦：{tour.organizer_name}</div>}
            <div>暖暖 55+ 研學護照</div>
            <div>{completedDay}</div>
          </div>
        </div>
      </div>
      <div className="certificate-no-print" style={{ display: "flex", gap: 10, width: "100%", maxWidth: 400, marginTop: 14 }}>
        <button onClick={() => window.print()} className="btn-primary" style={{ flex: 1, fontSize: "var(--fs-base)", padding: "14px 10px" }}>
          🖨️ 列印
        </button>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>關閉</button>
      </div>
      <div className="certificate-no-print" style={{ color: "#fff", fontSize: "var(--fs-xs)", marginTop: 10, textAlign: "center" }}>
        也可以截圖傳給家人
      </div>
    </div>,
    document.body
  );
}
