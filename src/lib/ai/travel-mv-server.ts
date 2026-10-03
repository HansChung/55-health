/**
 * 遊記 MV — 伺服器端製作流程（跟遊記一樣一段一段做，每次不超過 60 秒）：
 *   1. 做歌：等邁笙 Suno 做好（約 1～3 分鐘；等的時候每 5 秒查一次）→ 兩個版本都轉成 m4a 存起來，依歌長排好分段
 *   2. 片段：照片輪流做成「慢慢移動」的小片段（第一段上歌名），時間夠就連做好幾段
 *   3. 合成：片段接起來＋整首歌（淡入淡出）→ video.mp4，推播
 * 租約、背景接力、上傳下載沿用遊記（travel-montage-server）
 */

import { createSupabaseAdmin } from "../supabase/server";
import { trackAiUsage } from "./usage-tracker";
import { queryVideoTask } from "./lk888-video";
import { SONG_MODEL } from "./lk888-music";
import { musicToM4a } from "./audio-convert";
import { ComposeBudgetError, fetchSubtitleFont } from "./video-compose";
import { MIN_CLIP_BUDGET_MS, muxMv, renderMontageClip } from "./montage-compose";
import { acquireLease, download, scheduleContinuation, upload } from "./travel-montage-server";
import { TRAVEL_VIDEO_BUCKET, finishRow, notifyOwner, reloadRow, type TravelVideoRow } from "./travel-video-server";
import { MV_MAX_SECONDS, isTravelVideoPending, mvSegments, mvStage, type MvState } from "../travel-video";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export const MV_ENDPOINT = "/api/ai/travel-video/mv";
/** 做歌最久幾分鐘＋剪 3 分鐘的片段：超過就放棄（失敗不扣次數，平台也會退款） */
export const MV_STALE_MS = 45 * 60 * 1000;
const MV_MAX_ATTEMPTS = 5;
const WORK_BUDGET_MS = 45_000;
/** 合成要下載全部片段＋歌、接起來、上傳 */
const FINAL_MIN_MS = 15_000;
const SONG_POLL_MS = 5_000;
const FONT_TIMEOUT_MS = 8_000;
/** 第一段畫面上歌名幾秒 */
const TITLE_SECONDS = 4;

export function mvPhotoPath(row: Pick<TravelVideoRow, "user_id" | "id">, index: number): string {
  return `${row.user_id}/${row.id}/photo-${index}.jpg`;
}
export function mvSongPath(row: Pick<TravelVideoRow, "user_id" | "id">, version: number): string {
  return `${row.user_id}/${row.id}/song-${version}.m4a`;
}
export function mvClipPath(row: Pick<TravelVideoRow, "user_id" | "id">, index: number): string {
  return `${row.user_id}/${row.id}/clip-${index}.mp4`;
}
export function mvVideoPath(row: Pick<TravelVideoRow, "user_id" | "id">): string {
  return `${row.user_id}/${row.id}/video.mp4`;
}

/** 刪除 MV 時要清掉的全部檔案 */
export function mvAllPaths(row: Pick<TravelVideoRow, "user_id" | "id" | "mv">): string[] {
  const state = row.mv;
  return [
    ...(state?.photos.map((p) => p.path) ?? []),
    mvSongPath(row, 1),
    mvSongPath(row, 2),
    ...(state?.segments ?? []).map((_, i) => mvClipPath(row, i)),
    mvVideoPath(row),
  ];
}

/** 重試也沒用的錯誤（例如做歌失敗）→ 直接失敗，不扣次數 */
class MvFatalError extends Error {}

async function saveMv(admin: Admin, row: TravelVideoRow, state: MvState, extra: Partial<TravelVideoRow> = {}): Promise<TravelVideoRow> {
  const patch = { mv: state, updated_at: new Date().toISOString(), ...extra };
  const { error } = await admin.from("travel_videos").update(patch).eq("id", row.id).in("status", ["queued", "running"]);
  if (error) throw new Error(`save mv state failed: ${error.message}`);
  return { ...row, ...patch } as TravelVideoRow;
}

/**
 * 1. 等歌做好：做好就轉檔存起來、排好分段。
 * wait＝背景接力在跑：時間內每 5 秒查一次；畫面輪詢只查一次（不讓清單請求卡 45 秒）
 */
