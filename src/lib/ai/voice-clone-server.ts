// ────────────────────────────────────────────────
// 「我的聲音」：長輩錄音 → 平台複製聲音 → 出遊影片口白用自己的聲音念（專業版）
// 只在 API route 用（service role）
// ────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { hasFeature, type SubscriptionTier } from "@/lib/feature-gates";
import {
  DEFAULT_NARRATION_ACCENT,
  MY_VOICE,
  VOICE_CLONES_PER_30_DAYS,
  type MyVoice,
  type NarrationAccentId,
  type NarrationVoiceChoice,
} from "@/lib/travel-video";
import type { NarrationSpeaker } from "./lk888-tts";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export interface VoiceCloneRow {
  id: string;
  user_id: string;
  provider_voice_id: string;
  model: string;
  sample_seconds: number | null;
  demo_url: string | null;
  consent_text: string;
  consented_at: string;
  activated_at: string | null;
  expires_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

const COLUMNS =
  "id, user_id, provider_voice_id, model, sample_seconds, demo_url, consent_text, consented_at, activated_at, expires_at, deleted_at, created_at";

/** checkUserQuota 回的 tier（管理員是 "admin"） */
export function voiceCloneAllowed(tier: string): boolean {
  return tier === "admin" || hasFeature(tier as SubscriptionTier, "voice_clone");
}

/** 還沒用過、過了平台給的 7 天就失效（用過一次就永久有效） */
export function isVoiceExpired(row: Pick<VoiceCloneRow, "activated_at" | "expires_at">, now = new Date()): boolean {
  return !row.activated_at && Boolean(row.expires_at) && new Date(row.expires_at as string).getTime() <= now.getTime();
}

export function toMyVoice(row: VoiceCloneRow, now = new Date()): MyVoice {
  return {
    id: row.id,
    created_at: row.created_at,
    demo_url: row.demo_url,
    activated: Boolean(row.activated_at),
    expires_at: row.activated_at ? null : row.expires_at,
    expired: isVoiceExpired(row, now),
  };
}

export async function loadActiveVoice(admin: Admin, userId: string): Promise<VoiceCloneRow | null> {
  const { data, error } = await admin
    .from("voice_clones")
    .select(COLUMNS)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as VoiceCloneRow | null) ?? null;
}

/** 這 30 天還能錄幾次（刪掉的也算，避免一直刪了重錄） */
export async function remainingClones(admin: Admin, userId: string, now = new Date()): Promise<number> {
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const { count, error } = await admin
    .from("voice_clones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) throw error;
  return Math.max(0, VOICE_CLONES_PER_30_DAYS - (count ?? 0));
}

export type SpeakerResult =
  | { ok: true; speaker: NarrationSpeaker; cloneId: string | null; activated: boolean }
  | { ok: false; status: number; error: string };

/**
 * 把前端選的聲音變成配音要用的 speaker。選「我的聲音」時檢查方案、有沒有錄好、有沒有過期。
 * checkTier=false：已經建立的遊記在背景配音時不再擋方案（建立當下檢查過了）
 */
export async function resolveSpeaker(
  admin: Admin,
  opts: { userId: string; tier: string; voice: NarrationVoiceChoice; accent?: NarrationAccentId | null; checkTier?: boolean }
): Promise<SpeakerResult> {
  if (opts.voice !== MY_VOICE) {
    return {
      ok: true,
      speaker: { kind: "preset", voice: opts.voice, accent: opts.accent ?? DEFAULT_NARRATION_ACCENT },
      cloneId: null,
      activated: true,
    };
  }
  if (opts.checkTier !== false && !voiceCloneAllowed(opts.tier)) {
    return { ok: false, status: 403, error: "用自己的聲音念是專業版功能，升級後就可以使用" };
  }
  const row = await loadActiveVoice(admin, opts.userId);
  if (!row) return { ok: false, status: 400, error: "還沒錄好你的聲音，先到「我的聲音」錄一段喔" };
  if (isVoiceExpired(row)) {
    return { ok: false, status: 410, error: "錄好的聲音超過 7 天沒用，已經失效了，請重新錄一次" };
  }
  return {
    ok: true,
    speaker: { kind: "clone", providerVoiceId: row.provider_voice_id },
    cloneId: row.id,
    activated: Boolean(row.activated_at),
  };
}

/** 第一次配音最久大概要這麼久（配音＋下載），租約過期別人才能再試 */
const FIRST_USE_LEASE_MS = 90_000;

/**
 * 還沒啟用的聲音，第一次配音由一個請求獨占：平台第一次合成會收 18.8 算力啟用費，
 * 同時送兩次可能被收兩次。拿不到就請使用者稍等
 */
export async function claimFirstUse(admin: Admin, cloneId: string): Promise<boolean> {
  const now = new Date();
  const { data, error } = await admin
    .from("voice_clones")
    .update({ activating_until: new Date(now.getTime() + FIRST_USE_LEASE_MS).toISOString() })
    .eq("id", cloneId)
    .is("activated_at", null)
    .or(`activating_until.is.null,activating_until.lt.${now.toISOString()}`)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/**
 * 背景工作用：搶不到第一次配音時，等別人做完（最多 waitMs）。
 * claimed＝由我來做第一次；activated＝別人已經啟用好了，可以直接用；busy＝還在等，下次再試
 */
export async function claimOrAwaitFirstUse(
  admin: Admin,
  cloneId: string,
  waitMs = 10_000
): Promise<"claimed" | "activated" | "busy"> {
  const deadline = Date.now() + waitMs;
  for (;;) {
    if (await claimFirstUse(admin, cloneId)) return "claimed";
    const { data } = await admin.from("voice_clones").select("activated_at").eq("id", cloneId).maybeSingle();
    if ((data as { activated_at: string | null } | null)?.activated_at) return "activated";
    if (Date.now() + 2_000 > deadline) return "busy";
    await new Promise((r) => setTimeout(r, 2_000));
  }
}

export async function releaseFirstUse(admin: Admin, cloneId: string): Promise<void> {
  const { error } = await admin.from("voice_clones").update({ activating_until: null }).eq("id", cloneId);
  if (error) console.warn("[voice-clone] release first use failed:", error.message);
}

/** 第一次用複製的聲音配音成功 → 平台已轉為永久（並收了啟用費），記下來 */
export async function markVoiceActivated(admin: Admin, cloneId: string): Promise<void> {
  const { error } = await admin
    .from("voice_clones")
    .update({ activated_at: new Date().toISOString(), expires_at: null, activating_until: null })
    .eq("id", cloneId)
    .is("activated_at", null);
  if (error) console.warn("[voice-clone] mark activated failed:", error.message);
}

export const FIRST_USE_BUSY_MESSAGE = "正在準備你的聲音（第一次比較久），請等一下再試";
