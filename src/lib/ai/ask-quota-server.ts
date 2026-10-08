// 問暖暖的使用者資料與方案（打字問暖暖、我的故事集「整理成文章」共用每天的題數）
import { createSupabaseAdmin } from "../supabase/server";

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
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const tier = profile?.is_admin || (email && adminEmails.includes(email)) ? "admin" : profile?.subscription_tier ?? "free";
  return { profile, tier };
}