async function runSong(admin: Admin, row: TravelVideoRow, state: MvState, deadline: number, wait: boolean): Promise<MvState> {
  if (!state.task_id) throw new MvFatalError("song task missing");
  for (;;) {
    const task = await queryVideoTask(state.task_id, 10_000);
    if (task.status === "failed") throw new MvFatalError(`song failed: ${task.errorMessage ?? "unknown"}`);
    if (task.status === "succeeded" && task.videoUrl) {
      const urls = (task.urls?.length ? task.urls : [task.videoUrl]).slice(0, 2);
      const songs = await Promise.all(
        urls.map(async (url) => {
          const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
          if (!res.ok) throw new Error(`song download HTTP ${res.status}`);
          return musicToM4a(Buffer.from(await res.arrayBuffer()), MV_MAX_SECONDS);
        })
      );
      const [first, second] = songs;
      if (!first || first.seconds < 10) throw new MvFatalError(`song too short: ${first?.seconds ?? 0}s`);
      await upload(admin, mvSongPath(row, 1), first.m4a, "audio/mp4");
      if (second) await upload(admin, mvSongPath(row, 2), second.m4a, "audio/mp4");
      await trackAiUsage({
        userId: row.user_id,
        service: "suno_music",
        model: SONG_MODEL,
        endpoint: MV_ENDPOINT,
        success: true,
        metadata: {
          provider: "lk888",
          video_id: row.id,
          task_id: state.task_id,
          platform_cost: task.platformCost,
          seconds: Number(first.seconds.toFixed(1)),
          language: state.language,
          style: state.style,
        },
      });
      return {
        ...state,
        song_path: mvSongPath(row, 1),
        alt_song_path: second ? mvSongPath(row, 2) : null,
        song_seconds: Number(first.seconds.toFixed(2)),
        segments: mvSegments(first.seconds, state.photos.length),
        attempts: 0,
      };
    }
    // 還在做：不等，或時間不夠再等一輪，就先回去（下一棒／下次輪詢接著查）
    if (!wait || deadline - Date.now() < SONG_POLL_MS + 10_000) return state;
    await new Promise((r) => setTimeout(r, SONG_POLL_MS));
  }
}

/** 2. 片段：第一段上歌名，其餘只有畫面；照片在這一輪裡共用下載 */
async function runClips(
  admin: Admin,
  row: TravelVideoRow,
  state: MvState,
  deadline: number
): Promise<{ row: TravelVideoRow; state: MvState }> {
  const segments = state.segments ?? [];
  let font: Buffer | null = null;
  if (!segments[0]?.clip_path && state.title) {
    try {
      font = await fetchSubtitleFont(`${state.title}${row.place ?? ""}`, FONT_TIMEOUT_MS);
    } catch (e) {
      console.warn("[mv] title font unavailable, first clip without title:", e);
    }
  }
  const photos = new Map<number, Buffer>();
  let current = row;
  let next = state;
  for (let i = 0; i < segments.length; i++) {
    if (next.segments![i].clip_path) continue;
    if (deadline - Date.now() < MIN_CLIP_BUDGET_MS) throw new ComposeBudgetError();
    const seg = next.segments![i];
    const photo = next.photos[seg.photo] ?? next.photos[0];
    if (!photos.has(seg.photo)) photos.set(seg.photo, await download(admin, photo.path));
    // 字幕字型沒有表情符號（🎵 會變成方框）→ 用書名號
    const title = i === 0 && state.title ? `《${state.title}》${row.place ? `　${row.place}` : ""}` : "";
    const { clip } = await renderMontageClip({
      photo: photos.get(seg.photo)!,
      line: title,
      narrationSeconds: title ? TITLE_SECONDS : 0,
      size: next.size,
      variant: i,
      font: title ? font : null,
      deadline,
      seconds: seg.seconds,
    });
    const clipPath = mvClipPath(row, i);
    await upload(admin, clipPath, clip, "video/mp4");
    next = {
      ...next,
      attempts: 0,
      segments: next.segments!.map((s, j) => (j === i ? { ...s, clip_path: clipPath } : s)),
    };
    current = await saveMv(admin, current, next, { error_message: null });
  }
  return { row: current, state: next };
}

