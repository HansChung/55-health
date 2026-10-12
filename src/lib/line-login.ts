// ────────────────────────────────────────────────
// LINE 登入（前後端共用的設定、網址、錯誤訊息）
// 流程：/api/auth/line/start → LINE 同意畫面 → /api/auth/line/callback → 找到（或建立）暖暖帳號 → 登入
// 已經有帳號的人先用原本的方式登入，到「我的」按「連結 LINE」（mode=link），之後就能直接用 LINE 登入。
// 不用 LINE 給的 Email 自動合併帳號（避免別人用同一個 Email 冒用）
// ────────────────────────────────────────────────

export const LINE_ACCESS_BASE = "https://access.line.me";
export const LINE_API_BASE = "https://api.line.me";

/** 記住這次登入的 state、nonce（httpOnly，10 分鐘） */
export const LINE_STATE_COOKIE = "nuan_line_oauth";
export const LINE_STATE_MAX_AGE = 10 * 60;

/** 沒有 Email 的 LINE 帳號用這個網域當帳號 Email（不會寄信；Email 驗證碼登入也用不了，只能用 LINE 登入） */
export const LINE_PLACEHOLDER_DOMAIN = "line-login.invalid";

export type LineMode = "login" | "link";

export interface LineConfig {
  channelId: string;
  channelSecret: string;
  /** 已經向 LINE 申請到 Email 權限才打開（LINE_LOGIN_REQUEST_EMAIL=1） */
  requestEmail: boolean;
  accessBase: string;
  apiBase: string;
}

type Env = Record<string, string | undefined>;

/** 沒設 LINE_LOGIN_CHANNEL_ID／SECRET 就是還沒開（畫面不顯示 LINE 按鈕） */
export function lineConfig(env: Env = process.env): LineConfig | null {
  const channelId = env.LINE_LOGIN_CHANNEL_ID?.trim();
  const channelSecret = env.LINE_LOGIN_CHANNEL_SECRET?.trim();
  if (!channelId || !channelSecret) return null;
  return {
    channelId,
    channelSecret,
    requestEmail: env.LINE_LOGIN_REQUEST_EMAIL === "1",
    // 只給本機測試指到假的 LINE
    accessBase: (env.LINE_ACCESS_BASE || LINE_ACCESS_BASE).replace(/\/+$/, ""),
    apiBase: (env.LINE_API_BASE || LINE_API_BASE).replace(/\/+$/, ""),
  };
}

export function buildLineAuthorizeUrl(cfg: LineConfig, opts: { redirectUri: string; state: string; nonce: string }): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: cfg.channelId,
    redirect_uri: opts.redirectUri,
    state: opts.state,
    scope: cfg.requestEmail ? "openid profile email" : "openid profile",
    nonce: opts.nonce,
    ui_locales: "zh-TW",
  });
  return `${cfg.accessBase}/oauth2/v2.1/authorize?${p.toString()}`;
}

/** 登入後要回去的地方：只收站內路徑（/ 開頭、不是 //別的網站） */
export function safeNext(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next.slice(0, 300);
}

export function lineMode(v: unknown): LineMode {
  return v === "link" ? "link" : "login";
}

export function placeholderEmail(lineUserId: string): string {
  return `line-${lineUserId.toLowerCase().replace(/[^a-z0-9]/g, "")}@${LINE_PLACEHOLDER_DOMAIN}`;
}

/** 只用 LINE 登入的帳號（沒有真的 Email）：不寄信、不能解除 LINE 連結 */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${LINE_PLACEHOLDER_DOMAIN}`));
}

/** 失敗時帶回網址的代碼 → 給長輩看的話 */
export const LINE_ERRORS = {
  cancelled: "沒有完成 LINE 登入，可以再試一次。",
  expired: "登入時間太久了，請再按一次「用 LINE 登入」。",
  failed: "LINE 登入沒有成功，請再試一次，或改用 Email 登入。",
  not_configured: "LINE 登入還沒開放，請先用 Email 或 Google 登入。",
  need_login: "要先登入暖暖，才能連結 LINE。",
  taken: "這個 LINE 已經連結到另一個暖暖帳號了。",
  already_linked: "你的暖暖帳號已經連結了另一個 LINE，請先到「我的」解除連結。",
  email_exists: "這個 LINE 的 Email 已經有暖暖帳號了：請先用 Email 登入，再到「我的」按「連結 LINE」。",
} as const;

export type LineErrorCode = keyof typeof LINE_ERRORS;

export function lineErrorMessage(code: unknown): string | null {
  return typeof code === "string" && code in LINE_ERRORS ? LINE_ERRORS[code as LineErrorCode] : null;
}
