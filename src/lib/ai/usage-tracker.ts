import { createSupabaseAdmin } from "../supabase/server";
import { calculateCost } from "./pricing";

interface TrackUsageParams {
  userId: string | null;
  service: "gemini_vision" | "gemini_text" | "openai_realtime" | "openai_chat";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  audioInputSeconds?: number;
  audioOutputSeconds?: number;
  endpoint?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export async function trackAiUsage(params: TrackUsageParams) {
  const cost = calculateCost({
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    audioInputSeconds: params.audioInputSeconds,
    audioOutputSeconds: params.audioOutputSeconds,
  });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("ai_usage")
    .insert({
      user_id: params.userId,
      service: params.service,
      model: params.model,
      input_tokens: params.inputTokens ?? 0,
      output_tokens: params.outputTokens ?? 0,
      audio_seconds:
        (params.audioInputSeconds ?? 0) + (params.audioOutputSeconds ?? 0),
      cost_usd: cost,
      endpoint: params.endpoint,
      success: params.success ?? true,
      error_message: params.errorMessage,
      metadata: params.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("[ai-usage] tracking failed:", error);
    return null;
  }
  return data?.id ?? null;
}

/** 檢查用戶本月配額是否還夠 */
export async function checkUserQuota(
  userId: string,
  service: "photo" | "voice"
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  tier: string;
  usedSeconds?: number;
  remainingSeconds?: number;
}> {
  const supabase = createSupabaseAdmin();

  // 1. 取得用戶訂閱方案 + 是否管理員
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_expires_at, is_admin")
    .eq("id", userId)
    .single();

  // 管理員 + ADMIN_EMAILS 白名單 → 不限制
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim());
  const isAdmin = profile?.is_admin || (user?.email && adminEmails.includes(user.email));
  if (isAdmin) {
    return { allowed: true, used: 0, limit: 99999, tier: "admin" };
  }

  const tier = profile?.subscription_tier ?? "free";

  // 2. 取得方案限額
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("ai_photo_quota, ai_voice_minutes")
    .eq("id", tier)
    .single();

  // 3. 計算本月用量
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  if (service === "photo") {
    const { count } = await supabase
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("service", "gemini_vision")
      .gte("created_at", startOfMonth.toISOString());

    const limit = plan?.ai_photo_quota ?? 10;
    return { allowed: (count ?? 0) < limit, used: count ?? 0, limit, tier };
  } else {
    const { data: usage } = await supabase
      .from("ai_usage")
      .select("audio_seconds")
      .eq("user_id", userId)
      .eq("service", "openai_realtime")
      .gte("created_at", startOfMonth.toISOString());

    const totalSeconds =
      usage?.reduce(
        (s: number, u: { audio_seconds: number | null }) =>
          s + Number(u.audio_seconds || 0),
        0
      ) ?? 0;
    const usedMinutes = Math.ceil(totalSeconds / 60);
    const limit = plan?.ai_voice_minutes ?? 2;
    const limitSeconds = limit * 60;
    return {
      allowed: totalSeconds < limitSeconds,
      used: usedMinutes,
      limit,
      tier,
      usedSeconds: totalSeconds,
      remainingSeconds: Math.max(0, limitSeconds - totalSeconds),
    };
  }
}
