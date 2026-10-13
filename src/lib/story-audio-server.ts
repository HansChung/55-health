// ────────────────────────────────────────────────
// 聲音故事（只在 API route 用；service role）：簽名上傳網址、存故事時把暫存錄音搬好（webm 轉 m4a）、
// 播放用的簽名網址、清掉沒存成故事的暫存錄音
// 轉檔用 ffmpeg：用到的 route 要在 next.config 的 outputFileTracingIncludes 帶上 ffmpeg
// ────────────────────────────────────────────────

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { runFfmpeg } from "@/lib/ai/video-compose";
import { SAFE_AUDIO_INPUT } from "@/lib/ai/audio-convert";
import {
  STORY_AUDIO_BUCKET,
  STORY_AUDIO_MAX_BYTES,
  STORY_AUDIO_MIN_SECONDS,
  STORY_AUDIO_RECORD_MAX_SECONDS,
  durationFromProbe,
  ffmpegOutputSeconds,
  pendingStoryAudioPath,
  storyAudioPath,
  storyAudioType,
} from "@/lib/story-audio";

type Admin = ReturnType<typeof createSupabaseAdmin>;

/** 播放網址 1 小時有效（私人 bucket；畫面每次載入重新簽） */
const SIGNED_URL_SECONDS = 3600;
/** 15 分鐘的 webm 轉 m4a 實測幾秒；留足空間 */
const CONVERT_TIMEOUT_MS = 90_000;

export class StoryAudioError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export interface StoredStoryAudio {
  path: string;
  seconds: number;
  mime: string;
  bytes: number;
}

/**
 * 每天上傳上限：拿網址時就先記一筆（claim_story_audio_upload 用鎖排隊，同時要很多個網址也不會超過）。
 * 還沒跑新版 SQL 時退回「數今天上傳了幾個檔案」（同時送出可能多給幾個）
 */
async function claimUploadSlot(admin: Admin, userId: string, dailyLimit: number): Promise<boolean> {
  const { data, error } = await admin.rpc("claim_story_audio_upload", { p_user: userId, p_limit: dailyLimit });
  if (!error) return data === true;
  if (!/claim_story_audio_upload/.test(error.message)) throw new Error(`claim story audio upload failed: ${error.message}`);
  const { data: today, error: countErr } = await admin.rpc("story_audio_uploads_today", { p_user: userId });
  if (countErr) throw new Error(`count story audio uploads failed: ${countErr.message}`);
  return Number(today ?? 0) < dailyLimit;
}

/** 給瀏覽器一個簽名上傳網址（直接傳到 Supabase，大檔案不經過 Vercel） */
export async function createStoryAudioUpload(
  admin: Admin,
  userId: string,
  file: { fileName: string; size: number; type: string }
,
  /** 每天可以上傳幾段（後台「方案與次數」的 story_audio_daily） */
  dailyLimit: number
): Promise<{ path: string; token: string; contentType: string }> {
  const t = storyAudioType(file.fileName, file.type);
  if (!t) throw new StoryAudioError("只能放 mp3、m4a、aac、wav 錄音檔", 415);
  if (file.size > STORY_AUDIO_MAX_BYTES) {
    throw new StoryAudioError("錄音檔超過 50MB，請錄短一點，或分成幾段故事", 413);
  }
  if (!(await claimUploadSlot(admin, userId, dailyLimit))) {
    throw new StoryAudioError(`今天已經上傳 ${dailyLimit} 段錄音了，明天再來`, 429);
  }
  const p = pendingStoryAudioPath(userId, t.ext);
  const { data, error } = await admin.storage.from(STORY_AUDIO_BUCKET).createSignedUploadUrl(p);
  if (error || !data) throw new Error(`signed upload url failed: ${error?.message ?? "no data"}`);
  return { path: p, token: data.token, contentType: t.contentType };
}

