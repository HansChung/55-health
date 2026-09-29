/**
 * 出遊回憶影片 — 伺服器端：DB 列 ↔ 前端格式、向影片平台（lk888）同步任務狀態
 * 成功後把影片下載轉存到自己的 Storage，不依賴平台 CDN 網址長期有效
 */

import { createSupabaseAdmin } from "../supabase/server";
import { trackAiUsage } from "./usage-tracker";
import { calculateCost } from "./pricing";
import { queryVideoTask, VIDEO_RESOLUTION } from "./lk888-video";
import { sendPushToUser } from "../push/send";
import { composeNarratedVideo } from "./video-compose";
import {
  TRAVEL_VIDEO_DURATION_SECONDS,
  buildSubtitleCues,
  isTravelVideoPending,
  type TravelVideo,
  type TravelVideoStatus,
  type TravelVideoStyleId,
} from "../travel-video";

export const TRAVEL_VIDEO_BUCKET = "travel-videos";

/** 口白音檔路徑：試聽時存好，送出影片時用 id 取回（路徑含 user id，別人拿不到） */
export function narrationStoragePath(userId: string, narrationId: string): string {
  return `${userId}/narrations/${narrationId}.wav`;
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
  narration_path?: string | null;
  narration_seconds?: number | null;
  duration_seconds?: number | null;
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
  };
}

/** 只在狀態仍是 queued/running 時才改（避免兩個輪詢同時進來重複記帳） */
async function finishRow(
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
async function notifyOwner(row: TravelVideoRow): Promise<void> {
  const where = row.place ? `「${row.place}」的` : "";
  const message =
    row.status === "succeeded"
      ? { title: "🎬 出遊影片做好了！", body: `${where}回憶影片做好了，點這裡播放、分享給家人` }
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

async function reloadRow(admin: Admin, row: TravelVideoRow): Promise<TravelVideoRow> {
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
  let composeNote: string | null = null;
  try {
    const res = await fetch(task.videoUrl, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    let buf: Buffer = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_VIDEO_BYTES) throw new Error(`video too large: ${buf.byteLength}`);

    if (row.narration_path && row.narration_text) {
      try {
        buf = await composeWithNarration(admin, row, buf);
      } catch (e) {
        console.error("[travel-video] compose narration failed:", e);
        // 還在時限內就下次再試；超過時限至少給長輩原始影片（沒有口白字幕）
        if (!stale) return row;
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
    ...(composeNote ? { error_message: composeNote } : {}),
  });
  // 另一個輪詢請求已經處理完（也已記帳）
  if (!updated) return reloadRow(admin, row);

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
async function composeWithNarration(admin: Admin, row: TravelVideoRow, video: Buffer): Promise<Buffer> {
  const { data, error } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).download(row.narration_path!);
  if (error || !data) throw error ?? new Error("narration audio missing");
  const narration = Buffer.from(await data.arrayBuffer());
  const cues = buildSubtitleCues(
    row.narration_text!,
    Number(row.narration_seconds ?? 0),
    row.duration_seconds ?? TRAVEL_VIDEO_DURATION_SECONDS
  );
  return composeNarratedVideo({ video, narration, cues });
}
