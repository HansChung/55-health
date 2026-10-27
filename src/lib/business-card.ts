// ────────────────────────────────────────────────
// 數位名片（前後端共用）：欄位上限、檢查輸入、分享頁連結、電話／LINE 連結、存到通訊錄（vCard）
// 聯絡方式預設不公開；公開的版本（PublicBusinessCard）只帶長輩打開的那幾項
// ────────────────────────────────────────────────

import { BOOK_PART_PALETTES, type BookPartPalette } from "./book-palette";

export const CARD_LIMITS = { display_name: 20, nickname: 20, intro: 100, interests: 60, phone: 20, line_id: 80, email: 80 } as const;
export const CARD_WORKS_MAX = 3;

/** 名片配色：band 上方色帶、deep 文字（白底對比 ≥ 4.5）、soft 照片底色、chip 興趣標籤底色、paper 分享頁底色、swatch 選色按鈕 */
export interface CardTheme {
  id: string;
  label: string;
  band: string;
  deep: string;
  soft: string;
  chip: string;
  paper: string;
  swatch: string;
}

/** 書本四部的顏色也拿來當名片配色（跟書一致） */
function bookTheme(id: string, label: string, p: BookPartPalette): CardTheme {
  return { id, label, band: `linear-gradient(135deg, ${p.main} 0%, ${p.soft} 100%)`, deep: p.deep, soft: p.soft, chip: p.soft, paper: p.paper, swatch: p.main };
}

export const CARD_THEMES = [
  // 第一個是預設（＝原本的樣子）
  { id: "warm", label: "暖橘", band: "linear-gradient(135deg, #F6C7A6 0%, #F3DDB5 60%, #DDE8CF 100%)", deep: "#B5532E", soft: "#FBE6D4", chip: "#DCEBD8", paper: "#FAF5EC", swatch: "#E8845A" },
  bookTheme("indigo", "靛藍", BOOK_PART_PALETTES[1]),
  bookTheme("teal", "青綠", BOOK_PART_PALETTES[2]),
  bookTheme("lavender", "薰衣紫", BOOK_PART_PALETTES[3]),
  bookTheme("rosewood", "豆沙紅", BOOK_PART_PALETTES[4]),
  { id: "festive", label: "喜氣紅", band: "linear-gradient(135deg, #C8463D 0%, #E58A5C 60%, #F2C58A 100%)", deep: "#A0322A", soft: "#F8DEDA", chip: "#F8DEDA", paper: "#FBF3EF", swatch: "#C8463D" },
  { id: "slate", label: "素雅灰", band: "linear-gradient(135deg, #5B6670 0%, #A3ABB2 100%)", deep: "#3E4750", soft: "#E6E9EC", chip: "#E6E9EC", paper: "#F4F5F6", swatch: "#6B757E" },
] as const satisfies readonly CardTheme[];

export type CardThemeId = (typeof CARD_THEMES)[number]["id"];

/** 不認得的（舊資料、沒跑 SQL）就用預設 */
export function cardTheme(id: unknown): (typeof CARD_THEMES)[number] {
  return CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0];
}

/** 直式：照片在上面置中（原本的樣子）；橫式：像紙本名片，照片在左、字在右 */
export const CARD_LAYOUTS = [
  { id: "vertical", label: "直式", desc: "照片在上面" },
  { id: "horizontal", label: "橫式", desc: "像紙本名片" },
] as const;

export type CardLayoutId = (typeof CARD_LAYOUTS)[number]["id"];

export function cardLayout(id: unknown): CardLayoutId {
  return CARD_LAYOUTS.find((l) => l.id === id)?.id ?? CARD_LAYOUTS[0].id;
}

export type CardWorkKind = "video" | "story";
export interface CardWorkRef {
  kind: CardWorkKind;
  id: string;
}

/** 名片上顯示的一件作品（分享頁、App 裡預覽都用這個） */
export interface CardWork extends CardWorkRef {
  title: string;
  /** 影片：縮圖；故事：沒有 */
  photo_url: string | null;
  /** 影片：分享頁 /v/<id>；故事：沒有（內容直接放在名片上） */
  href: string | null;
  /** 故事：年代＋全文 */
  era?: string | null;
  body?: string | null;
}

