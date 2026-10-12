// ────────────────────────────────────────────────
// LINE 登入（只在 API route 用；service role）
// ID token 交給 LINE 的 verify API 驗（網頁登入的 token 是用 channel secret 簽的，沒有公開金鑰可以自己驗）
// 登入＝用 Supabase 管理 API 產生一次性的登入連結，在伺服器上直接換成 session（不寄信）
// ────────────────────────────────────────────────

import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { placeholderEmail, type LineConfig, type LineErrorCode } from "@/lib/line-login";

type Admin = ReturnType<typeof createSupabaseAdmin>;
type ServerClient = Awaited<ReturnType<typeof createSupabaseServer>>;

export class LineLoginError extends Error {
  constructor(readonly code: LineErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
  }
}

export interface LineProfile {
  /** LINE 的 user id（U 開頭） */
  sub: string;
  name: string | null;
  picture: string | null;
  /** 有申請到 Email 權限、使用者也同意才有 */
  email: string | null;
}

const TIMEOUT_MS = 10_000;

/** 授權碼 → ID token */
export async function exchangeLineCode(cfg: LineConfig, code: string, redirectUri: string): Promise<string> {
  const res = await fetch(`${cfg.apiBase}/oauth2/v2.1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: cfg.channelId,
      client_secret: cfg.channelSecret,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => null)) as { id_token?: string; error?: string } | null;
  if (!res.ok || !body?.id_token) throw new LineLoginError("failed", `token ${res.status} ${body?.error ?? ""}`);
  return body.id_token;
}

/** 交給 LINE 驗 ID token（簽章、有效期、這個頻道、nonce），拿到使用者資料 */
export async function verifyLineIdToken(cfg: LineConfig, idToken: string, nonce: string): Promise<LineProfile> {
  const res = await fetch(`${cfg.apiBase}/oauth2/v2.1/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: cfg.channelId, nonce }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const p = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !p || typeof p.sub !== "string" || !p.sub) {
    throw new LineLoginError("failed", `verify ${res.status} ${typeof p?.error === "string" ? p.error : ""}`);
  }
  // verify API 已經檢查過；這裡再確認一次是這個頻道、這次登入
  if (p.aud !== cfg.channelId || p.nonce !== nonce) throw new LineLoginError("failed", "aud/nonce mismatch");
  const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  return { sub: p.sub, name: str(p.name, 60), picture: str(p.picture, 500), email: str(p.email, 200)?.toLowerCase() ?? null };
}

/** 這個 LINE 連結到哪個暖暖帳號 */
export async function linkedUserId(admin: Admin, lineUserId: string): Promise<string | null> {
  const { data, error } = await admin.from("line_accounts").select("user_id").eq("line_user_id", lineUserId).maybeSingle();
  if (error) throw new Error(`load line account failed: ${error.message}`);
  return (data as { user_id: string } | null)?.user_id ?? null;
}

/** 這個暖暖帳號連結的 LINE（沒有就 null） */
export async function lineAccountOf(admin: Admin, userId: string): Promise<{ line_user_id: string; display_name: string | null; picture_url: string | null } | null> {
  const { data, error } = await admin.from("line_accounts").select("line_user_id, display_name, picture_url").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`load line account failed: ${error.message}`);
  return data as { line_user_id: string; display_name: string | null; picture_url: string | null } | null;
}

/** 已登入的人連結 LINE：同一個 LINE 不能連兩個帳號、一個帳號只連一個 LINE */
export async function linkLineAccount(admin: Admin, userId: string, profile: LineProfile): Promise<void> {
  const owner = await linkedUserId(admin, profile.sub);
  if (owner && owner !== userId) throw new LineLoginError("taken");
  if (owner === userId) {
    await touchLineAccount(admin, profile);
    return;
  }
  const mine = await lineAccountOf(admin, userId);
  if (mine) throw new LineLoginError("already_linked");
  const { error } = await admin.from("line_accounts").insert({
    line_user_id: profile.sub,
    user_id: userId,
    display_name: profile.name,
    picture_url: profile.picture,
  });
  // 兩個分頁同時連：主鍵／唯一鍵擋下來
  if (error) throw error.code === "23505" ? new LineLoginError("taken") : new Error(`link line failed: ${error.message}`);
}

async function touchLineAccount(admin: Admin, profile: LineProfile): Promise<void> {
  await admin
    .from("line_accounts")
    .update({ display_name: profile.name, picture_url: profile.picture, last_login_at: new Date().toISOString() })
    .eq("line_user_id", profile.sub);
}

