import { createSupabaseAdmin } from "../supabase/server";
import { calculateCost } from "./pricing";
import { defaultVideoQuota, montageQuota, mvQuota } from "../travel-video";

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

/** 檢查用戶本月配額是否還夠 */
export async function checkUserQuota(
  userId: string,
  service: "photo" | "voice" | "video" | "montage" | "mv"
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

  // 本月起算時間（計算本月用量用）
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  if (service === "mv") {
    // 遊記 MV（做歌要算力）：專業版每月幾首；失敗的不算，刪掉的仍算
    const { count } = await supabase
      .from("travel_videos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "mv")
      .is("mv->>variant_of", null) // 「另一個版本」不扣次數
      .neq("status", "failed")
      .gte("created_at", startOfMonth.toISOString());
    const used = count ?? 0;
    const limit = mvQuota(tier);
    return { allowed: used < limit, used, limit, tier };
  }

  if (service === "montage") {
    // 多張照片遊記：只花配音費，另外計次（失敗的不算；刪掉的仍算）
    const { count } = await supabase
      .from("travel_videos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "montage")
      .neq("status", "failed")
      .gte("created_at", startOfMonth.toISOString());
    const used = count ?? 0;
    const limit = montageQuota(tier);
    return { allowed: used < limit, used, limit, tier };
  }

  if (service === "video") {
    // 分開查：ai_video_quota 欄位是後加的（add-travel-videos.sql），沒跑 SQL 時退回程式預設值，
    // 也不會連帶讓拍照／語音配額查詢失敗
    const { data: videoPlan } = await supabase
      .from("subscription_plans")
      .select("ai_video_quota")
      .eq("id", tier)
      .maybeSingle();

    // 失敗的不算；使用者刪掉的（deleted_at）仍算，避免刪了重做繞過配額
    const { count } = await supabase
      .from("travel_videos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "single") // 遊記、MV 另外計次
      .neq("status", "failed")
      .gte("created_at", startOfMonth.toISOString());

    const used = count ?? 0;
    const limit = videoPlan?.ai_video_quota ?? defaultVideoQuota(tier);
    return { allowed: used < limit, used, limit, tier };
  }

  // 2. 取得方案限額
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("ai_photo_quota, ai_voice_minutes")
    .eq("id", tier)
    .single();

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
