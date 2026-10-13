import { createSupabaseAdmin } from "../supabase/server";
import { calculateCost } from "./pricing";
import { LIMIT_MAX } from "../plan-settings";
import { isAdminEmail, planAccessFor, type PlanAccess } from "../plan-access-server";

interface TrackUsageParams {
  userId: string | null;
  service: "gemini_vision" | "gemini_text" | "openai_realtime" | "openai_chat" | "minimax_video" | "gemini_tts" | "minimax_tts" | "suno_music";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  audioInputSeconds?: number;
  audioOutputSeconds?: number;
  videoOutputSeconds?: number;
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
    videoOutputSeconds: params.videoOutputSeconds,
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

/** 每種用量對應的功能與上限（後台「方案與次數」可以改） */
const QUOTA_KEYS = {
  photo: { feature: "ai_photo", limit: "photo_monthly" },
  video: { feature: "travel_video", limit: "video_monthly" },
  montage: { feature: "travel_montage", limit: "montage_monthly" },
  mv: { feature: "travel_mv", limit: "mv_monthly" },
} as const;

/**
 * 檢查用戶本月配額是否還夠（上限照後台設定；有個別開通就照開通的方案）。
 * access 給呼叫端判斷功能開關（access.blocked(...)）與其他上限
 */
export async function checkUserQuota(
  userId: string,
  service: "photo" | "video" | "montage" | "mv"
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  tier: string;
  access: PlanAccess;
}> {
  const supabase = createSupabaseAdmin();

  // 1. 取得用戶訂閱方案 + 是否管理員
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, is_admin")
    .eq("id", userId)
    .single();

  // 管理員 + ADMIN_EMAILS 白名單 → 不限制
  let isAdmin = Boolean(profile?.is_admin);
  if (!isAdmin && (process.env.ADMIN_EMAILS ?? "").trim()) {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    isAdmin = isAdminEmail(user?.email);
  }
  const access = await planAccessFor(userId, isAdmin ? "admin" : profile?.subscription_tier ?? "free");
  if (isAdmin) return { allowed: true, used: 0, limit: LIMIT_MAX, tier: "admin", access };
  const tier = access.tier;
  const limit = access.limit(QUOTA_KEYS[service].limit);

  // 本月起算時間（計算本月用量用）
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
    const used = count ?? 0;
    return { allowed: used < limit, used, limit, tier, access };
  }

  // 影片：失敗的不算；使用者刪掉的（deleted_at）仍算，避免刪了重做繞過配額
  let q = supabase
    .from("travel_videos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", service === "video" ? "single" : service) // 單張、遊記、MV 各自計次
    .neq("status", "failed")
    .gte("created_at", startOfMonth.toISOString());
  if (service === "mv") q = q.is("mv->>variant_of", null); // 「另一個版本」不扣次數
  const { count } = await q;
  const used = count ?? 0;
  return { allowed: used < limit, used, limit, tier, access };
}

/**
 * 每天限次數的功能：先佔一格再呼叫 AI（同時送出好幾則、開好幾個分頁也不會超過上限）。
 * 先寫一筆 ai_usage（success=true、metadata.reserved），再把今天這個 endpoint 成功的紀錄照時間排：
 * 自己排在上限內才算佔到；否則刪掉、回 id=null。成功後 finishReservedUsage 補上模型與用量；
 * 失敗 releaseReservedUsage 刪掉（失敗不算次數）
 */
export async function reserveDailySlot(opts: {
  userId: string;
  service: TrackUsageParams["service"];
  endpoint: string;
  sinceIso: string;
  limit: number;
}): Promise<{ id: string | null; used: number }> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("ai_usage")
    .insert({
      user_id: opts.userId,
      service: opts.service,
      model: "reserved",
      endpoint: opts.endpoint,
      success: true,
      metadata: { reserved: true },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`reserve ${opts.endpoint} slot failed: ${error?.message ?? "no row"}`);
  const id = (data as { id: string }).id;
  const { data: rows, error: listErr } = await supabase
    .from("ai_usage")
    .select("id")
    .eq("user_id", opts.userId)
    .eq("endpoint", opts.endpoint)
    .eq("success", true)
    .gte("created_at", opts.sinceIso)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(opts.limit);
  if (listErr) {
    await supabase.from("ai_usage").delete().eq("id", id);
    throw new Error(`count ${opts.endpoint} slots failed: ${listErr.message}`);
  }
  const ids = ((rows ?? []) as { id: string }[]).map((r) => r.id);
  if (ids.includes(id)) return { id, used: ids.length };
  await supabase.from("ai_usage").delete().eq("id", id);
  return { id: null, used: opts.limit };
}

/** 佔到的那一格：AI 回來了，補上模型、token 與費用 */
export async function finishReservedUsage(
  id: string,
  usage: { model: string; inputTokens?: number; outputTokens?: number; metadata?: Record<string, unknown> }
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("ai_usage")
    .update({
      model: usage.model,
      input_tokens: usage.inputTokens ?? 0,
      output_tokens: usage.outputTokens ?? 0,
      cost_usd: calculateCost({ model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens }),
      metadata: usage.metadata ?? {},
    })
    .eq("id", id);
  if (error) console.error("[ai-usage] finish reserved usage failed:", error);
}

/** 佔到的那一格：AI 沒成功，把格子還回去 */
export async function releaseReservedUsage(id: string): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("ai_usage").delete().eq("id", id);
  if (error) console.error("[ai-usage] release reserved usage failed:", error);
}

/** 某個時間之後，某個 endpoint 成功的次數（打字問暖暖：每天的題數；失敗的不算） */
export async function countEndpointSuccessSince(userId: string, endpoint: string, sinceIso: string): Promise<number> {
  const supabase = createSupabaseAdmin();
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .eq("success", true)
    .gte("created_at", sinceIso);
  if (error) throw new Error(`count ${endpoint} usage failed: ${error.message}`);
  return count ?? 0;
}

/** 本月某個 endpoint 的呼叫次數（成功、失敗都算）：用來限制試聽口白、AI 寫稿等附屬功能 */
export async function countMonthlyEndpointUsage(userId: string, endpoint: string): Promise<number> {
  const supabase = createSupabaseAdmin();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("created_at", startOfMonth.toISOString());
  return count ?? 0;
}
