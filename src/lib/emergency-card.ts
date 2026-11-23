// ────────────────────────────────────────────────
// 緊急聯絡卡（功能 → 健康平安）：血型、過敏、慢性病、目前用藥、緊急聯絡人（最多 3 位）、備註
// 給救護人員或路人看、可以印成小卡放皮夾。不花 AI，也不用新的資料表：
// 存在 profiles.emergency_contact（jsonb；原本只有首頁「求助」按鈕用的 { name, phone }）
//   { name, phone, contacts: [{name, phone}], blood_type, rh_negative, allergies, note }
// name／phone 永遠等於第一位聯絡人（舊版程式只認這兩個欄位）
// ────────────────────────────────────────────────

export const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const EMERGENCY_LIMITS = { contacts: 3, name: 20, phone: 20, allergies: 120, note: 120 } as const;

export interface EmergencyPerson {
  /** 怎麼稱呼，例如「女兒小美」 */
  name: string;
  phone: string;
}

export interface EmergencyInfo {
  contacts: EmergencyPerson[];
  bloodType: BloodType | null;
  rhNegative: boolean;
  allergies: string;
  note: string;
}

/** profiles.emergency_contact 裡的樣子 */
export interface StoredEmergency {
  name: string;
  phone: string;
  contacts?: EmergencyPerson[];
  blood_type?: BloodType | null;
  rh_negative?: boolean;
  allergies?: string;
  note?: string;
}

export const EMPTY_EMERGENCY: EmergencyInfo = { contacts: [], bloodType: null, rhNegative: false, allergies: "", note: "" };

function text(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // 換行、連續空白收成一格：印在小卡上不會亂掉
  return v.replace(/\s+/g, " ").trim().slice(0, max);
}

/** 電話只留數字和 + - # 空格（分機寫 #）；其他字拿掉 */
export function cleanPhone(v: unknown): string {
  if (typeof v !== "string" && typeof v !== "number") return "";
  return String(v).replace(/[^\d+\-# ]/g, "").replace(/\s+/g, " ").trim().slice(0, EMERGENCY_LIMITS.phone);
}

/** 撥號用：至少 3 個數字才給（110、119 也算）；+ 只能在最前面 */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+#]/g, "").replace(/(?!^)\+/g, "");
  return digits.replace(/\D/g, "").length >= 3 ? `tel:${digits}` : null;
}

function person(v: unknown): EmergencyPerson | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const name = text(o.name, EMERGENCY_LIMITS.name);
  const phone = cleanPhone(o.phone);
  return name && telHref(phone) ? { name, phone } : null;
}

function isBloodType(v: unknown): v is BloodType {
  return typeof v === "string" && (BLOOD_TYPES as readonly string[]).includes(v);
}

/** 資料庫裡的（或表單送來的）→ 整理好的；舊資料只有 { name, phone } 也收 */
export function normalizeEmergencyInfo(raw: unknown): EmergencyInfo {
  if (!raw || typeof raw !== "object") return { ...EMPTY_EMERGENCY, contacts: [] };
  const o = raw as Record<string, unknown>;
  const listed = Array.isArray(o.contacts) ? o.contacts.map(person).filter((p): p is EmergencyPerson => p !== null) : null;
  // 沒有 contacts 欄位＝舊資料：第一位就是 name／phone
  const contacts = listed ?? [person(o)].filter((p): p is EmergencyPerson => p !== null);
  // 同一支電話只留一次
  const seen = new Set<string>();
  const unique = contacts.filter((c) => {
    const key = c.phone.replace(/\D/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    contacts: unique.slice(0, EMERGENCY_LIMITS.contacts),
    bloodType: isBloodType(o.blood_type) ? o.blood_type : isBloodType(o.bloodType) ? o.bloodType : null,
    rhNegative: o.rh_negative === true || o.rhNegative === true,
    allergies: text(o.allergies, EMERGENCY_LIMITS.allergies),
    note: text(o.note, EMERGENCY_LIMITS.note),
  };
}

export function isEmergencyEmpty(info: EmergencyInfo): boolean {
  return info.contacts.length === 0 && !info.bloodType && !info.rhNegative && !info.allergies && !info.note;
}

/** 要存進資料庫的樣子；什麼都沒填 → null */
export function toStoredEmergency(info: EmergencyInfo): StoredEmergency | null {
  const clean = normalizeEmergencyInfo({ ...info, blood_type: info.bloodType, rh_negative: info.rhNegative });
  if (isEmergencyEmpty(clean)) return null;
  return {
    name: clean.contacts[0]?.name ?? "",
    phone: clean.contacts[0]?.phone ?? "",
    contacts: clean.contacts,
    blood_type: clean.bloodType,
    rh_negative: clean.rhNegative,
    allergies: clean.allergies,
    note: clean.note,
  };
}

/**
 * 伺服器存檔用：incoming 是用戶端送來的 emergency_contact。
 * 舊版程式（還開著的舊分頁、首頁求助視窗的舊快取）只送 { name, phone }，
 * 直接存會把血型、過敏洗掉 → 這種只換第一位聯絡人，其他照舊
 */
export function mergeEmergencyPatch(existing: unknown, incoming: unknown): StoredEmergency | null {
  if (incoming === null) return null;
  if (!incoming || typeof incoming !== "object") return toStoredEmergency(normalizeEmergencyInfo(existing));
  if (Array.isArray((incoming as Record<string, unknown>).contacts)) return toStoredEmergency(normalizeEmergencyInfo(incoming));
  const current = normalizeEmergencyInfo(existing);
  const first = person(incoming);
  return toStoredEmergency(first ? withPrimaryContact(current, first) : current);
}

/** 換掉第一位聯絡人（首頁「求助」視窗的「修改緊急聯絡人」） */
export function withPrimaryContact(info: EmergencyInfo, first: EmergencyPerson): EmergencyInfo {
  return normalizeEmergencyInfo({
    ...info,
    blood_type: info.bloodType,
    rh_negative: info.rhNegative,
    contacts: [first, ...info.contacts.slice(1)],
  });
}

/** 「A 型」「AB 型（Rh 陰性）」；沒填血型回 null */
export function bloodLabel(info: Pick<EmergencyInfo, "bloodType" | "rhNegative">): string | null {
  if (!info.bloodType) return info.rhNegative ? "Rh 陰性" : null;
  return `${info.bloodType} 型${info.rhNegative ? "（Rh 陰性）" : ""}`;
}

/** 卡片上的用藥：「脈優 5mg」；太多只列前幾種 */
export function medicationLines(
  meds: { name?: string | null; dose?: string | null }[] | null | undefined,
  max = 8
): { lines: string[]; more: number } {
  const all = (meds ?? [])
    .map((m) => [text(m?.name, 30), text(m?.dose, 20)].filter(Boolean).join(" "))
    .filter(Boolean);
  const unique = [...new Set(all)];
  return { lines: unique.slice(0, max), more: Math.max(0, unique.length - max) };
}

/** 表單檢查：聯絡人名字、電話要一起填；回第一個問題（沒問題回 null） */
export function emergencyFormError(rows: { name: string; phone: string }[]): string | null {
  for (const [i, row] of rows.entries()) {
    const name = row.name.trim();
    const phone = row.phone.trim();
    if (!name && !phone) continue;
    const who = `第 ${i + 1} 位聯絡人`;
    if (!name) return `${who}還沒寫怎麼稱呼`;
    if (!telHref(cleanPhone(phone))) return `${who}的電話好像不對，再看一下`;
  }
  return null;
}
