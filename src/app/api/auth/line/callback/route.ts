// ────────────────────────────────────────────────
// LINE 登入第二步：LINE 帶著 code、state 轉回來
// 1. 比對 state（cookie）→ 2. code 換 ID token → 3. 交給 LINE 驗（含 nonce）→
//   登入：找到連結的帳號就登入；沒有就開新帳號（LINE 的 Email 已經有帳號 → 請他先用 Email 登入再連結）
//   連結：一定要已經登入，把這個 LINE 記到目前的帳號
// 失敗一律轉回首頁帶 ?line_error=代碼（畫面顯示中文說明）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { publicAppOrigin } from "@/lib/study-tours";
import { LINE_STATE_COOKIE, lineConfig, lineMode, safeNext, type LineErrorCode } from "@/lib/line-login";
import {
  LineLoginError,
  createLineUser,
  exchangeLineCode,
  linkLineAccount,
  linkedUserId,
  signInAsUser,
  verifyLineIdToken,
} from "@/lib/line-login-server";

function withParam(next: string, key: string, value: string): string {
  return `${next}${next.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = publicAppOrigin(process.env.NEXT_PUBLIC_APP_URL, url.origin);
  const raw = req.cookies.get(LINE_STATE_COOKIE)?.value;
  let saved: { state?: string; nonce?: string; mode?: string; next?: string } = {};
  try {
    saved = raw ? JSON.parse(raw) : {};
  } catch { /* 壞掉的 cookie 當作沒有 */ }
  const next = safeNext(saved.next);
  const mode = lineMode(saved.mode);

  const finish = (code: LineErrorCode | null) => {
    const target = code ? withParam(next, "line_error", code) : mode === "link" ? withParam(next, "line", "linked") : next;
    const res = NextResponse.redirect(`${origin}${target}`);
    res.cookies.set(LINE_STATE_COOKIE, "", { path: "/api/auth/line", maxAge: 0 });
    return res;
  };

  const cfg = lineConfig();
  if (!cfg) return finish("not_configured");
  // 長輩在 LINE 按了取消
  if (url.searchParams.get("error")) return finish("cancelled");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!saved.state || !saved.nonce || !state || state !== saved.state) return finish("expired");
  if (!code) return finish("failed");

  try {
    const idToken = await exchangeLineCode(cfg, code, `${origin}/api/auth/line/callback`);
    const profile = await verifyLineIdToken(cfg, idToken, saved.nonce);
    const admin = createSupabaseAdmin();
    const server = await createSupabaseServer();

    if (mode === "link") {
      const { data: { user } } = await server.auth.getUser();
      if (!user) return finish("need_login");
      await linkLineAccount(admin, user.id, profile);
      return finish(null);
    }

    const userId = (await linkedUserId(admin, profile.sub)) ?? (await createLineUser(admin, profile));
    await signInAsUser(admin, server, userId, profile);
    return finish(null);
  } catch (e) {
    if (e instanceof LineLoginError) {
      if (e.code === "failed") console.warn("[line-login]", e.message);
      return finish(e.code);
    }
    console.error("[line-login] callback failed:", e);
    return finish("failed");
  }
}
