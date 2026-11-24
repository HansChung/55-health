"use client";

// ────────────────────────────────────────────────
// 家人生日：記下家人、朋友的生日（國曆或農曆），3 天前和當天早上 7 點提醒
// 快到的排最前面；7 天內的可以直接做一支祝福影片。不花 AI
// ────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { SubPage } from "@/components/sub-page";
import { api, ApiError, type NotificationSettings } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { enableWebPush, hasWebPushSubscription, isWebPushSupported } from "@/lib/push/client";
import { appointmentDayLabel } from "@/lib/clinic-appointments";
import {
  BIRTHDAY_AHEAD_DAYS,
  BIRTHDAY_MAX,
  BIRTHDAY_NAME_MAX,
  BIRTHDAY_RELATIONS,
  BIRTHDAY_RELATION_MAX,
  BIRTHDAY_REMIND_HOUR,
  adToRoc,
  birthdayDateLabel,
  birthdayWho,
  daysLeftLabel,
  lunarDayName,
  normalizeBirthdayInput,
  rocToAd,
  sortBirthdays,
  type Birthday,
  type BirthdayCalendar,
} from "@/lib/birthdays";

interface Props {
  onBack: () => void;
  /** 做祝福影片（先幫他填好要給誰）；祝福影片關掉了就沒有 */
  onMakeGreeting?: (name: string) => void;
}

interface Draft {
  id: string | null;
  name: string;
  relation: string;
  calendar: BirthdayCalendar;
  month: string;
  day: string;
  /** 民國年（畫面上填的） */
  rocYear: string;
  remind: boolean;
}

const emptyDraft = (): Draft => ({ id: null, name: "", relation: "", calendar: "solar", month: "", day: "", rocYear: "", remind: true });

const LUNAR_MONTH_NAMES = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const SOLAR_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** 7 天內的生日才出現「做祝福影片」 */
const GREETING_DAYS = 7;

const fieldLabel: React.CSSProperties = { display: "block", fontSize: "var(--fs-base)", fontWeight: 800, marginBottom: 8 };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface)", border: "2px solid var(--line-strong)", borderRadius: "var(--r-md)",
  padding: "14px 16px", fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--ink-1)", outline: "none", fontFamily: "inherit",
};
const chip = (on: boolean): React.CSSProperties => ({
  minHeight: 48, padding: "8px 16px", borderRadius: 999, fontSize: "var(--fs-base)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  border: `2px solid ${on ? "var(--primary)" : "var(--line-strong)"}`, background: on ? "var(--primary-soft)" : "var(--surface)", color: "var(--ink-1)",
});

