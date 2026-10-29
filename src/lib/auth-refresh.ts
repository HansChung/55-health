/**
 * 登入憑證（access token）由手機自己提早換新，不要等到伺服器去換。
 *
 * 憑證剩不到 90 秒時，伺服器處理 API 也會用 refresh token 換新的，新憑證要等回應回來才寫進 cookie。
 * 回應很慢（AI 分析、做影片）或中途被取消時，手機還拿著舊的 refresh token；
 * 超過 Supabase 的 10 秒容許期再拿它去換 → 「Already Used」→ 整個登入被作廢，長輩就被登出了。
 * 所以剩不到 10 分鐘（短效憑證則是一半壽命）就先在手機換，伺服器收到的憑證永遠不會快過期。
 */
export const EARLY_REFRESH_MAX_MS = 10 * 60_000;
export const EARLY_REFRESH_CHECK_MS = 60_000;

export function sessionNeedsEarlyRefresh(
  session: { expires_at?: number; expires_in?: number },
  now: number,
): boolean {
  if (!session.expires_at) return false;
  const lifetimeMs = (session.expires_in && session.expires_in > 0 ? session.expires_in : 3600) * 1000;
  const marginMs = Math.min(EARLY_REFRESH_MAX_MS, lifetimeMs / 2);
  return session.expires_at * 1000 - now < marginMs;
}
