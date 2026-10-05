/**
 * 出遊回憶影片 — 伺服器端：DB 列 ↔ 前端格式、向影片平台（lk888）同步任務狀態
 * 成功後把影片下載轉存到自己的 Storage，不依賴平台 CDN 網址長期有效
 */

import { createSupabaseAdmin } from "../supabase/server";
import { trackAiUsage } from "./usage-tracker";
import { calculateCost } from "./pricing";
import { queryVideoTask, VIDEO_RESOLUTION } from "./lk888-video";
import { notifyFamilyNewVideo } from "../video-comments-server";
import { sendPushToUser } from "../push/send";
import { ComposeBudgetError, composeNarratedVideo } from "./video-compose";
import {
  TRAVEL_VIDEO_DURATION_SECONDS,
  buildSubtitleCues,
  isTravelVideoPending,
  montageProgress,
  mvProgress,
  type MontageState,
  type MvState,
  type TravelVideo,
  type TravelVideoKind,
  type TravelVideoStatus,
  type TravelVideoStyleId,
} from "../travel-video";

export const TRAVEL_VIDEO_BUCKET = "travel-videos";

/** 口白音檔路徑：試聽時存好，送出影片時用 id 取回（路徑含 user id，別人拿不到） */
export function narrationStoragePath(userId: string, narrationId: string): string {
  return `${userId}/narrations/${narrationId}.wav`;
}

/** 有口白的影片：合成前的原始影片暫存處（合成完成後刪掉） */
export function rawVideoStoragePath(row: Pick<TravelVideoRow, "user_id" | "id">): string {
  return `${row.user_id}/${row.id}/raw.mp4`;
}

/** 挑出超過 TTL、而且沒有被任何影片用到的試聽音檔 */
export function selectStaleNarrationPaths(
  files: Array<{ name: string; created_at?: string | null }>,
  folder: string,
  attached: Set<string>,
  now = Date.now()
): string[] {
  return files
    .filter((f) => f.created_at && now - new Date(f.created_at).getTime() > NARRATION_PREVIEW_TTL_MS)
    .map((f) => `${folder}/${f.name}`)
    .filter((p) => !attached.has(p));
}

/** 清掉這個人試聽過但沒用上的舊口白（重新試聽、中途離開、送出失敗都會留下） */
export async function cleanupStaleNarrations(userId: string): Promise<number> {
  const admin = createSupabaseAdmin();
  const folder = `${userId}/narrations`;
  const { data: files, error } = await admin.storage
    .from(TRAVEL_VIDEO_BUCKET)
    .list(folder, { limit: 100, sortBy: { column: "created_at", order: "asc" } });
  if (error || !files?.length) return 0;
  const candidates = selectStaleNarrationPaths(files, folder, new Set<string>());
  if (candidates.length === 0) return 0;
  const { data: used } = await admin.from("travel_videos").select("narration_path").in("narration_path", candidates);
  const attached = new Set<string>((used ?? []).map((r: { narration_path: string }) => r.narration_path));
  const stale = selectStaleNarrationPaths(files, folder, attached);
  if (stale.length) await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(stale);
  return stale.length;
}