/** 上傳的錄音檔有多長：ffmpeg 讀檔頭的「Duration:」（不解碼，很快）；讀不出來回 null */
async function probeSeconds(input: Buffer): Promise<number | null> {
  const dir = await mkdtemp(path.join(tmpdir(), "story-audio-"));
  try {
    const inPath = path.join(dir, "in.bin");
    await writeFile(inPath, input);
    // 沒有輸出檔，ffmpeg 會回非 0；只看它印出來的檔頭
    const { stderr } = await runFfmpeg(["-hide_banner", "-nostdin", ...SAFE_AUDIO_INPUT, "-i", inPath], 20_000);
    return durationFromProbe(stderr);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** App 裡錄的 webm／ogg → m4a（AAC 單聲道 64k），順便從 ffmpeg 的進度拿到長度 */
async function recordingToM4a(input: Buffer): Promise<{ m4a: Buffer; seconds: number | null }> {
  const dir = await mkdtemp(path.join(tmpdir(), "story-audio-"));
  try {
    const inPath = path.join(dir, "in.bin");
    const outPath = path.join(dir, "out.m4a");
    await writeFile(inPath, input);
    const result = await runFfmpeg(
      [
        "-hide_banner", "-nostdin", "-y", ...SAFE_AUDIO_INPUT, "-i", inPath,
        "-t", String(STORY_AUDIO_RECORD_MAX_SECONDS + 5),
        "-vn", "-ac", "1", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", outPath,
      ],
      CONVERT_TIMEOUT_MS
    );
    if (result.code !== 0) throw new Error(`ffmpeg story audio exited ${result.code}: ${result.stderr.slice(-300)}`);
    return { m4a: await readFile(outPath), seconds: ffmpegOutputSeconds(result.stderr) };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * 存故事時：暫存錄音 → {user}/{story}/audio.*。上傳的 mp3／m4a 直接搬；App 裡錄的 webm 轉成 m4a。
 * clientSeconds 是瀏覽器量的長度（上傳檔沒辦法便宜地在伺服器量，只用來顯示）
 */
export async function finalizeStoryAudio(
  admin: Admin,
  userId: string,
  storyId: string,
  pendingPath: string,
  clientSeconds: number
): Promise<StoredStoryAudio> {
  const bucket = admin.storage.from(STORY_AUDIO_BUCKET);
  const { data: info, error: infoErr } = await bucket.info(pendingPath);
  if (infoErr || !info) throw new StoryAudioError("找不到剛剛的錄音，請再傳一次");
  const t = storyAudioType(pendingPath, info.contentType ?? "");
  if (!t) throw new StoryAudioError("只能放 mp3、m4a、aac、wav 錄音檔", 415);
  const bytes = Number(info.size ?? 0);
  if (bytes <= 0 || bytes > STORY_AUDIO_MAX_BYTES) throw new StoryAudioError("錄音檔太大或是空的，請再試一次");

  if (t.convert) {
    const { data: blob, error } = await bucket.download(pendingPath);
    if (error || !blob) throw new StoryAudioError("找不到剛剛的錄音，請再傳一次");
    let converted: { m4a: Buffer; seconds: number | null };
    try {
      converted = await recordingToM4a(Buffer.from(await blob.arrayBuffer()));
    } catch (e) {
      console.error("[story-audio] convert failed:", e);
      throw new StoryAudioError("錄音轉檔失敗，請再錄一次", 422);
    }
    const seconds = converted.seconds ?? clientSeconds;
    if (!(seconds >= STORY_AUDIO_MIN_SECONDS)) throw new StoryAudioError("錄音太短了，請多說一點");
    const finalPath = storyAudioPath(userId, storyId, "m4a");
    const { error: upErr } = await bucket.upload(finalPath, converted.m4a, { contentType: "audio/mp4", upsert: true });
    if (upErr) throw new Error(`upload converted story audio failed: ${upErr.message}`);
    await bucket.remove([pendingPath]).catch(() => undefined); // 沒刪到的暫存檔由每天的清理排程刪
    return { path: finalPath, seconds: Math.round(seconds), mime: "audio/mp4", bytes: converted.m4a.length };
  }

  // 瀏覽器常常讀不到長度（Safari 回 Infinity、讀取逾時）：那就在伺服器讀檔頭量一次；量不出來代表檔案壞了
  let seconds = Number.isFinite(clientSeconds) ? Math.min(Math.max(0, clientSeconds), 6 * 3600) : 0;
  if (seconds < STORY_AUDIO_MIN_SECONDS) {
    const { data: blob, error } = await bucket.download(pendingPath);
    if (error || !blob) throw new StoryAudioError("找不到剛剛的錄音，請再傳一次");
    const probed = await probeSeconds(Buffer.from(await blob.arrayBuffer())).catch(() => null);
    if (probed === null) throw new StoryAudioError("這個錄音檔讀不出來，請換一個檔案", 422);
    seconds = probed;
  }
  if (!(seconds >= STORY_AUDIO_MIN_SECONDS)) throw new StoryAudioError("錄音太短了，請多說一點");
  const finalPath = storyAudioPath(userId, storyId, t.ext);
  const { error: mvErr } = await bucket.move(pendingPath, finalPath);
  if (mvErr) throw new Error(`move story audio failed: ${mvErr.message}`);
  return { path: finalPath, seconds: Math.round(seconds), mime: t.contentType, bytes };
}

/** 好幾篇故事的錄音一次簽網址 */
export async function signStoryAudio(admin: Admin, paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data, error } = await admin.storage.from(STORY_AUDIO_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) {
    console.warn("[story-audio] sign failed:", error.message);
    return urls;
  }
  for (const d of data ?? []) if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
  return urls;
}

export async function removeStoryAudio(admin: Admin, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await admin.storage.from(STORY_AUDIO_BUCKET).remove(paths);
  if (error) console.warn("[story-audio] remove failed:", error.message);
}

/** 每天清掉沒存成故事、超過一天的暫存錄音；還沒跑 add-story-audio.sql 就丟錯（呼叫端記錄就好） */
export async function cleanupStaleStoryAudio(admin: Admin, budgetMs = 15_000): Promise<number> {
  const deadline = Date.now() + budgetMs;
  let removed = 0;
  while (Date.now() < deadline) {
    const { data, error } = await admin.rpc("stale_story_audio", { max_rows: 500 });
    if (error) throw new Error(`list stale story audio failed: ${error.message}`);
    const names = ((data ?? []) as unknown[]).filter((n): n is string => typeof n === "string");
    for (let i = 0; i < names.length; i += 100) {
      const { error: rmErr } = await admin.storage.from(STORY_AUDIO_BUCKET).remove(names.slice(i, i + 100));
      if (rmErr) throw new Error(`remove stale story audio failed: ${rmErr.message}`);
    }
    removed += names.length;
    if (names.length < 500) break;
  }
  return removed;
}