export function BirthdaysScreen({ onBack, onMakeGreeting }: Props) {
  const toast = useToast();
  const [list, setList] = useState<Birthday[] | null>(null);
  /** unavailable＝還沒跑 SQL（503）；failed＝網路等其他問題 */
  const [loadState, setLoadState] = useState<"ok" | "unavailable" | "failed">("ok");
  const [reload, setReload] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 這台手機收得到推播、但還沒打開 */
  const [pushOffer, setPushOffer] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    let alive = true;
    api.listBirthdays()
      .then((r) => {
        if (!alive) return;
        setList(r.birthdays);
        setLoadState("ok");
      })
      .catch((e) => {
        if (!alive) return;
        setList(null);
        setLoadState(e instanceof ApiError && e.status === 503 ? "unavailable" : "failed");
      });
    return () => { alive = false; };
  }, [reload]);

  useEffect(() => {
    let alive = true;
    if (!isWebPushSupported() || Notification.permission === "denied") return;
    hasWebPushSubscription().then((has) => { if (alive) setPushOffer(!has); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  // 清單 ↔ 表單 切換時回到最上面（同一個捲動區）
  const topRef = useRef<HTMLDivElement>(null);
  const editing = draft !== null;
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) topRef.current?.closest(".scroll-area")?.scrollTo({ top: 0 });
    mounted.current = true;
  }, [editing]);

  const enablePush = async () => {
    if (enablingPush) return;
    setEnablingPush(true);
    try {
      await enableWebPush();
      // 「提醒通知」那一頁的開關也跟著打開（notification_settings 是整包覆蓋 → 先讀再合併）
      const { profile } = await api.getProfile();
      const ns: NotificationSettings = { ...(profile.notification_settings ?? {}), web_push: { on: true } };
      await api.updateProfile({ notification_settings: ns });
      setPushOffer(false);
      toast.success("通知打開了，生日快到會提醒你");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "通知沒打開成功，請再試一次");
    }
    setEnablingPush(false);
  };

  const startEdit = (b: Birthday) => {
    setError(null);
    setDraft({
      id: b.id,
      name: b.name,
      relation: b.relation ?? "",
      calendar: b.calendar,
      month: String(b.month),
      day: String(b.day),
      rocYear: b.birth_year ? String(adToRoc(b.birth_year)) : "",
      remind: b.remind,
    });
  };

  const save = async () => {
    if (!draft || busy) return;
    let birthYear: number | null = null;
    if (draft.rocYear.trim()) {
      const roc = Number(draft.rocYear);
      if (!Number.isInteger(roc) || roc < 1) return setError("民國幾年請填數字，例如 45；不知道可以不填");
      birthYear = rocToAd(roc);
    }
    const parsed = normalizeBirthdayInput({ name: draft.name, relation: draft.relation, calendar: draft.calendar, month: draft.month, day: draft.day, birthYear, remind: draft.remind });
    if (!parsed.ok) return setError(parsed.error);
    setBusy(true);
    setError(null);
    try {
      const { birthday } = draft.id ? await api.updateBirthday(draft.id, parsed.value) : await api.createBirthday(parsed.value);
      setList((l) => sortBirthdays([...(l ?? []).filter((x) => x.id !== birthday.id), birthday]));
      setDraft(null);
      toast.success(`記好了：${birthdayWho(birthday)}${birthday.next ? `，${daysLeftLabel(birthday.next.days)}生日` : ""}`);
    } catch (e) {
      setError(e instanceof ApiError && !e.isNetwork ? e.message : "沒存成功，請檢查網路再試一次");
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!draft?.id || busy || !confirm(`刪掉${draft.name}的生日？`)) return;
    setBusy(true);
    try {
      await api.deleteBirthday(draft.id);
      setList((l) => (l ?? []).filter((x) => x.id !== draft.id));
      setDraft(null);
    } catch (e) {
      setError(e instanceof ApiError && !e.isNetwork ? e.message : "刪除沒成功，請再試一次");
    }
    setBusy(false);
  };

  if (draft) {
    const lunar = draft.calendar === "lunar";
    const maxDay = lunar ? 30 : draft.month ? SOLAR_DAYS[Number(draft.month) - 1] : 31;
    const setCalendar = (calendar: BirthdayCalendar) => setDraft({ ...draft, calendar, day: calendar === "lunar" && Number(draft.day) > 30 ? "" : draft.day });
    const setMonth = (month: string) => {
      const max = lunar ? 30 : month ? SOLAR_DAYS[Number(month) - 1] : 31;
      setDraft({ ...draft, month, day: Number(draft.day) > max ? "" : draft.day });
    };
    const customRelation = draft.relation !== "" && !BIRTHDAY_RELATIONS.includes(draft.relation);
    return (
      <SubPage title={draft.id ? "改生日" : "新增生日"} onBack={() => setDraft(null)}>
        <div ref={topRef} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <label htmlFor="birthday-name" style={fieldLabel}>① 誰的生日？</label>
            <input
              id="birthday-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: [...e.target.value].slice(0, BIRTHDAY_NAME_MAX).join("") })}
              placeholder="名字或稱呼，例如：小美"
              autoComplete="off"
              style={inputStyle}
            />
          </div>

          <div>
            <div style={fieldLabel}>② 是你的誰？<span style={{ fontWeight: 600, color: "var(--ink-2)" }}>（可以不選）</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BIRTHDAY_RELATIONS.map((r) => (
                <button key={r} type="button" aria-pressed={draft.relation === r} style={chip(draft.relation === r)} onClick={() => setDraft({ ...draft, relation: draft.relation === r ? "" : r })}>
                  {r}
                </button>
              ))}
            </div>
            <input
              aria-label="其他關係"
              value={customRelation ? draft.relation : ""}
              onChange={(e) => setDraft({ ...draft, relation: [...e.target.value].slice(0, BIRTHDAY_RELATION_MAX).join("") })}
              placeholder="自己寫，例如：老同學"
              autoComplete="off"
              style={{ ...inputStyle, marginTop: 10 }}
            />
          </div>

          <div>
            <div style={fieldLabel}>③ 生日是哪一天？</div>
            <div role="radiogroup" aria-label="國曆或農曆" style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {([["solar", "國曆"], ["lunar", "農曆"]] as const).map(([id, label]) => (
                <button key={id} type="button" role="radio" aria-checked={draft.calendar === id} style={{ ...chip(draft.calendar === id), flex: 1 }} onClick={() => setCalendar(id)}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select aria-label="幾月" value={draft.month} onChange={(e) => setMonth(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }}>
                <option value="">幾月</option>
                {LUNAR_MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1}>{lunar ? name : `${i + 1} 月`}</option>
                ))}
              </select>
              <select aria-label="幾號" value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: 0 }}>
                <option value="">{lunar ? "初幾" : "幾號"}</option>
                {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{lunar ? lunarDayName(d) : `${d} 號`}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 8, lineHeight: 1.5 }}>
              {lunar ? "過農曆生日的選農曆，暖暖每年會幫你換算成國曆的日子" : "身分證上的生日是國曆"}
            </div>
          </div>

          <div>
            <label htmlFor="birthday-year" style={fieldLabel}>④ 民國幾年生的？<span style={{ fontWeight: 600, color: "var(--ink-2)" }}>（可以不填）</span></label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>民國</span>
              <input
                id="birthday-year"
                inputMode="numeric"
                value={draft.rocYear}
                onChange={(e) => setDraft({ ...draft, rocYear: e.target.value.normalize("NFKC").replace(/\D/g, "").slice(0, 3) })}
                placeholder="例如 70"
                autoComplete="off"
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
              <span style={{ fontWeight: 700, flexShrink: 0 }}>年</span>
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginTop: 8, lineHeight: 1.5 }}>有填的話，提醒時會告訴你這次是幾歲生日</div>
          </div>

          <label style={{ display: "flex", gap: 12, alignItems: "center", fontWeight: 700, minHeight: 48, cursor: "pointer", lineHeight: 1.4 }}>
            <input type="checkbox" checked={draft.remind} onChange={(e) => setDraft({ ...draft, remind: e.target.checked })} style={{ width: 26, height: 26, flexShrink: 0 }} />
            生日前 {BIRTHDAY_AHEAD_DAYS} 天和當天早上提醒我
          </label>

          {error && (
            <div role="alert" style={{ padding: 12, background: "var(--berry-soft)", borderRadius: 12, color: "#9B2F44", fontSize: "var(--fs-sm)", fontWeight: 700 }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={save} disabled={busy}>
              {busy ? "儲存中…" : "記下來"}
            </button>
            <button type="button" className="btn-ghost" style={{ width: "100%" }} onClick={() => setDraft(null)} disabled={busy}>取消</button>
            {draft.id && (
              <button type="button" className="btn-ghost" style={{ width: "100%", color: "#9B2F44" }} onClick={remove} disabled={busy}>🗑️ 刪掉這筆生日</button>
            )}
          </div>
        </div>
      </SubPage>
    );
  }

  const full = (list?.length ?? 0) >= BIRTHDAY_MAX;
  return (
    <SubPage title="家人生日" onBack={onBack}>
      <div ref={topRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", lineHeight: 1.6 }}>
          記下家人、朋友的生日，生日前 {BIRTHDAY_AHEAD_DAYS} 天和當天早上 {BIRTHDAY_REMIND_HOUR} 點提醒你。國曆、農曆都可以。
        </div>

        {loadState === "unavailable" ? (
          <div className="card" style={{ padding: 20, textAlign: "center", color: "var(--ink-2)", lineHeight: 1.6 }}>生日提醒還在準備中，過幾天再來看看</div>
        ) : loadState === "failed" ? (
          <div className="card" style={{ padding: 20, textAlign: "center", color: "var(--ink-2)" }}>
            沒載入成功，請檢查網路
            <button type="button" className="btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => { setLoadState("ok"); setReload((n) => n + 1); }}>🔄 再試一次</button>
          </div>
        ) : list === null ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-2)" }}>讀取中…</div>
        ) : (
          <>
            {pushOffer && list.length > 0 && (
              <div className="card" style={{ padding: 16, background: "var(--gold-soft, #FFF6E0)", border: "1px solid #EBD49A" }}>
                <div style={{ fontWeight: 800, lineHeight: 1.4 }}>🔔 這台手機還沒打開通知</div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5, margin: "4px 0 12px" }}>打開之後，生日快到暖暖才能提醒你</div>
                <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={enablePush} disabled={enablingPush}>
                  {enablingPush ? "打開中…" : "打開通知"}
                </button>
              </div>
            )}

            <button type="button" className="btn-primary" style={{ width: "100%", minHeight: 60 }} onClick={() => { setError(null); setDraft(emptyDraft()); }} disabled={full}>
              ➕ 新增生日
            </button>
            {full && <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", textAlign: "center" }}>最多記 {BIRTHDAY_MAX} 個人，先刪掉用不到的</div>}

            {list.length === 0 ? (
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 48, lineHeight: 1 }} aria-hidden="true">🎂</div>
                <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)", marginTop: 10 }}>還沒有記任何生日</div>
                <div style={{ color: "var(--ink-2)", fontSize: "var(--fs-sm)", lineHeight: 1.6, marginTop: 6 }}>先記孩子、孫子的生日，到時候暖暖會提醒你打電話、包紅包</div>
              </div>
            ) : (
              list.map((b) => {
                const next = b.next;
                const soon = next !== null && next.days <= BIRTHDAY_AHEAD_DAYS;
                return (
                  <div key={b.id} className="card" style={{ padding: 16, border: `1px solid ${soon ? "#F0CF9B" : "var(--line)"}`, background: soon ? "#FFF6E6" : undefined }}>
                    {/* 第一列：名字＋「改」；日期放下一列用整個寬度（不然被按鈕擠到斷行） */}
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 32, lineHeight: 1.1, flexShrink: 0 }} aria-hidden="true">🎂</span>
                      <div style={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: "var(--fs-lg)", lineHeight: 1.3, overflowWrap: "anywhere" }}>{birthdayWho(b)}</div>
                      <button type="button" onClick={() => startEdit(b)} className="btn-ghost" style={{ minHeight: 48, padding: "4px 14px", flexShrink: 0 }} aria-label={`修改${b.name}的生日`}>✏️ 改</button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 12, marginTop: 8 }}>
                      <span style={{ whiteSpace: "nowrap", fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.5 }}>{birthdayDateLabel(b)}</span>
                      {next && <span style={{ whiteSpace: "nowrap", fontSize: "var(--fs-base)", fontWeight: 800, lineHeight: 1.5, color: soon ? "#A85B00" : "var(--ink-2)" }}>{daysLeftLabel(next.days)}</span>}
                    </div>
                    {next ? (
                      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 12, fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
                        <span style={{ whiteSpace: "nowrap" }}>{b.calendar === "lunar" ? "國曆 " : ""}{appointmentDayLabel(next.date)}</span>
                        {next.age !== null && <span style={{ whiteSpace: "nowrap" }}>{next.age} 歲生日</span>}
                        {!b.remind && <span style={{ whiteSpace: "nowrap" }}>不提醒</span>}
                      </div>
                    ) : (
                      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>算不出下一次是哪一天</div>
                    )}
                    {onMakeGreeting && next !== null && next.days <= GREETING_DAYS && (
                      <button type="button" className="btn-ghost" style={{ width: "100%", marginTop: 12, minHeight: 52 }} onClick={() => onMakeGreeting(b.name)}>
                        🎁 做祝福影片
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </SubPage>
  );
}