/** 可以放上名片的作品（編輯畫面的選單） */
export interface CardWorkChoice extends CardWorkRef {
  title: string;
  photo_url: string | null;
  /** 故事原本只有自己看（沒勾「給家人看」）：選之前提醒一下 */
  private?: boolean;
}

export interface CardFields {
  display_name: string;
  nickname: string;
  intro: string;
  interests: string;
  phone: string;
  line_id: string;
  email: string;
  show_phone: boolean;
  show_line: boolean;
  show_email: boolean;
  works: CardWorkRef[];
  theme: CardThemeId;
  layout: CardLayoutId;
}

/** 長輩自己看到的名片（含沒公開的聯絡方式） */
export interface BusinessCard extends CardFields {
  slug: string;
  photo_url: string | null;
  is_public: boolean;
  updated_at: string;
}

/** 分享頁看到的名片：只有公開的聯絡方式 */
export interface PublicBusinessCard {
  slug: string;
  display_name: string;
  nickname: string;
  intro: string;
  interests: string;
  photo_url: string | null;
  phone: string | null;
  line_id: string | null;
  email: string | null;
  works: CardWork[];
  theme: CardThemeId;
  layout: CardLayoutId;
}

export const EMPTY_CARD_FIELDS: CardFields = {
  display_name: "", nickname: "", intro: "", interests: "", phone: "", line_id: "", email: "",
  show_phone: false, show_line: false, show_email: false, works: [],
  theme: CARD_THEMES[0].id, layout: CARD_LAYOUTS[0].id,
};

export class CardInputError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE = /^\+?[0-9][0-9\s\-()#]{5,19}$/;
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const LINE_ID = /^@?[A-Za-z0-9._-]{1,20}$/;

/** 去頭尾空白、把換行和連續空白變一個空白（名片上都是一行字），超過上限就截掉 */
function oneLine(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return [...v.normalize("NFC").replace(/\s+/g, " ").trim()].slice(0, max).join("").trim();
}

/** LINE：ID（例如 meiyu0815、@abc 官方帳號）或 LINE 的加好友網址（https://line.me/ti/p/…） */
export function normalizeLineId(v: string): string | null {
  const s = v.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (u.protocol !== "https:" || (u.hostname !== "line.me" && u.hostname !== "lin.ee")) return null;
      return u.toString();
    } catch {
      return null;
    }
  }
  return LINE_ID.test(s) ? s : null;
}

/** 檢查名片欄位；格式不對丟 CardInputError（訊息直接給長輩看） */
export function normalizeCardInput(raw: unknown): CardFields {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const display_name = oneLine(r.display_name, CARD_LIMITS.display_name);
  const nickname = oneLine(r.nickname, CARD_LIMITS.nickname);
  const intro = oneLine(r.intro, CARD_LIMITS.intro);
  const interests = oneLine(r.interests, CARD_LIMITS.interests);

  const phone = oneLine(r.phone, CARD_LIMITS.phone);
  if (phone && !PHONE.test(phone)) throw new CardInputError("電話號碼看起來不對，請只打數字");
  const email = oneLine(r.email, CARD_LIMITS.email);
  if (email && !EMAIL.test(email)) throw new CardInputError("Email 看起來不對，請再檢查一次");
  const line_id = normalizeLineId(oneLine(r.line_id, CARD_LIMITS.line_id));
  if (line_id === null) throw new CardInputError("LINE ID 看起來不對：請打 ID，或貼上 LINE 的加好友網址");

  const works: CardWorkRef[] = [];
  for (const w of Array.isArray(r.works) ? r.works : []) {
    const item = (w && typeof w === "object" ? w : {}) as Record<string, unknown>;
    if ((item.kind !== "video" && item.kind !== "story") || typeof item.id !== "string" || !UUID.test(item.id)) continue;
    if (works.some((x) => x.kind === item.kind && x.id === item.id)) continue;
    works.push({ kind: item.kind, id: item.id.toLowerCase() });
  }
  if (works.length > CARD_WORKS_MAX) throw new CardInputError(`精選作品最多 ${CARD_WORKS_MAX} 件`);

  return {
    display_name, nickname, intro, interests, phone, line_id, email,
    // 沒填的就不公開（避免開關開著但內容是空的）
    show_phone: r.show_phone === true && Boolean(phone),
    show_line: r.show_line === true && Boolean(line_id),
    show_email: r.show_email === true && Boolean(email),
    works,
    theme: cardTheme(r.theme).id,
    layout: cardLayout(r.layout),
  };
}

