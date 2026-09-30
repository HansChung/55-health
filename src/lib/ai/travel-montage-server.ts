/**
 * 多張照片遊記影片 — 伺服器端製作流程（每次畫面輪詢做一段，不會超過 60 秒）：
 *   1. 配音：每張照片那一句話同時送去 AI 配音（邁笙 gem-3.1-tts），音檔存 Storage
 *   2. 片段：一張一張做成「慢慢移動＋字幕」的小片段（時間夠就連做好幾張），存 Storage
 *   3. 合成：片段直接接起來＋口白依序疊上 → video.mp4，推播通知
 * 同一支遊記同時只讓一個請求處理（lease_until 租約）；每一步做完就存進度，中斷了下次接著做
 */

import { createSupabaseAdmin } from "../supabase/server";
import { trackAiUsage } from "./usage-tracker";
import { synthesizeNarration } from "./lk888-tts";
import { claimOrAwaitFirstUse, markVoiceActivated, releaseFirstUse, resolveSpeaker } from "./voice-clone-server";
import { ComposeBudgetError, fetchSubtitleFont } from "./video-compose";
import { MIN_CLIP_BUDGET_MS, muxMontage, renderMontageClip } from "./montage-compose";
import { isPublicHttpsUrl } from "./travel-video-webhook";
import {
  TRAVEL_VIDEO_BUCKET,
  finishRow,
  notifyOwner,
  reloadRow,
  type TravelVideoRow,
} from "./travel-video-server";
import {
  DEFAULT_NARRATION_ACCENT,
  NARRATION_ACCENT_IDS,
  NARRATION_VOICE_CHOICES,
  isTravelVideoPending,
  montageStage,
  type MontageState,
  type NarrationAccentId,
  type NarrationVoiceChoice,
} from "../travel-video";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export const MONTAGE_ENDPOINT = "/api/ai/travel-video/montage";
/** 遊記都在自己伺服器做，通常 1～3 分鐘；超過這個時間還沒好就放棄（不扣次數） */
export const MONTAGE_STALE_MS = 30 * 60 * 1000;
/** 同一步連續失敗幾次就放棄 */
export const MONTAGE_MAX_ATTEMPTS = 5;
/** 字型抓不到時，第幾次重試起改成不上字幕（至少把影片交出去） */
const NO_SUBTITLE_AFTER_ATTEMPTS = 3;
/** 租約：比一次處理的時間長一點，處理到一半當掉的話過期後別人可以接手 */
const LEASE_MS = 70_000;
/** 一次處理的工作時間（route maxDuration 60 秒，留時間上傳、寫 DB） */
const WORK_BUDGET_MS = 45_000;
/** 合成＋上傳至少要留這麼多時間，不夠就下次輪詢再合成 */
const FINAL_MIN_MS = 10_000;
const FONT_TIMEOUT_MS = 8_000;

export function montagePhotoPath(userId: string, videoId: string, index: number): string {
  return `${userId}/${videoId}/photo-${index}.jpg`;
}
export function montageAudioPath(row: Pick<TravelVideoRow, "user_id" | "id">, index: number): string {
  return `${row.user_id}/${row.id}/line-${index}.wav`;
}
export function montageClipPath(row: Pick<TravelVideoRow, "user_id" | "id">, index: number): string {
  return `${row.user_id}/${row.id}/clip-${index}.mp4`;
}
export function montageVideoPath(row: Pick<TravelVideoRow, "user_id" | "id">): string {
  return `${row.user_id}/${row.id}/video.mp4`;
}

/** 做好之後就用不到的中間檔（配音、片段） */
export function montageIntermediatePaths(row: Pick<TravelVideoRow, "user_id" | "id">, count: number): string[] {
  return Array.from({ length: count }, (_, i) => [montageAudioPath(row, i), montageClipPath(row, i)]).flat();
}

/** 刪除遊記時要清掉的全部檔案 */
export function montageAllPaths(row: Pick<TravelVideoRow, "user_id" | "id" | "montage">): string[] {
  const count = row.montage?.photos.length ?? 0;
  return [
    ...(row.montage?.photos.map((p) => p.path) ?? []),
    ...montageIntermediatePaths(row, count),
    montageVideoPath(row),
  ];
}

/** 背景接力的端點（/api/cron/* 不受 rate limit，用 CRON_SECRET 驗證） */
export const MONTAGE_STEP_PATH = "/api/cron/montage-step";

/**
 * 背景接力網址：優先用正式網址（NEXT_PUBLIC_APP_URL），沒有才用這次請求的網址。
 * 沒設 CRON_SECRET 就不接力（只靠畫面輪詢推進）
 */