/** 3. 合成：片段＋歌 → video.mp4，標記完成並推播（片段刪掉；照片和兩個版本的歌留著） */
async function runFinal(admin: Admin, row: TravelVideoRow, state: MvState, deadline: number): Promise<TravelVideoRow> {
  const segments = state.segments ?? [];
  const [clips, song] = await Promise.all([
    Promise.all(segments.map((s) => download(admin, s.clip_path!))),
    download(admin, state.song_path!),
  ]);
  const totalSeconds = Math.round(segments.reduce((a, s) => a + s.seconds, 0) * 100) / 100;
  const video = await muxMv({ clips, song, totalSeconds, deadline });
  const videoPath = mvVideoPath(row);
  await upload(admin, videoPath, video, "video/mp4", true);
  const updated = await finishRow(admin, row, {
    status: "succeeded",
    video_path: videoPath,
    duration_seconds: Math.round(totalSeconds),
    mv: { ...state, attempts: 0 },
    lease_until: null,
    error_message: null,
  });
  if (!updated) return reloadRow(admin, row);
  await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(segments.map((_, i) => mvClipPath(row, i)));
  await notifyOwner(updated);
  return updated;
}

async function failMv(admin: Admin, row: TravelVideoRow, reason: string): Promise<TravelVideoRow> {
  const updated = await finishRow(admin, row, { status: "failed", error_message: reason.slice(0, 500), lease_until: null });
  if (!updated) return reloadRow(admin, row);
  await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(mvAllPaths(row));
  await trackAiUsage({
    userId: row.user_id,
    service: "suno_music",
    model: SONG_MODEL,
    endpoint: MV_ENDPOINT,
    success: false,
    errorMessage: reason,
    metadata: { video_id: row.id, task_id: row.mv?.task_id ?? null },
  });
  await notifyOwner(updated);
  return updated;
}

/** 推進一支 MV（畫面輪詢、建立後的背景工作、背景接力都會呼叫）；有做事又還沒好就叫下一棒 */
export async function syncMv(
  row: TravelVideoRow,
  opts: { budgetMs?: number; origin?: string | null; waitForSong?: boolean } = {}
): Promise<TravelVideoRow> {
  if (!isTravelVideoPending(row.status) || !row.mv) return row;
  const admin = createSupabaseAdmin();
  if (Date.now() - new Date(row.created_at).getTime() > MV_STALE_MS) return failMv(admin, row, "mv timeout");
  const leased = await acquireLease(admin, row);
  if (!leased?.mv) return row;
  const result = await processLeased(admin, leased, opts);
  if (isTravelVideoPending(result.status)) await scheduleContinuation(result.id, opts.origin);
  return result;
}

async function processLeased(
  admin: Admin,
  leased: TravelVideoRow,
  opts: { budgetMs?: number; waitForSong?: boolean }
): Promise<TravelVideoRow> {
  const deadline = Date.now() + (opts.budgetMs ?? WORK_BUDGET_MS);
  let current = leased;
  let state: MvState = leased.mv!;
  try {
    if (mvStage(state) === "song") {
      state = await runSong(admin, current, state, deadline, Boolean(opts.waitForSong));
      current = await saveMv(admin, current, state, { error_message: null });
    }
    if (mvStage(state) === "clips") {
      ({ row: current, state } = await runClips(admin, current, state, deadline));
    }
    if (mvStage(state) === "final" && deadline - Date.now() >= FINAL_MIN_MS) {
      return await runFinal(admin, current, state, deadline);
    }
    return await saveMv(admin, current, state, { lease_until: null });
  } catch (e) {
    if (e instanceof ComposeBudgetError) return saveMv(admin, current, state, { lease_until: null }).catch(() => current);
    if (e instanceof MvFatalError) return failMv(admin, current, e.message);
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mv] step failed:", msg);
    const fresh = ((await reloadRow(admin, current)).mv as MvState | null) ?? state;
    const attempts = fresh.attempts + 1;
    if (attempts >= MV_MAX_ATTEMPTS) return failMv(admin, current, `mv failed: ${msg}`);
    return saveMv(admin, current, { ...fresh, attempts }, {
      lease_until: null,
      error_message: `mv retry: ${msg}`.slice(0, 500),
    }).catch(() => current);
  }
}
