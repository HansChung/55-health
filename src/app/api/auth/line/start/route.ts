// ────────────────────────────────────────────────
// LINE 登入第一步：記下 state、nonce（httpOnly cookie），轉到 LINE 的同意畫面
// GET ?mode=login|link&next=/…（link＝已登入的人連結 LINE，到 callback 才確認是誰）
// 一律在正式網址上進行（NEXT_PUBLIC_APP_URL）：LINE 只會轉回登記過的 callback，cookie 也要在同一個網址
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { publicAppOrigin } from "@/lib/study-tours";
import {
  LINE_STATE_COOKIE,
  LINE_STATE_MAX_AGE,
  buildLineAuthorizeUrl,
  lineConfig,
  lineMode,
  safeNext,
} from "@/lib/line-login";

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Buffer.from(bytes).toString("base64url");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = publicAppOrigin(process.env.NEXT_PUBLIC_APP_URL, url.origin);
  const mode = lineMode(url.searchParams.get("mode"));
  const next = safeNext(url.searchParams.get("next"));
  const cfg = lineConfig();
  if (!cfg) return NextResponse.redirect(`${origin}${next.includes("?") ? `${next}&` : `${next}?`}line_error=not_configured`);
  // 從別的網址（例如 Vercel 預覽網址）進來：先換到正式網址再開始
  if (url.origin !== origin) return NextResponse.redirect(`${origin}${url.pathname}${url.search}`);

  const state = randomToken();
  const nonce = randomToken();
  const res = NextResponse.redirect(
    buildLineAuthorizeUrl(cfg, { redirectUri: `${origin}/api/auth/line/callback`, state, nonce })
  );
  res.cookies.set(LINE_STATE_COOKIE, JSON.stringify({ state, nonce, mode, next }), {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    // LINE 轉回來是一般的網頁跳轉，lax 會帶 cookie
    sameSite: "lax",
    path: "/api/auth/line",
    maxAge: LINE_STATE_MAX_AGE,
  });
  return res;
}