export function montageContinueUrl(
  env: Record<string, string | undefined>,
  requestOrigin?: string | null
): string | null {
  if (!env.CRON_SECRET) return null;
  const app = env.NEXT_PUBLIC_APP_URL;
  const base = app && isPublicHttpsUrl(app) ? app : requestOrigin;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}${MONTAGE_STEP_PATH}`;
}

/** 上一步失敗過：接力前先等一下再試（避免服務短暫忙線時連續失敗 5 次就放棄） */
export function montageRetryDelayMs(attempts: number): number {
  return Math.min(12_000, Math.max(0, attempts) * 4_000);
}

/** 叫下一棒：對方收到就馬上回 202，在它自己的函式裡做下一段 */
async function scheduleContinuation(videoId: string, origin: string | null | undefined): Promise<void> {
  const url = montageContinueUrl(process.env, origin);
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: videoId }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) console.warn(`[montage] continuation HTTP ${res.status}`);
  } catch (e) {
    console.warn("[montage] continuation failed:", e);
  }
}

function voiceOf(row: TravelVideoRow): NarrationVoiceChoice {
  const v = row.narration_voice as NarrationVoiceChoice | null | undefined;
  return v && NARRATION_VOICE_CHOICES.includes(v) ? v : "female";
}

function accentOf(row: TravelVideoRow): NarrationAccentId {
  const a = row.narration_accent as NarrationAccentId | null | undefined;
  return a && NARRATION_ACCENT_IDS.includes(a) ? a : DEFAULT_NARRATION_ACCENT;
}

/** 重試也沒用的錯誤（例如選的「我的聲音」被刪掉、過期）→ 直接失敗，不扣次數 */
class MontageFatalError extends Error {}

/** 搶租約：沒人在處理（或上一個處理者逾時）才拿得到 */
async function acquireLease(admin: Admin, row: TravelVideoRow): Promise<TravelVideoRow | null> {
  const now = new Date();
  const { data, error } = await admin
    .from("travel_videos")
    .update({
      lease_until: new Date(now.getTime() + LEASE_MS).toISOString(),
      status: "running",
      updated_at: now.toISOString(),
    })
    .eq("id", row.id)
    .in("status", ["queued", "running"])
    .or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`)
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[montage] lease failed:", error);
    return null;
  }
  return (data as TravelVideoRow | null) ?? null;
}

async function saveState(
  admin: Admin,
  row: TravelVideoRow,
  state: MontageState,
  extra: Partial<TravelVideoRow> = {}
): Promise<TravelVideoRow> {
  const patch = { montage: state, updated_at: new Date().toISOString(), ...extra };
  const { error } = await admin.from("travel_videos").update(patch).eq("id", row.id).in("status", ["queued", "running"]);
  if (error) throw new Error(`save montage state failed: ${error.message}`);
  return { ...row, ...patch } as TravelVideoRow;
}

async function download(admin: Admin, storagePath: string): Promise<Buffer> {
  const { data, error } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).download(storagePath);
  if (error || !data) throw new Error(`download ${storagePath} failed: ${error?.message ?? "missing"}`);
  return Buffer.from(await data.arrayBuffer());
}

async function upload(admin: Admin, storagePath: string, body: Buffer, contentType: string, cache = false) {
  const { error } = await admin.storage
    .from(TRAVEL_VIDEO_BUCKET)
    .upload(storagePath, body, { contentType, upsert: true, ...(cache ? { cacheControl: "31536000" } : {}) });
  if (error) throw new Error(`upload ${storagePath} failed: ${error.message}`);
}

/**
 * 1. 配音：還沒配的句子同時送出；成功的先存起來，有失敗就丟錯（下次只補失敗的）。
 * 「我的聲音」還沒啟用時先只配第一句（平台第一次合成收啟用費，不能同時送好幾句），成功後其餘再一起送
 */