async function downloadStored(admin: Admin, storagePath: string): Promise<Buffer | null> {
  const { data, error } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).download(storagePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
/** 推播點下去直接打開出遊影片頁 */
export const TRAVEL_VIDEO_DEEP_LINK = "/?open=travel-video";
/**
 * 超過這個時間還沒做好（或一直查不到）就當失敗，不扣次數。
 * 平台文件：影片常見 5～60 分鐘，超過 2 小時可視為逾時
 */
export const TRAVEL_VIDEO_STALE_MS = 2 * 60 * 60 * 1000;

/**
 * 已超過該放棄的時間。沒記到 task_id 的列（建立逾時、寫入失敗）也等滿 2 小時：
 * 平台完成回呼要等影片做好才送（常見 5～60 分鐘），太早放棄會丟掉已付費的影片
 */
export function isPastDeadline(row: Pick<TravelVideoRow, "created_at">): boolean {
  return Date.now() - new Date(row.created_at).getTime() > TRAVEL_VIDEO_STALE_MS;
}
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
/** 平台 CDN 可能要 20～45 秒才回完影片 */
const VIDEO_DOWNLOAD_TIMEOUT_MS = 45_000;
/** 有口白時：下載超過這個時間就先存原始影片，合成留給下次輪詢 */
const COMPOSE_START_BUDGET_MS = 20_000;
/**
 * 同步一支影片的工作時間上限（route maxDuration 60 秒，留約 12 秒給最後上傳、寫 DB、推播）。
 * 抓字型、ffmpeg 都在這個期限內；不夠就下次輪詢再合成（原始影片已存在 Storage，下次很快）
 */
const SYNC_WORK_BUDGET_MS = 48_000;
/** 試聽過但沒用上的口白音檔，超過這個時間就清掉 */
export const NARRATION_PREVIEW_TTL_MS = 60 * 60 * 1000;

export interface TravelVideoRow {
  id: string;
  user_id: string;
  status: TravelVideoStatus;
  style: TravelVideoStyleId;
  place: string | null;
  prompt: string;
  model: string;
  task_id: string | null;
  photo_path: string | null;
  video_path: string | null;
  error_message: string | null;
  cost_usd: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  deleted_at: string | null;
  // 口白＋字幕（add-travel-video-narration.sql；沒選口白時為 null／沒有這些欄位）
  narration_text?: string | null;
  narration_voice?: string | null;
  /** add-narration-voices.sql：口音；用自己的聲音時是 null */
  narration_accent?: string | null;
  narration_path?: string | null;
  narration_seconds?: number | null;
  duration_seconds?: number | null;
  // 多張照片遊記（add-travel-video-montage.sql；舊資料沒有這些欄位）
  kind?: TravelVideoKind | null;
  montage?: MontageState | null;
  /** add-travel-video-mv.sql：MV 的歌詞、歌、片段 */
  mv?: MvState | null;
  lease_until?: string | null;
}

type Admin = ReturnType<typeof createSupabaseAdmin>;

export function toClientVideo(admin: Admin, row: TravelVideoRow): TravelVideo {
  const bucket = admin.storage.from(TRAVEL_VIDEO_BUCKET);
  return {
    id: row.id,
    status: row.status,
    style: row.style,
    place: row.place,
    photo_url: row.photo_path ? bucket.getPublicUrl(row.photo_path).data.publicUrl : null,
    video_url: row.video_path ? bucket.getPublicUrl(row.video_path).data.publicUrl : null,
    download_url: row.video_path
      ? bucket.getPublicUrl(row.video_path, { download: "nuannuan-trip-video.mp4" }).data.publicUrl
      : null,
    created_at: row.created_at,
    completed_at: row.completed_at,
    narration_text: row.narration_text ?? null,
    kind: row.kind === "montage" || row.kind === "mv" ? row.kind : "single",
    montage_lines: row.kind === "montage" && row.montage ? row.montage.photos.map((p) => p.line) : null,
    montage_progress:
      row.kind === "montage" && row.montage && isTravelVideoPending(row.status) ? montageProgress(row.montage) : null,
    mv:
      row.kind === "mv" && row.mv
        ? {
            title: row.mv.title,
            lyrics: row.mv.lyrics,
            language: row.mv.language,
            style: row.mv.style,
            is_variant: Boolean(row.mv.variant_of),
            alt_available: Boolean(row.mv.alt_song_path) && !row.mv.variant_of,
          }
        : null,
    mv_progress: row.kind === "mv" && row.mv && isTravelVideoPending(row.status) ? mvProgress(row.mv) : null,
  };
}

/** 只在狀態仍是 queued/running 時才改（避免兩個輪詢同時進來重複記帳） */
export async function finishRow(
  admin: Admin,
  row: TravelVideoRow,
  patch: Partial<TravelVideoRow>
): Promise<TravelVideoRow | null> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("travel_videos")
    .update({ ...patch, updated_at: now, completed_at: now })
    .eq("id", row.id)
    .in("status", ["queued", "running"])
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[travel-video] finish update failed:", error);
    return null;
  }
  return (data as TravelVideoRow | null) ?? null;
}