/** 分享頁路徑 */
export function cardSharePath(slug: string): string {
  return `/c/${encodeURIComponent(slug)}`;
}

/** 分享連結的代碼：小寫英數字（不用 0 o 1 l，念出來、抄下來都不會混） */
const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export const SLUG_LENGTH = 12;

export function slugFromBytes(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < SLUG_LENGTH; i++) out += SLUG_ALPHABET[bytes[i % bytes.length] % SLUG_ALPHABET.length];
  return out;
}

export function isCardSlug(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9]{10,20}$/.test(v);
}

/** 撥號用：只留數字和最前面的 + */
export function telHref(phone: string): string {
  return `tel:${phone.trim().replace(/(?!^\+)[^0-9]/g, "")}`;
}

/** 加 LINE 好友的連結：貼網址的就用網址，ID 用 line.me/ti/p/~ID（官方帳號 @ID 用 line.me/R/ti/p/@ID） */
export function lineAddHref(lineId: string): string {
  if (/^https:\/\//.test(lineId)) return lineId;
  if (lineId.startsWith("@")) return `https://line.me/R/ti/p/${encodeURIComponent(lineId)}`;
  return `https://line.me/ti/p/~${encodeURIComponent(lineId)}`;
}

/** 名片上顯示的名字：「王美玉（美玉阿姨）」；都沒填就「我的名片」 */
export function cardTitle(card: { display_name: string; nickname: string }): string {
  const name = card.display_name.trim();
  const nick = card.nickname.trim();
  if (name && nick && name !== nick) return `${name}（${nick}）`;
  return name || nick || "我的名片";
}

/** 分享頁的標題與說明（LINE 預覽） */
export function cardShareMeta(card: Pick<PublicBusinessCard, "display_name" | "nickname" | "intro" | "interests">): { title: string; description: string } {
  const name = cardTitle(card);
  const title = name === "我的名片" ? "暖暖數位名片" : `${name}的名片`;
  const description = card.intro || (card.interests ? `喜歡：${card.interests}` : "用暖暖做的數位名片");
  return { title, description };
}

/** 長輩自己的名片 → 分享頁看到的樣子（App 裡的預覽也用這個，看到的就是別人看到的） */
export function toPublicCard(card: BusinessCard, works: CardWork[]): PublicBusinessCard {
  return {
    slug: card.slug,
    display_name: card.display_name,
    nickname: card.nickname,
    intro: card.intro,
    interests: card.interests,
    photo_url: card.photo_url,
    phone: card.show_phone && card.phone ? card.phone : null,
    line_id: card.show_line && card.line_id ? card.line_id : null,
    email: card.show_email && card.email ? card.email : null,
    works,
    theme: cardTheme(card.theme).id,
    layout: cardLayout(card.layout),
  };
}

/** vCard 欄位要跳脫 \ , ; 和換行 */
function vcardEscape(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** 存到通訊錄（.vcf）：只放公開的聯絡方式 */
export function buildVCard(card: PublicBusinessCard, cardUrl: string): string {
  const name = card.display_name || card.nickname || "暖暖名片";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${vcardEscape(name)}`,
    `N:${vcardEscape(name)};;;;`,
  ];
  if (card.nickname && card.nickname !== name) lines.push(`NICKNAME:${vcardEscape(card.nickname)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${vcardEscape(card.phone)}`);
  if (card.email) lines.push(`EMAIL:${vcardEscape(card.email)}`);
  if (card.line_id) lines.push(`X-SOCIALPROFILE;TYPE=line:${vcardEscape(lineAddHref(card.line_id))}`);
  const note = [card.intro, card.interests ? `喜歡：${card.interests}` : "", card.line_id ? `LINE：${card.line_id}` : ""].filter(Boolean).join("\n");
  if (note) lines.push(`NOTE:${vcardEscape(note)}`);
  lines.push(`URL:${vcardEscape(cardUrl)}`, "END:VCARD");
  return lines.join("\r\n") + "\r\n";
}