async function runTts(admin: Admin, row: TravelVideoRow, state: MontageState): Promise<MontageState> {
  const voice = voiceOf(row);
  const accent = accentOf(row);
  // 建立遊記時已檢查過方案，背景配音不再擋（避免做到一半因方案到期失敗）
  const resolved = await resolveSpeaker(admin, { userId: row.user_id, tier: "", voice, accent, checkTier: false });
  if (!resolved.ok) throw new MontageFatalError(`voice unavailable: ${resolved.error}`);
  const { speaker } = resolved;
  const service = speaker.kind === "clone" ? "minimax_tts" : "gemini_tts";

  type Line = { p: MontageState["photos"][number]; i: number };
  const synthOne = async ({ p, i }: Line) => {
    const tts = await synthesizeNarration(p.line, speaker);
    const audioPath = montageAudioPath(row, i);
    await upload(admin, audioPath, tts.audio, "audio/wav");
    await trackAiUsage({
      userId: row.user_id,
      service,
      model: tts.model,
      endpoint: MONTAGE_ENDPOINT,
      success: true,
      metadata: {
        provider: "lk888",
        video_id: row.id,
        voice,
        accent: speaker.kind === "preset" ? accent : null,
        ...(resolved.cloneId ? { voice_clone_id: resolved.cloneId } : {}),
        chars: [...p.line].length,
        seconds: Number(tts.seconds.toFixed(2)),
        task_id: tts.taskId,
        platform_cost: tts.platformCost,
      },
    });
    return { i, audioPath, seconds: tts.seconds };
  };

  let todo: Line[] = state.photos.map((p, i) => ({ p, i })).filter(({ p }) => !p.audio_path);
  let results: PromiseSettledResult<Awaited<ReturnType<typeof synthOne>>>[] = [];
  const firstUse =
    resolved.cloneId && !resolved.activated && todo.length > 0
      ? await claimOrAwaitFirstUse(admin, resolved.cloneId)
      : null;
  // 別的請求正在做第一次配音（例如同時在試聽），等了還沒好 → 這次先不做，下次再接著做
  if (firstUse === "busy") throw new ComposeBudgetError();
  if (resolved.cloneId && firstUse === "claimed") {
    // 這次只配第一句（第一次比較慢），其餘下一輪再一起送，免得超過 60 秒
    results = await Promise.allSettled([synthOne(todo[0])]);
    if (results[0].status === "fulfilled") await markVoiceActivated(admin, resolved.cloneId);
    else await releaseFirstUse(admin, resolved.cloneId);
    todo = [];
  }
  results = results.concat(await Promise.allSettled(todo.map(synthOne)));

  const next: MontageState = { ...state, photos: state.photos.map((p) => ({ ...p })) };
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      next.photos[r.value.i].audio_path = r.value.audioPath;
      next.photos[r.value.i].narration_seconds = Number(r.value.seconds.toFixed(2));
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      errors.push(msg);
      await trackAiUsage({
        userId: row.user_id,
        service,
        model: speaker.kind === "clone" ? "speech-2.8" : "gem-3.1-tts",
        endpoint: MONTAGE_ENDPOINT,
        success: false,
        errorMessage: msg,
        metadata: { video_id: row.id, voice },
      });
    }
  }
  if (errors.length > 0) {
    await saveState(admin, row, next);
    throw new Error(`tts failed (${errors.length}): ${errors[0]}`);
  }
  return next;
}

/** 2. 片段：時間夠就一張接一張做，每做好一張就存進度 */
async function runClips(
  admin: Admin,
  row: TravelVideoRow,
  state: MontageState,
  deadline: number
): Promise<{ row: TravelVideoRow; state: MontageState }> {
  let font: Buffer | null = null;
  const allText = state.photos.map((p) => p.line).join("");
  try {
    font = await fetchSubtitleFont(allText, Math.min(FONT_TIMEOUT_MS, Math.max(1_000, deadline - Date.now() - MIN_CLIP_BUDGET_MS)));
  } catch (e) {
    if (state.attempts < NO_SUBTITLE_AFTER_ATTEMPTS) throw e;
    console.warn("[montage] subtitle font unavailable, rendering without subtitles:", e);
  }

  let current = row;
  let next = state;
  for (let i = 0; i < next.photos.length; i++) {
    if (next.photos[i].clip_path) continue;
    if (deadline - Date.now() < MIN_CLIP_BUDGET_MS) throw new ComposeBudgetError();
    const photo = next.photos[i];
    const { clip, seconds } = await renderMontageClip({
      photo: await download(admin, photo.path),
      line: photo.line,
      narrationSeconds: Number(photo.narration_seconds ?? 0),
      size: next.size,
      variant: i,
      font,
      deadline,
    });
    const clipPath = montageClipPath(row, i);
    await upload(admin, clipPath, clip, "video/mp4");
    next = {
      ...next,
      attempts: 0,
      photos: next.photos.map((p, j) => (j === i ? { ...p, clip_path: clipPath, clip_seconds: seconds } : p)),
    };
    current = await saveState(admin, current, next, { error_message: null });
  }
  return { row: current, state: next };
}