/** 影片做好／失敗時推播給本人（沒訂閱推播或沒設 VAPID 就什麼都不做） */
export async function notifyOwner(row: TravelVideoRow): Promise<void> {
  const where = row.place ? `「${row.place}」的` : "";
  const montage = row.kind === "montage";
  const mvTitle = row.mv?.title ? `「${row.mv.title}」` : "";
  const message =
    row.kind === "mv"
      ? row.status === "succeeded"
        ? { title: "🎵 MV 做好了！", body: `${mvTitle}MV 做好了，點這裡播放、分享給家人` }
        : { title: "MV 這次沒做成功", body: "不會扣次數，請再做一次試試看" }
      : row.status === "succeeded"
      ? montage
        ? { title: "📚 遊記影片做好了！", body: `${where}遊記影片做好了，點這裡播放、分享給家人` }
        : { title: "🎬 出遊影片做好了！", body: `${where}回憶影片做好了，點這裡播放、分享給家人` }
      : montage
        ? { title: "遊記影片這次沒做成功", body: "不會扣次數，請再做一次試試看" }
        : { title: "出遊影片這次沒做成功", body: "不會扣次數，換張照片再試試看" };
  try {
    await sendPushToUser(row.user_id, {
      ...message,
      url: TRAVEL_VIDEO_DEEP_LINK,
      tag: `travel-video-${row.id}`,
    });
  } catch (e) {
    console.warn("[travel-video] push failed:", e);
  }
  // 做好了也告訴家人（長輩沒關掉「出遊影片」權限的）
  if (row.status === "succeeded") await notifyFamilyNewVideo(row);
}

async function markFailed(admin: Admin, row: TravelVideoRow, reason: string): Promise<TravelVideoRow> {
  const updated = await finishRow(admin, row, { status: "failed", error_message: reason.slice(0, 500) });
  if (updated) {
    await trackAiUsage({
      userId: row.user_id,
      service: "minimax_video",
      model: row.model,
      endpoint: "/api/ai/travel-video",
      success: false,
      errorMessage: reason,
      metadata: { video_id: row.id, task_id: row.task_id },
    });
    await notifyOwner(updated);
    return updated;
  }
  return { ...row, status: "failed", error_message: reason };
}

export async function reloadRow(admin: Admin, row: TravelVideoRow): Promise<TravelVideoRow> {
  const { data } = await admin.from("travel_videos").select("*").eq("id", row.id).maybeSingle();
  return (data as TravelVideoRow | null) ?? row;
}

/**
 * 向影片平台查詢進行中的任務並更新 DB。
 * 做好了 → 下載影片存到 Storage、記帳；失敗／逾時 → 標記失敗（不扣次數）
 */
