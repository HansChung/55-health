// 問暖暖的使用者資料與方案（打字問暖暖、我的故事集「整理成文章」共用每天的題數）
import { createSupabaseAdmin } from "../supabase/server";
import { isAdminEmail, planAccessFor } from "../plan-access-server";

/** 問暖暖、故事集共用的每天題數：都記在這個 endpoint 底下 */
export const ASK_ENDPOINT = "/api/ai/chat";

interface Profile {
  display_name: string | null;
  age: number | null;
  chronic_conditions: string[] | null;
  voice_tone: string | null;
  subscription_tier: string | null;
  is_admin: boolean | null;
}

export async function loadAsker(userId: string, email: string | undefined) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("display_name, age, chronic_conditions, voice_tone, subscription_tier, is_admin")
    .eq("id", userId)
    .maybeSingle();
  const profile = data as Profile | null;
  const tier = profile?.is_admin || isAdminEmail(email) ? "admin" : profile?.subscription_tier ?? "free";
  // access：功能開關、每天題數等上限（後台「方案與次數」）
  const access = await planAccessFor(userId, tier);
  return { profile, tier: access.tier as string, access };
}