/** 3. 合成：片段＋口白 → video.mp4，標記完成並推播 */
async function runFinal(admin: Admin, row: TravelVideoRow, state: MontageState, deadline: number): Promise<TravelVideoRow> {
  const clips = await Promise.all(state.photos.map((p) => download(admin, p.clip_path!)));
  const narrations = await Promise.all(state.photos.map((p) => download(admin, p.audio_path!)));
  const clipSeconds = state.photos.map((p) => Number(p.clip_seconds ?? 0));
  const video = await muxMontage({ clips, narrations, clipSeconds, deadline });
  const videoPath = montageVideoPath(row);
  await upload(admin, videoPath, video, "video/mp4", true);

  const total = clipSeconds.reduce((a, b) => a + b, 0);
  const updated = await finishRow(admin, row, {
    status: "succeeded",
    video_path: videoPath,
    duration_seconds: Math.round(total),
    montage: { ...state, attempts: 0 },
    lease_until: null,
    error_message: null,
  });
  if (!updated) return reloadRow(admin, row);
  await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(montageIntermediatePaths(row, state.photos.length));
  await notifyOwner(updated);
  return updated;
}

async function failMontage(admin: Admin, row: TravelVideoRow, reason: string): Promise<TravelVideoRow> {
  const updated = await finishRow(admin, row, {
    status: "failed",
    error_message: reason.slice(0, 500),
    lease_until: null,
  });
  if (!updated) return reloadRow(admin, row);
  const count = row.montage?.photos.length ?? 0;
  await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove([...montageIntermediatePaths(row, count), montageVideoPath(row)]);
  await notifyOwner(updated);
  return updated;
}

/**
 * 推進一支遊記的製作（畫面輪詢、建立後的背景工作、背景接力都會呼叫）。
 * 拿不到租約（別的請求正在做）就原樣回傳。
 * 這次有做事、而且還沒做完 → 叫下一棒接著做：長輩離開畫面也會做完並推播
 * （只有拿到租約的人會叫下一棒，所以不會越叫越多）
 */
export async function syncMontage(
  row: TravelVideoRow,
  opts: { budgetMs?: number; origin?: string | null } = {}
): Promise<TravelVideoRow> {
  const { row: result, worked } = await advanceMontage(row, opts);
  if (worked && isTravelVideoPending(result.status)) await scheduleContinuation(result.id, opts.origin);
  return result;
}

async function advanceMontage(
  row: TravelVideoRow,
  opts: { budgetMs?: number }
): Promise<{ row: TravelVideoRow; worked: boolean }> {
  if (!isTravelVideoPending(row.status) || !row.montage) return { row, worked: false };
  const admin = createSupabaseAdmin();
  if (Date.now() - new Date(row.created_at).getTime() > MONTAGE_STALE_MS) {
    return { row: await failMontage(admin, row, "montage timeout"), worked: false };
  }
  const leased = await acquireLease(admin, row);
  if (!leased?.montage) return { row, worked: false };
  return { row: await processLeased(admin, leased, opts), worked: true };
}

async function processLeased(admin: Admin, leased: TravelVideoRow, opts: { budgetMs?: number }): Promise<TravelVideoRow> {
  const deadline = Date.now() + (opts.budgetMs ?? WORK_BUDGET_MS);
  let current = leased;
  let state: MontageState = leased.montage!;
  try {
    if (montageStage(state) === "tts") {
      state = { ...(await runTts(admin, current, state)), attempts: 0 };
      current = await saveState(admin, current, state, { error_message: null });
    }
    if (montageStage(state) === "clips") {
      ({ row: current, state } = await runClips(admin, current, state, deadline));
    }
    if (montageStage(state) === "final" && deadline - Date.now() >= FINAL_MIN_MS) {
      return await runFinal(admin, current, state, deadline);
    }
    return await saveState(admin, current, state, { lease_until: null });
  } catch (e) {
    // 時間不夠不算失敗：進度都存好了，下次輪詢接著做
    if (e instanceof ComposeBudgetError) {
      return saveState(admin, current, state, { lease_until: null }).catch(() => current);
    }
    if (e instanceof MontageFatalError) return failMontage(admin, current, e.message);
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[montage] step failed:", msg);
    const fresh = ((await reloadRow(admin, current)).montage as MontageState | null) ?? state;
    const attempts = fresh.attempts + 1;
    if (attempts >= MONTAGE_MAX_ATTEMPTS) return failMontage(admin, current, `montage failed: ${msg}`);
    return saveState(admin, current, { ...fresh, attempts }, {
      lease_until: null,
      error_message: `montage retry: ${msg}`.slice(0, 500),
    }).catch(() => current);
  }
}
