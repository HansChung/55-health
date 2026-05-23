import { createSupabaseServer } from "./supabase/server";

/** 驗證當前用戶是管理員，回傳 user 或 null */
export async function requireAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. 檢查 profiles.is_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) return user;

  // 2. 檢查 env 白名單
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim());
  if (user.email && adminEmails.includes(user.email)) return user;

  return null;
}
