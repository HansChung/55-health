import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * OAuth callback handler
 * Google / 其他 OAuth provider 登入完會跳轉到這裡
 * 我們用 code 換 session，然後跳回首頁
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = await createSupabaseServer();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("[auth callback] exchange failed:", error);
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
    } catch (e) {
      console.error("[auth callback] unexpected error:", e);
      return NextResponse.redirect(`${origin}/?auth_error=unexpected`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=no_code`);
}