export async function syncTravelVideo(row: TravelVideoRow): Promise<TravelVideoRow> {
  if (!isTravelVideoPending(row.status)) return row;

  const admin = createSupabaseAdmin();
  const stale = isPastDeadline(row);

  if (!row.task_id) {
    // 建立任務逾時或寫入失敗（還沒記到 task_id）
    return stale ? markFailed(admin, row, "missing task_id") : row;
  }

  let task;
  try {
    task = await queryVideoTask(row.task_id);
  } catch (e) {
    console.error("[travel-video] query failed:", e);
    return stale ? markFailed(admin, row, "query failed: timeout") : row;
  }

  if (task.status === "failed") {
    return markFailed(admin, row, task.errorMessage ?? "failed");
  }

  if (task.status === "queued" || task.status === "running") {
    if (stale) return markFailed(admin, row, `timeout while ${task.status}`);
    if (task.status !== row.status) {
      await admin
        .from("travel_videos")
        .update({ status: task.status, updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .in("status", ["queued", "running"]);
      return { ...row, status: task.status };
    }
    return row;
  }

  // succeeded
  if (!task.videoUrl) return markFailed(admin, row, "succeeded without video url");

  // 下載 +（有口白就合成）+ 轉存。失敗就先維持 running，下次輪詢再試
  const videoPath = `${row.user_id}/${row.id}/video.mp4`;
  const rawPath = rawVideoStoragePath(row);
  const narrated = Boolean(row.narration_path && row.narration_text);
  const startedAt = Date.now();
  let composeNote: string | null = null;
  try {
    // 有口白：上次可能已把原始影片存在自己的 Storage，就不用再等平台 CDN
    let buf: Buffer | null = narrated ? await downloadStored(admin, rawPath) : null;
    if (!buf) {
      const res = await fetch(task.videoUrl, { signal: AbortSignal.timeout(VIDEO_DOWNLOAD_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`download HTTP ${res.status}`);
      buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > MAX_VIDEO_BYTES) throw new Error(`video too large: ${buf.byteLength}`);
      if (narrated) {
        const { error: rawErr } = await admin.storage
          .from(TRAVEL_VIDEO_BUCKET)
          .upload(rawPath, buf, { contentType: "video/mp4", upsert: true });
        if (rawErr) throw rawErr;
        // 下載花太久：原始影片已存好，合成留給下次輪詢，免得超過 route 時限
        if (Date.now() - startedAt > COMPOSE_START_BUDGET_MS) return row;
      }
    }

    if (narrated) {
      try {
        buf = await composeWithNarration(admin, row, buf, startedAt + SYNC_WORK_BUDGET_MS);
      } catch (e) {
        // 時間不夠不算失敗：原始影片已在 Storage，下次輪詢直接合成（超過時限就走下面交付原始影片）
        if (e instanceof ComposeBudgetError && !stale) return row;
        console.error("[travel-video] compose narration failed:", e);
        // 還在時限內就下次再試；超過時限至少給長輩原始影片（沒有口白字幕）
        if (!stale) {
          // 把原因記在 DB（狀態仍是製作中），不用翻 Vercel log 也查得到；成功時會清掉
          await admin
            .from("travel_videos")
            .update({ error_message: `compose retry: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500) })
            .eq("id", row.id)
            .in("status", ["queued", "running"]);
          return row;
        }
        composeNote = `compose failed, delivered without narration: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500);
      }
    }

    const { error: upErr } = await admin.storage
      .from(TRAVEL_VIDEO_BUCKET)
      .upload(videoPath, buf, { contentType: "video/mp4", cacheControl: "31536000", upsert: true });
    if (upErr) throw upErr;
  } catch (e) {
    console.error("[travel-video] store video failed:", e);
    // 超過時限還存不下來就放棄（標記失敗、退回次數），不要永遠卡在「製作中」
    return stale ? markFailed(admin, row, `store video failed: ${e instanceof Error ? e.message : String(e)}`) : row;
  }

  const seconds = row.duration_seconds ?? TRAVEL_VIDEO_DURATION_SECONDS;
  const updated = await finishRow(admin, row, {
    status: "succeeded",
    video_path: videoPath,
    cost_usd: calculateCost({ model: row.model, videoOutputSeconds: seconds }),
    // 成功就清掉先前重試留下的 "compose retry:"；合成失敗改交付原始影片時保留原因
    error_message: composeNote,
  });
  // 另一個輪詢請求已經處理完（也已記帳）
  if (!updated) return reloadRow(admin, row);
  if (narrated) await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove([rawPath]);

  await trackAiUsage({
    userId: row.user_id,
    service: "minimax_video",
    model: row.model,
    videoOutputSeconds: seconds,
    endpoint: "/api/ai/travel-video",
    success: true,
    metadata: {
      video_id: row.id,
      task_id: row.task_id,
      seconds,
      resolution: VIDEO_RESOLUTION,
      provider: "lk888",
      platform_cost: task.platformCost, // 平台算力值（實際扣費）；cost_usd 為依官方單價的估算
    },
  });
  await notifyOwner(updated);
  return updated;
}

/** 取回試聽時存好的口白音檔，疊到影片上並燒入字幕 */
async function composeWithNarration(
  admin: Admin,
  row: TravelVideoRow,
  video: Buffer,
  deadline: number
): Promise<Buffer> {
  const { data, error } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).download(row.narration_path!);
  if (error || !data) throw error ?? new Error("narration audio missing");
  const narration = Buffer.from(await data.arrayBuffer());
  const cues = buildSubtitleCues(
    row.narration_text!,
    Number(row.narration_seconds ?? 0),
    row.duration_seconds ?? TRAVEL_VIDEO_DURATION_SECONDS
  );
  return composeNarratedVideo({ video, narration, cues, deadline });
}