/**
 * 第一次用 LINE 登入的人：開新帳號。LINE 有給 Email 就用它（之後也能用 Email 驗證碼登入、收得到報告信）；
 * 那個 Email 已經有帳號 → 不自動合併，請他先用 Email 登入再連結。沒有 Email 就用 placeholder
 */
export async function createLineUser(admin: Admin, profile: LineProfile): Promise<string> {
  const email = profile.email ?? placeholderEmail(profile.sub);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: profile.name ?? undefined, avatar_url: profile.picture ?? undefined, signup_provider: "line" },
  });
  if (error || !data?.user) {
    const exists = /already (been )?registered|email_exists|already exists/i.test(
      `${error?.message ?? ""} ${(error as { code?: string } | null)?.code ?? ""}`
    );
    // 同一個 LINE 同時登入兩次：另一邊可能剛建好（GoTrue 這時常常只回「Database error creating new user」），
    // 等一下再看是不是已經連好了
    const winner = (await linkedUserId(admin, profile.sub)) ?? (await waitForLink(admin, profile.sub));
    if (winner) return winner;
    // 假地址是從這個 LINE 的 user id 算出來的，撞到一定是這個 LINE 自己的帳號（上次建到一半、沒連成功）：
    // 接回去，不然他永遠登不進來（假地址收不到 Email 驗證碼）
    if (!profile.email) return adoptPlaceholderUser(admin, profile, email);
    // 真的 Email 已經有帳號：不自動合併，請他先用 Email 登入再連結
    if (exists) throw new LineLoginError("email_exists");
    throw new Error(`create line user failed: ${error?.message ?? "no user"}`);
  }
  const userId = data.user.id as string;
  const { error: linkErr } = await insertLineAccount(admin, userId, profile);
  if (linkErr) {
    if (linkErr.code === "23505") {
      const winner = await linkedUserId(admin, profile.sub);
      // 另一邊把「這個剛建好的帳號」接上了（假地址同時登入）：就是它，不要刪
      if (winner === userId) return userId;
      if (winner) {
        await admin.auth.admin.deleteUser(userId).catch(() => undefined);
        return winner;
      }
    }
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    throw new Error(`link new line user failed: ${linkErr.message}`);
  }
  return userId;
}

/** 另一個同時進行的登入正在建帳號：最多等 1.5 秒看它連好沒有 */
async function waitForLink(admin: Admin, lineUserId: string): Promise<string | null> {
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const id = await linkedUserId(admin, lineUserId);
    if (id) return id;
  }
  return null;
}

function insertLineAccount(admin: Admin, userId: string, profile: LineProfile) {
  return admin.from("line_accounts").insert({
    line_user_id: profile.sub,
    user_id: userId,
    display_name: profile.name,
    picture_url: profile.picture,
    last_login_at: new Date().toISOString(),
  });
}

/** 已經有這個 LINE 的假地址帳號、但沒有連結紀錄：補上連結（同時補的話以先寫進去的為準） */
async function adoptPlaceholderUser(admin: Admin, profile: LineProfile, email: string): Promise<string> {
  // 用 Email 找帳號：產生登入連結會回傳那個帳號（不寄信）
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const userId = data?.user?.id as string | undefined;
  if (error || !userId) throw new Error(`find placeholder line user failed: ${error?.message ?? "no user"}`);
  const { error: linkErr } = await insertLineAccount(admin, userId, profile);
  if (linkErr && linkErr.code !== "23505") throw new Error(`relink line user failed: ${linkErr.message}`);
  const owner = await linkedUserId(admin, profile.sub);
  if (!owner) throw new Error("relink line user failed: no link");
  return owner;
}

/** 讓瀏覽器以這個帳號登入：產生一次性登入連結，在伺服器上換成 session（寫進 cookie），不寄信 */
export async function signInAsUser(admin: Admin, server: ServerClient, userId: string, profile: LineProfile): Promise<void> {
  const { data: u, error: getErr } = await admin.auth.admin.getUserById(userId);
  const email = u?.user?.email as string | undefined;
  if (getErr || !email) throw new Error(`load user for line login failed: ${getErr?.message ?? "no email"}`);
  // 同一個帳號同時登入（長輩連點兩下、兩支手機）：新產生的登入碼會讓舊的失效，失效的那邊稍等再產生一次
  for (let attempt = 0; ; attempt++) {
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token as string | undefined;
    if (linkErr || !tokenHash) throw new Error(`generate login link failed: ${linkErr?.message ?? "no token"}`);
    const { error } = await server.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (!error) break;
    if (attempt >= 4 || !/invalid|expired/i.test(error.message)) throw new Error(`line session failed: ${error.message}`);
    await new Promise((r) => setTimeout(r, 150 + Math.random() * 450));
  }
  await touchLineAccount(admin, profile);
}
