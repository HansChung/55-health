"use client";

// 後台：研學團（活動、站點＋QR 集章、報名名單）
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  STAMP_EMOJIS,
  WALKING_LEVELS,
  formatTourDateRange,
  isoToTaipeiInput,
  taipeiInputToIso,
  type AdminStudyTour,
  type AdminStudyTourRegistration,
  type AdminStudyTourStop,
  type StudyTourRow,
  type StudyTourStatus,
  csvCell,
} from "@/lib/study-tours";

const STATUS_LABELS: Record<StudyTourStatus, { label: string; color: string }> = {
  draft: { label: "草稿（長輩看不到）", color: "#fcd34d" },
  published: { label: "已發布", color: "#6ee7b7" },
  cancelled: { label: "已取消", color: "#fecaca" },
};

export default function StudyToursAdminPage() {
  const [tours, setTours] = useState<AdminStudyTour[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminStudyTour | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { tours } = await api.adminListStudyTours();
      setTours(tours);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPeople = tours.reduce((s, t) => s + t.counts.confirmed_people, 0);
  const totalWaiting = tours.reduce((s, t) => s + t.counts.waitlisted_people, 0);
  const totalCompleted = tours.reduce((s, t) => s + t.counts.completed, 0);

  const setStatus = async (tour: AdminStudyTour, status: StudyTourStatus) => {
    if (status === "cancelled" && !confirm(`確定取消「${tour.title}」？已報名的人會收到取消通知。`)) return;
    try {
      await api.adminUpdateStudyTour(tour.id, { status });
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (tour: AdminStudyTour) => {
    if (!confirm(`確定刪除「${tour.title}」？站點與 QR 也會一起刪掉。`)) return;
    try {
      await api.adminDeleteStudyTour(tour.id);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>研學團</h1>
        <button onClick={() => { setEditing(null); setShowForm(!showForm); }} style={primaryButton}>
          {showForm ? "取消" : "+ 新增研學團"}
        </button>
      </div>

      <div style={{ background: "#1e3a8a", padding: 16, borderRadius: 8, color: "#dbeafe", fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
        報名只登記、不收費（費用只顯示文字，由主辦單位另外收）。名額滿了自動排候補，有人取消會依序遞補並推播通知。<br />
        每一站會自動產生專屬 QR Code：按「列印 QR」印出來貼在現場，長輩用手機相機掃了就蓋章。管理員掃碼不受活動時間限制，可以先測試。
      </div>

      {error && <div style={{ color: "#fecaca", marginBottom: 12 }}>錯誤：{error}</div>}
      {showForm && (
        <TourForm
          key={editing?.id ?? "new"}
          initial={editing}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSaved={(saved) => {
            setShowForm(false);
            setEditing(null);
            if (saved) setExpanded(saved.id);
            load();
          }}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="研學團" value={`${tours.length}`} hint={`已發布 ${tours.filter((t) => t.status === "published").length} 個`} />
        <StatCard label="正取人數" value={`${totalPeople}`} hint="含同行家人" />
        <StatCard label="候補人數" value={`${totalWaiting}`} hint="有名額會自動遞補" />
        <StatCard label="結業人數" value={`${totalCompleted}`} hint="集滿所有章" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tours.map((tour) => {
          const status = STATUS_LABELS[tour.status];
          const open = expanded === tour.id;
          return (
            <div key={tour.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", gap: 16 }}>
                {tour.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tour.cover_image_url} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 120, height: 80, borderRadius: 8, flexShrink: 0, background: "#0f172a", border: "1px dashed #334155", color: "#64748b", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    尚無封面
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: status.color }}>{status.label}</span>
                    {tour.organizer_name && <span style={{ color: "#94a3b8" }}>{tour.organizer_name}</span>}
                  </div>
                  <div style={{ fontSize: 18, color: "#fff", fontWeight: 700 }}>{tour.title}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                    {formatTourDateRange(tour.starts_at, tour.ends_at)}{tour.meeting_point ? `　·　${tour.meeting_point}` : ""}
                  </div>
                  <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span>正取 {tour.counts.confirmed_people}／{tour.capacity} 人</span>
                    <span>候補 {tour.counts.waitlisted_people} 人</span>
                    <span>站點 {tour.counts.stops} 站</span>
                    <span>結業 {tour.counts.completed} 人</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 150 }}>
                  <button onClick={() => setExpanded(open ? null : tour.id)} style={{ ...smallButton, color: "#bfdbfe", borderColor: "#1e3a8a" }}>
                    {open ? "收起" : "站點與報名名單"}
                  </button>
                  <Link href={`/admin/study-tours/${tour.id}/qr`} target="_blank" style={{ ...smallButton, textAlign: "center", textDecoration: "none" }}>
                    🖨️ 列印 QR
                  </Link>
                  <button onClick={() => { setEditing(tour); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={smallButton}>
                    編輯活動
                  </button>
                  {tour.status === "draft" && <button onClick={() => setStatus(tour, "published")} style={{ ...smallButton, color: "#6ee7b7" }}>發布</button>}
                  {tour.status === "published" && <button onClick={() => setStatus(tour, "draft")} style={smallButton}>改回草稿</button>}
                  {tour.status !== "cancelled" && (
                    <button onClick={() => setStatus(tour, "cancelled")} style={{ ...smallButton, color: "#fecaca", borderColor: "#7f1d1d" }}>取消活動</button>
                  )}
                  {tour.status === "cancelled" && <button onClick={() => setStatus(tour, "published")} style={smallButton}>恢復發布</button>}
                  <button onClick={() => remove(tour)} style={{ ...smallButton, color: "#fecaca", borderColor: "#7f1d1d" }}>刪除</button>
                </div>
              </div>
              {open && <TourDetailPanel tourId={tour.id} onChanged={load} />}
            </div>
          );
        })}
        {tours.length === 0 && !error && (
          <div style={{ padding: 32, color: "#64748b", textAlign: "center", background: "#1e293b", borderRadius: 12 }}>
            尚未建立研學團
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, color: "#fff", fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{hint}</div>
    </div>
  );
}

// ── 新增／編輯活動 ──

function TourForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: AdminStudyTour | null;
  onSaved: (tour: StudyTourRow | null) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [organizer, setOrganizer] = useState(initial?.organizer_name ?? "");
  const [cover, setCover] = useState(initial?.cover_image_url ?? "");
  const [startsAt, setStartsAt] = useState(isoToTaipeiInput(initial?.starts_at));
  const [endsAt, setEndsAt] = useState(isoToTaipeiInput(initial?.ends_at));
  const [deadline, setDeadline] = useState(isoToTaipeiInput(initial?.registration_deadline));
  const [meetingPoint, setMeetingPoint] = useState(initial?.meeting_point ?? "");
  const [fee, setFee] = useState(initial?.fee_text ?? "");
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 20));
  const [walking, setWalking] = useState(String(initial?.walking_level ?? 1));
  const [accessibility, setAccessibility] = useState(initial?.accessibility_note ?? "");
  const [phone, setPhone] = useState(initial?.contact_phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    const starts = taipeiInputToIso(startsAt);
    const ends = taipeiInputToIso(endsAt);
    if (!starts || !ends) return setError("請填出發與結束時間");
    const deadlineIso = deadline ? taipeiInputToIso(deadline) : null;
    if (deadline && !deadlineIso) return setError("報名截止時間格式不對");
    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap < 1 || cap > 500) return setError("名額要是 1～500 的整數");

    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      description: description.trim(),
      organizer_name: organizer.trim(),
      cover_image_url: cover.trim(),
      starts_at: starts,
      ends_at: ends,
      registration_deadline: deadlineIso,
      meeting_point: meetingPoint.trim(),
      fee_text: fee.trim(),
      capacity: cap,
      walking_level: Number(walking),
      accessibility_note: accessibility.trim(),
      contact_phone: phone.trim(),
    };
    setSaving(true);
    try {
      const res = initial
        ? await api.adminUpdateStudyTour(initial.id, payload)
        : await api.adminCreateStudyTour(payload);
      onSaved(res.tour);
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  };

  return (
    <div style={{ background: "#1e293b", padding: 20, borderRadius: 12, border: "1px solid #334155", marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ gridColumn: "span 2", fontSize: 15, fontWeight: 700, color: "#fff" }}>
        {initial ? `編輯：${initial.title}` : "新增研學團（先存成草稿，站點設定好再發布）"}
      </div>
      <Field label="活動名稱">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="鹿港老街文化小旅行" style={inputStyle} />
      </Field>
      <Field label="主辦單位">
        <input value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="某某旅行社" style={inputStyle} />
      </Field>
      <Field label="一句話簡介（列表上顯示）" wide>
        <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="走訪百年古蹟，聽在地人說故事" style={inputStyle} />
      </Field>
      <Field label="封面圖片（建議橫式 16:9）" wide>
        <ImageUploadField value={cover} onChange={setCover} folder="tours" hint="JPG／PNG／WebP，大圖會自動縮小" />
      </Field>
      <Field label="出發時間（台灣時間）">
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="結束時間">
        <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="報名截止（空白＝出發前都能報）">
        <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="名額（人，含同行家人）">
        <input type="number" min={1} max={500} value={capacity} onChange={(e) => setCapacity(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="集合地點" wide>
        <input value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} placeholder="彰化火車站前站 7-11 門口" style={inputStyle} />
      </Field>
      <Field label="費用說明（只顯示，不線上收費）">
        <input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="每人 NT$980（含午餐、保險）" style={inputStyle} />
      </Field>
      <Field label="聯絡電話">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04-1234-5678" style={inputStyle} />
      </Field>
      <Field label="走路量">
        <select value={walking} onChange={(e) => setWalking(e.target.value)} style={inputStyle}>
          {WALKING_LEVELS.map((w) => (
            <option key={w.level} value={w.level}>{w.emoji} {w.label}：{w.desc}</option>
          ))}
        </select>
      </Field>
      <Field label="貼心提醒（無障礙、廁所、要帶什麼）">
        <input value={accessibility} onChange={(e) => setAccessibility(e.target.value)} placeholder="全程有無障礙坡道，可推輪椅；請帶水壺與帽子" style={inputStyle} />
      </Field>
      <Field label="活動介紹" wide>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="行程、午餐、會學到什麼…" style={{ ...inputStyle, minHeight: 120 }} />
      </Field>
      {error && <div style={{ gridColumn: "span 2", color: "#fecaca", fontSize: 13 }}>{error}</div>}
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={onCancel} style={{ ...primaryButton, background: "transparent", border: "1px solid #334155", color: "#cbd5e1" }}>取消</button>
        <button onClick={save} disabled={saving || !title.trim()} style={primaryButton}>
          {saving ? "儲存中…" : initial ? "儲存修改" : "建立草稿"}
        </button>
      </div>
    </div>
  );
}

// ── 站點＋報名名單 ──

function TourDetailPanel({ tourId, onChanged }: { tourId: string; onChanged: () => void }) {
  const [tour, setTour] = useState<StudyTourRow | null>(null);
  const [stops, setStops] = useState<AdminStudyTourStop[]>([]);
  const [regs, setRegs] = useState<AdminStudyTourRegistration[]>([]);
  const [editingStop, setEditingStop] = useState<AdminStudyTourStop | "new" | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.adminGetStudyTour(tourId);
      setTour(data.tour);
      setStops(data.stops);
      setRegs(data.registrations);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tourId]);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { load(); onChanged(); };

  const move = async (stop: AdminStudyTourStop, dir: -1 | 1) => {
    const idx = stops.findIndex((s) => s.id === stop.id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= stops.length) return;
    // 交換後整排重新編號 1、2、3…，只更新有變的站
    const order = [...stops];
    [order[idx], order[j]] = [order[j], order[idx]];
    const changes = order.map((s, i) => ({ s, pos: i + 1 })).filter(({ s, pos }) => s.position !== pos);
    try {
      await Promise.all(changes.map(({ s, pos }) => api.adminUpdateStudyTourStop(tourId, s.id, { position: pos })));
    } catch (e) {
      alert((e as Error).message);
    }
    load();
  };

  const regenerate = async (stop: AdminStudyTourStop) => {
    if (!confirm(`「${stop.name}」換一組新的 QR？舊的 QR 會立刻失效，要重新列印。`)) return;
    try {
      await api.adminUpdateStudyTourStop(tourId, stop.id, { regenerate_token: true });
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const removeStop = async (stop: AdminStudyTourStop) => {
    const warn = stop.stamp_count > 0 ? `已經有 ${stop.stamp_count} 人在這站蓋過章，刪除後章也會消失。` : "";
    if (!confirm(`刪除站點「${stop.name}」？${warn}`)) return;
    try {
      await api.adminDeleteStudyTourStop(tourId, stop.id);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const cancelReg = async (reg: AdminStudyTourRegistration) => {
    if (!confirm(`取消 ${reg.participant_name} 的報名？空出的名額會自動遞補候補。`)) return;
    try {
      const res = await api.adminCancelStudyTourRegistration(tourId, reg.id);
      if (res.promoted > 0) alert(`已取消，並有 ${res.promoted} 組候補轉正取（已推播通知）`);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const exportCsv = () => {
    if (!tour) return;
    const header = ["狀態", "姓名", "電話", "人數", "備註", "來源", "集章", "結業", "報名時間"];
    const rows = regs
      .filter((r) => showCancelled || r.status !== "cancelled")
      .map((r) => [
        REG_STATUS[r.status],
        r.participant_name,
        r.participant_phone,
        String(r.party_size),
        r.note,
        sourceLabel(r),
        `${r.stamp_count}/${stops.length}`,
        r.completed_at ? "是" : "",
        new Date(r.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
      ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    // 加 BOM，Excel 打開中文才不會亂碼
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tour.title}-報名名單.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleRegs = regs.filter((r) => showCancelled || r.status !== "cancelled");

  return (
    <div style={{ marginTop: 16, borderTop: "1px solid #334155", paddingTop: 16 }}>
      {error && <div style={{ color: "#fecaca", marginBottom: 12 }}>錯誤：{error}</div>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>集章站點（{stops.length} 站）</div>
        <button onClick={() => setEditingStop(editingStop === "new" ? null : "new")} style={{ ...primaryButton, padding: "6px 12px", fontSize: 13 }}>
          {editingStop === "new" ? "取消" : "+ 新增站點"}
        </button>
      </div>

      {editingStop === "new" && (
        <StopForm tourId={tourId} initial={null} onDone={() => { setEditingStop(null); refresh(); }} onCancel={() => setEditingStop(null)} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {stops.map((stop, i) => (
          <div key={stop.id}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#0f172a", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 28 }}>{stop.stamp_emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700 }}>第 {i + 1} 站　{stop.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                  {stop.description || "（沒有介紹）"}　·　小知識：{stop.fun_fact ? stop.fun_fact.slice(0, 40) + (stop.fun_fact.length > 40 ? "…" : "") : "（沒有）"}
                </div>
                <div style={{ color: "#6ee7b7", fontSize: 12, marginTop: 2 }}>已有 {stop.stamp_count} 人蓋章</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 300 }}>
                <button onClick={() => move(stop, -1)} disabled={i === 0} style={tinyButton}>↑</button>
                <button onClick={() => move(stop, 1)} disabled={i === stops.length - 1} style={tinyButton}>↓</button>
                <button onClick={() => setEditingStop(editingStop !== "new" && editingStop?.id === stop.id ? null : stop)} style={tinyButton}>編輯</button>
                <button onClick={() => regenerate(stop)} style={tinyButton}>換 QR</button>
                <button onClick={() => removeStop(stop)} style={{ ...tinyButton, color: "#fecaca", borderColor: "#7f1d1d" }}>刪除</button>
              </div>
            </div>
            {editingStop !== "new" && editingStop?.id === stop.id && (
              <StopForm tourId={tourId} initial={stop} onDone={() => { setEditingStop(null); refresh(); }} onCancel={() => setEditingStop(null)} />
            )}
          </div>
        ))}
        {stops.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>還沒有站點。每一站會有一張 QR Code，長輩掃了就蓋章。</div>}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>報名名單（{regs.filter((r) => r.status !== "cancelled").length} 組）</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
            顯示已取消
          </label>
          <button onClick={exportCsv} disabled={regs.length === 0} style={{ ...tinyButton, padding: "6px 12px" }}>⬇️ 匯出 CSV</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "#94a3b8", textAlign: "left" }}>
              {["狀態", "姓名", "電話", "人數", "備註", "來源", "集章", "報名時間", ""].map((h) => (
                <th key={h} style={{ padding: "6px 8px", borderBottom: "1px solid #334155", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRegs.map((r) => (
              <tr key={r.id} style={{ color: r.status === "cancelled" ? "#64748b" : "#e2e8f0" }}>
                <td style={cell}>
                  <span style={{ color: r.status === "confirmed" ? "#6ee7b7" : r.status === "waitlisted" ? "#fcd34d" : "#64748b" }}>{REG_STATUS[r.status]}</span>
                </td>
                <td style={cell}>{r.participant_name}</td>
                <td style={cell}>{r.participant_phone || "—"}</td>
                <td style={cell}>{r.party_size}</td>
                <td style={{ ...cell, maxWidth: 200 }}>{r.note || "—"}</td>
                <td style={cell}>{sourceLabel(r)}</td>
                <td style={cell}>{r.stamp_count}/{stops.length}{r.completed_at ? " 🎓" : ""}</td>
                <td style={cell}>{new Date(r.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td style={cell}>
                  {r.status !== "cancelled" && (
                    <button onClick={() => cancelReg(r)} style={{ ...tinyButton, color: "#fecaca", borderColor: "#7f1d1d" }}>取消</button>
                  )}
                </td>
              </tr>
            ))}
            {visibleRegs.length === 0 && (
              <tr><td colSpan={9} style={{ ...cell, color: "#64748b", textAlign: "center" }}>還沒有人報名</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StopForm({
  tourId,
  initial,
  onDone,
  onCancel,
}: {
  tourId: string;
  initial: AdminStudyTourStop | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.stamp_emoji ?? STAMP_EMOJIS[0]);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [funFact, setFunFact] = useState(initial?.fun_fact ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    const payload = { name: name.trim(), stamp_emoji: emoji, description: description.trim(), fun_fact: funFact.trim() };
    try {
      if (initial) await api.adminUpdateStudyTourStop(tourId, initial.id, payload);
      else await api.adminCreateStudyTourStop(tourId, payload);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  };

  return (
    <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 14, margin: "8px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Field label="站名">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="龍山寺" style={inputStyle} />
      </Field>
      <Field label="印章圖案">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {STAMP_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => setEmoji(e)} style={{
              width: 36, height: 36, fontSize: 20, borderRadius: 8, cursor: "pointer",
              border: `2px solid ${emoji === e ? "#3b82f6" : "#334155"}`, background: emoji === e ? "#1e3a8a" : "transparent",
            }}>{e}</button>
          ))}
        </div>
      </Field>
      <Field label="簡短介紹（活動頁顯示）" wide>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="清朝乾隆年間建的古剎，木雕很精彩" style={inputStyle} />
      </Field>
      <Field label="小知識（蓋章後才看得到，可以念給長輩聽）" wide>
        <textarea value={funFact} onChange={(e) => setFunFact(e.target.value)} placeholder="龍山寺的戲台藻井是用上百塊木頭卡榫組成，一根釘子都沒用！" style={{ ...inputStyle, minHeight: 70 }} />
      </Field>
      {error && <div style={{ gridColumn: "span 2", color: "#fecaca", fontSize: 13 }}>{error}</div>}
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={onCancel} style={{ ...primaryButton, padding: "6px 12px", fontSize: 13, background: "transparent", border: "1px solid #334155", color: "#cbd5e1" }}>取消</button>
        <button onClick={save} disabled={saving || !name.trim()} style={{ ...primaryButton, padding: "6px 12px", fontSize: 13 }}>
          {saving ? "儲存中…" : initial ? "儲存站點" : "新增站點"}
        </button>
      </div>
    </div>
  );
}

const REG_STATUS: Record<AdminStudyTourRegistration["status"], string> = {
  confirmed: "正取",
  waitlisted: "候補",
  cancelled: "已取消",
};

function sourceLabel(r: AdminStudyTourRegistration) {
  if (r.source === "onsite") return "現場掃碼";
  return r.registered_by_family ? "家人代報" : "App";
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? "span 2" : undefined }}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#0f172a", color: "#fff",
  border: "1px solid #334155", padding: "8px 12px",
  borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box",
};

const primaryButton: React.CSSProperties = {
  background: "#3b82f6", color: "#fff", border: "none",
  padding: "10px 16px", borderRadius: 8, fontWeight: 600,
  cursor: "pointer", fontSize: 14,
};

const smallButton: React.CSSProperties = {
  width: "100%", padding: "7px 10px", borderRadius: 8,
  border: "1px solid #334155", background: "transparent",
  color: "#cbd5e1", cursor: "pointer", fontSize: 13, boxSizing: "border-box",
};

const tinyButton: React.CSSProperties = {
  padding: "4px 8px", borderRadius: 6, border: "1px solid #334155",
  background: "transparent", color: "#cbd5e1", cursor: "pointer", fontSize: 12,
};

const cell: React.CSSProperties = { padding: "8px", borderBottom: "1px solid #1e293b", verticalAlign: "top" };
