/**
 * 年度回憶影片 — 伺服器端（只在 API route 用；service role）
 *   候選照片：這一年做好的遊記（每張照片）、單張出遊影片的照片、故事集的照片
 *   製作（跟遊記／MV 一樣一段一段做，每次不超過時限；租約、背景接力沿用遊記）：
 *     1. 片段：片頭《2026 我的一年》＋每張照片一段（下面一行字幕），時間夠就連做好幾段
 *     2. 合成：片段接起來＋曲庫配樂（淡入淡出）→ video.mp4，推播給長輩（家人也會收到）
 * 不呼叫任何 AI 平台，不花算力；只有 ffmpeg
 */

import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createSupabaseAdmin } from "../supabase/server";
import { ComposeBudgetError, fetchSubtitleFont, runFfmpeg } from "./video-compose";
import { buildConcatList, clipBudgetNeededMs, montageSize, renderMontageClip } from "./montage-compose";
import { acquireLease, download, leaseMsFor, releaseLease, scheduleContinuation, upload } from "./travel-montage-server";
import { TRAVEL_VIDEO_BUCKET, finishRow, notifyOwner, reloadRow, type TravelVideoRow } from "./travel-video-server";
import { STORY_BUCKET } from "../life-stories-server";
import { isMontageMusicId, isTravelVideoPending, montageMusicFile, type CompilationKind, type MontageState } from "../travel-video";
import {
  YEARLY_MAX_PHOTOS,
  yearlySegments,
  sanitizeYearlyCaption,
  taipeiYearRange,
  yearlyCaption,
  yearlyStage,
  yearlyTitleLine,
  type YearlyCandidate,
  type YearlyState,
} from "../travel-yearly";

type Admin = ReturnType<typeof createSupabaseAdmin>;

/** 剪最多 17 段＋合成：雲端一段約 20 秒，背景接力 3～4 棒 */
export const YEARLY_STALE_MS = 45 * 60 * 1000;
const YEARLY_MAX_ATTEMPTS = 5;
const WORK_BUDGET_MS = 45_000;
const FINAL_MIN_MS = 15_000;
const FONT_TIMEOUT_MS = 8_000;
const MUX_TIMEOUT_MS = 60_000;
/** 候選照片的網址（故事集是私人 bucket）1 小時有效 */
const SIGNED_URL_SECONDS = 3600;

export function yearlyPhotoPath(row: Pick<TravelVideoRow, "user_id" | "id">, index: number): string {
  return `${row.user_id}/${row.id}/photo-${index}.jpg`;
}
export function yearlyClipPath(row: Pick<TravelVideoRow, "user_id" | "id">, index: number): string {
  return `${row.user_id}/${row.id}/clip-${index}.mp4`;
}
export function yearlyVideoPath(row: Pick<TravelVideoRow, "user_id" | "id">): string {
  return `${row.user_id}/${row.id}/video.mp4`;
}

/** 刪除時要清掉的全部檔案 */
export function yearlyAllPaths(row: Pick<TravelVideoRow, "user_id" | "id"> & { yearly?: YearlyState | null }): string[] {
  const s = row.yearly;
  return [
    ...(s?.photos.map((p) => p.path) ?? []),
    ...(s?.segments ?? []).map((_, i) => yearlyClipPath(row, i)),
    yearlyVideoPath(row),
  ];
}

// ── 候選照片 ──

/** 伺服器內部用：候選照片真正在哪個 bucket、哪個路徑（不給前端） */
export interface YearlySource extends YearlyCandidate {
  bucket: string;
  path: string;
}

interface VideoRowLite {
  id: string;
  kind: string | null;
  place: string | null;
  photo_path: string | null;
  created_at: string;
  montage: MontageState | null;
}

interface StoryRowLite {
  id: string;
  title: string;
  created_at: string;
  photos: { path: string; width: number; height: number }[] | null;
}

/** 這一年可以放進年度影片的照片（照日期排好） */
export async function collectYearlySources(admin: Admin, userId: string, year: number): Promise<YearlySource[]> {
  const { start, end } = taipeiYearRange(year);
  const [{ data: videos, error: vErr }, { data: stories, error: sErr }] = await Promise.all([
    admin
      .from("travel_videos")
      .select("id, kind, place, photo_path, created_at, montage")
      .eq("user_id", userId)
      .eq("status", "succeeded")
      .is("deleted_at", null)
      .in("kind", ["single", "montage"]) // MV、年度影片的照片是複製來的，不重複列
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .limit(200),
    admin
      .from("life_stories")
      .select("id, title, created_at, photos")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);
  if (vErr) throw new Error(`load yearly videos failed: ${vErr.message}`);
  if (sErr) console.warn("[yearly] load stories failed (故事集還沒建？):", sErr.message);

  const tv = admin.storage.from(TRAVEL_VIDEO_BUCKET);
  const out: YearlySource[] = [];
  for (const v of (videos ?? []) as VideoRowLite[]) {
    if (v.kind === "montage" && v.montage?.photos?.length) {
      v.montage.photos.forEach((p, i) => {
        out.push({
          key: `tv:${v.id}:${i}`,
          bucket: TRAVEL_VIDEO_BUCKET,
          path: p.path,
          url: tv.getPublicUrl(p.path).data.publicUrl,
          width: p.width,
          height: p.height,
          caption: yearlyCaption(v.created_at, v.place),
          date: v.created_at,
          source: "trip",
        });
      });
    } else if (v.photo_path) {
      out.push({
        key: `tv:${v.id}:0`,
        bucket: TRAVEL_VIDEO_BUCKET,
        path: v.photo_path,
        url: tv.getPublicUrl(v.photo_path).data.publicUrl,
        width: null,
        height: null,
        caption: yearlyCaption(v.created_at, v.place),
        date: v.created_at,
        source: "trip",
      });
    }
  }
  const storyPhotos: YearlySource[] = [];
  for (const s of (stories ?? []) as StoryRowLite[]) {
    (s.photos ?? []).forEach((p, i) => {
      storyPhotos.push({
        key: `story:${s.id}:${i}`,
        bucket: STORY_BUCKET,
        path: p.path,
        url: "",
        width: p.width || null,
        height: p.height || null,
        caption: sanitizeYearlyCaption(s.title) || yearlyCaption(s.created_at, null),
        date: s.created_at,
        source: "story",
      });
    });
  }
  if (storyPhotos.length) {
    const { data: signed } = await admin.storage
      .from(STORY_BUCKET)
      .createSignedUrls(storyPhotos.map((p) => p.path), SIGNED_URL_SECONDS);
    const urls = new Map<string, string>();
    for (const d of (signed ?? []) as { path: string | null; signedUrl: string }[]) if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
    for (const p of storyPhotos) {
      p.url = urls.get(p.path) ?? "";
      if (p.url) out.push(p);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
}

export function toCandidate(s: YearlySource): YearlyCandidate {
  return { key: s.key, url: s.url, width: s.width, height: s.height, caption: s.caption, date: s.date, source: s.source };
}

/**
 * 建立時：選的照片複製到 {user}/{video}/photo-N.jpg（原本的遊記、故事之後刪掉也不影響）。
 * 故事集在別的 bucket：下載再上傳。失敗就把已經複製的刪掉再丟錯
 */
export async function copyYearlyPhotos(
  admin: Admin,
  target: Pick<TravelVideoRow, "user_id" | "id">,
  picks: YearlySource[]
): Promise<string[]> {
  const copied: string[] = [];
  try {
    for (const [i, p] of picks.slice(0, YEARLY_MAX_PHOTOS).entries()) {
      const to = yearlyPhotoPath(target, i);
      if (p.bucket === TRAVEL_VIDEO_BUCKET) {
        const { error } = await admin.storage.from(TRAVEL_VIDEO_BUCKET).copy(p.path, to);
        if (error) throw new Error(`copy ${p.path}: ${error.message}`);
      } else {
        const { data, error } = await admin.storage.from(p.bucket).download(p.path);
        if (error || !data) throw new Error(`download ${p.path}: ${error?.message ?? "no data"}`);
        await upload(admin, to, Buffer.from(await data.arrayBuffer()), "image/jpeg");
      }
      copied.push(to);
    }
    return copied;
  } catch (e) {
    if (copied.length) await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(copied);
    throw e;
  }
}

/** 影片大小：直式照片比較多就直式；量不到大小的照片（單張影片）當作橫式 */
export function yearlySize(picks: Pick<YearlySource, "width" | "height">[]): { width: number; height: number } {
  return montageSize(picks.map((p) => ({ width: p.width ?? 4, height: p.height ?? 3 })));
}

/**
 * 建立一支合輯影片（年度回憶 kind='yearly'、全團遊記 kind='tour' 共用）：
 * 選好的照片照順序複製到影片底下 → 寫一筆 travel_videos（同種類同時只能一支在做，唯一索引擋）。
 * 回傳 { row } 或 { pending: true }（已經有一支在做）；其他錯誤丟出去
 */
export async function insertCompilationVideo(
  admin: Admin,
  opts: {
    userId: string;
    kind: "yearly" | "tour";
    year: number;
    title: string;
    music: YearlyState["music"];
    chosen: YearlySource[];
    captions: string[];
    /** 全團遊記：哪一團（之後畫面顯示用） */
    place?: string | null;
  }
): Promise<{ row: TravelVideoRow } | { pending: true }> {
  const id = crypto.randomUUID();
  const copied = await copyYearlyPhotos(admin, { user_id: opts.userId, id }, opts.chosen);
  return insertCompilationRow(admin, {
    id,
    userId: opts.userId,
    kind: opts.kind,
    place: opts.place ?? null,
    state: {
      year: opts.year,
      title: opts.title,
      music: opts.music,
      size: yearlySize(opts.chosen),
      photos: opts.chosen.map((s, i) => ({ path: copied[i], width: s.width ?? 0, height: s.height ?? 0, caption: opts.captions[i] })),
      segments: yearlySegments(opts.title, opts.captions),
      attempts: 0,
    },
  });
}

/**
 * 照片已經放好（{user}/{video}/photo-N.jpg）之後寫那一筆（祝福影片也用）。
 * 寫不進去就把照片刪掉；同種類已經有一支在做 → { pending: true }
 */
export async function insertCompilationRow(
  admin: Admin,
  opts: { id: string; userId: string; kind: CompilationKind; state: YearlyState; place?: string | null }
): Promise<{ row: TravelVideoRow } | { pending: true }> {
  const copied = opts.state.photos.map((p) => p.path);
  const { data, error } = await admin
    .from("travel_videos")
    .insert({
      id: opts.id,
      user_id: opts.userId,
      kind: opts.kind,
      status: "queued",
      style: "gentle",
      place: opts.place ?? null,
      prompt: opts.state.title,
      model: "ffmpeg",
      photo_path: copied[0],
      yearly: opts.state,
    })
    .select("*")
    .single();
  if (error || !data) {
    await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(copied);
    if (error?.code === "23505") return { pending: true };
    throw new Error(`insert ${opts.kind} video failed (SQL 跑了嗎？): ${error?.message ?? "no row"}`);
  }
  return { row: data as TravelVideoRow };
}

// ── 製作 ──

async function saveYearly(admin: Admin, row: TravelVideoRow, state: YearlyState, extra: Partial<TravelVideoRow> = {}): Promise<TravelVideoRow> {
  const patch = { yearly: state, updated_at: new Date().toISOString(), ...extra };
  const { error } = await admin.from("travel_videos").update(patch).eq("id", row.id).in("status", ["queued", "running"]);
  if (error) throw new Error(`save yearly state failed: ${error.message}`);
  return { ...row, ...patch } as TravelVideoRow;
}

function stateOf(row: TravelVideoRow): YearlyState | null {
  return row.yearly ?? null;
}

/** 1. 片段：每段一張照片＋一行字（片頭是標題）；字型只抓用得到的字，整支共用 */
async function runClips(admin: Admin, row: TravelVideoRow, state: YearlyState, deadline: number): Promise<{ row: TravelVideoRow; state: YearlyState }> {
  const lines = state.segments.map((s, i) => (i === 0 ? yearlyTitleLine(s.line) : s.line));
  let font: Buffer | null = null;
  try {
    font = await fetchSubtitleFont(lines.join(""), FONT_TIMEOUT_MS);
  } catch (e) {
    console.warn("[yearly] subtitle font unavailable, clips without text:", e);
  }
  const photos = new Map<number, Buffer>();
  let current = row;
  let next = state;
  let lastClipMs: number | null = null;
  for (let i = 0; i < next.segments.length; i++) {
    if (next.segments[i].clip_path) continue;
    if (deadline - Date.now() < clipBudgetNeededMs(lastClipMs)) throw new ComposeBudgetError();
    const seg = next.segments[i];
    const started = Date.now();
    const photo = next.photos[seg.photo] ?? next.photos[0];
    if (!photos.has(seg.photo)) photos.set(seg.photo, await download(admin, photo.path));
    const { clip } = await renderMontageClip({
      photo: photos.get(seg.photo)!,
      line: lines[i],
      // 字幕整段都在（扣掉頭尾淡入淡出）
      narrationSeconds: Math.max(1, seg.seconds - 1.2),
      size: next.size,
      variant: i,
      font: lines[i] ? font : null,
      deadline,
      seconds: seg.seconds,
    });
    lastClipMs = Date.now() - started;
    const clipPath = yearlyClipPath(row, i);
    await upload(admin, clipPath, clip, "video/mp4");
    next = { ...next, attempts: 0, segments: next.segments.map((s, j) => (j === i ? { ...s, clip_path: clipPath } : s)) };
    current = await saveYearly(admin, current, next, { error_message: null });
  }
  return { row: current, state: next };
}

/** 片段直接接（不重新編碼）＋配樂（循環、淡入淡出）；沒有配樂檔就配安靜的音軌（播放器才不會怪怪的） */
export function buildYearlyMuxArgs(opts: { listPath: string; musicPath: string | null; totalSeconds: number; outPath: string }): string[] {
  const t = opts.totalSeconds.toFixed(2);
  const fadeOut = Math.max(0, opts.totalSeconds - 4).toFixed(2);
  const audioIn = opts.musicPath
    ? ["-stream_loop", "-1", "-i", opts.musicPath]
    : ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"];
  return [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0", "-i", opts.listPath,
    ...audioIn,
    "-filter_complex", `[1:a]aresample=44100,atrim=0:${t},asetpts=PTS-STARTPTS,afade=t=in:d=1.5,afade=t=out:st=${fadeOut}:d=4[a]`,
    "-map", "0:v", "-map", "[a]",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
    "-t", t,
    "-movflags", "+faststart",
    opts.outPath,
  ];
}

async function musicPathFor(state: YearlyState): Promise<string | null> {
  if (!isMontageMusicId(state.music)) return null;
  const file = path.join(process.cwd(), "public", montageMusicFile(state.music));
  try {
    await access(file);
    return file;
  } catch {
    console.warn(`[yearly] music file missing: ${file}`);
    return null;
  }
}

/** 2. 合成 → video.mp4，標記完成並推播（片段刪掉；照片留著，刪影片時一起刪） */
async function runFinal(admin: Admin, row: TravelVideoRow, state: YearlyState, deadline: number): Promise<TravelVideoRow> {
  const left = () => deadline - Date.now();
  const clips = await Promise.all(state.segments.map((s) => download(admin, s.clip_path!)));
  const totalSeconds = Math.round(state.segments.reduce((a, s) => a + s.seconds, 0) * 100) / 100;
  const dir = await mkdtemp(path.join(tmpdir(), "yearly-mux-"));
  let video: Buffer;
  try {
    const clipPaths = await Promise.all(
      clips.map(async (c, i) => {
        const p = path.join(dir, `clip-${i}.mp4`);
        await writeFile(p, c);
        return p;
      })
    );
    const listPath = path.join(dir, "list.txt");
    await writeFile(listPath, buildConcatList(clipPaths), "utf8");
    const outPath = path.join(dir, "yearly.mp4");
    if (left() < 8_000) throw new ComposeBudgetError();
    const result = await runFfmpeg(
      buildYearlyMuxArgs({ listPath, musicPath: await musicPathFor(state), totalSeconds, outPath }),
      Math.min(MUX_TIMEOUT_MS, left())
    );
    if (result.code !== 0) {
      if (left() <= 1_000) throw new ComposeBudgetError();
      throw new Error(`ffmpeg yearly mux exited ${result.code}: ${result.stderr.slice(-600)}`);
    }
    video = await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  const videoPath = yearlyVideoPath(row);
  await upload(admin, videoPath, video, "video/mp4", true);
  const updated = await finishRow(admin, row, {
    status: "succeeded",
    video_path: videoPath,
    duration_seconds: Math.round(totalSeconds),
    yearly: { ...state, attempts: 0 },
    lease_until: null,
    error_message: null,
  } as Partial<TravelVideoRow>);
  if (!updated) return reloadRow(admin, row);
  await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(state.segments.map((_, i) => yearlyClipPath(row, i)));
  await notifyOwner(updated);
  return updated;
}

async function failYearly(admin: Admin, row: TravelVideoRow, reason: string): Promise<TravelVideoRow> {
  const updated = await finishRow(admin, row, { status: "failed", error_message: reason.slice(0, 500), lease_until: null });
  if (!updated) return reloadRow(admin, row);
  await admin.storage.from(TRAVEL_VIDEO_BUCKET).remove(yearlyAllPaths({ ...row, yearly: stateOf(row) }));
  await notifyOwner(updated);
  return updated;
}

/** 推進一支年度影片（畫面輪詢、建立後的背景工作、背景接力都會呼叫）；有做事又還沒好就叫下一棒 */
export async function syncYearly(row: TravelVideoRow, opts: { budgetMs?: number; origin?: string | null } = {}): Promise<TravelVideoRow> {
  if (!isTravelVideoPending(row.status) || !stateOf(row)) return row;
  const admin = createSupabaseAdmin();
  if (Date.now() - new Date(row.created_at).getTime() > YEARLY_STALE_MS) return failYearly(admin, row, "yearly timeout");
  const leased = await acquireLease(admin, row, leaseMsFor(opts.budgetMs ?? WORK_BUDGET_MS));
  if (!leased || !stateOf(leased)) return row;
  const result = await processLeased(admin, leased, opts.budgetMs ?? WORK_BUDGET_MS);
  if (isTravelVideoPending(result.status)) await scheduleContinuation(result.id, opts.origin);
  return result;
}

async function processLeased(admin: Admin, leased: TravelVideoRow, budgetMs: number): Promise<TravelVideoRow> {
  const deadline = Date.now() + budgetMs;
  let current = leased;
  let state = stateOf(leased)!;
  try {
    if (current.status === "queued") {
      current = await saveYearly(admin, current, state, { status: "running" } as Partial<TravelVideoRow>);
    }
    if (yearlyStage(state) === "clips") {
      ({ row: current, state } = await runClips(admin, current, state, deadline));
    }
    if (yearlyStage(state) === "final" && deadline - Date.now() >= FINAL_MIN_MS) {
      return await runFinal(admin, current, state, deadline);
    }
    return await saveYearly(admin, current, state, { lease_until: null });
  } catch (e) {
    // 時間不夠不算失敗：做好的片段每段都存了——只放租約，不能用這一步開始時的舊進度蓋掉（見 AGENTS.md 遊記的教訓）
    if (e instanceof ComposeBudgetError) return releaseLease(admin, current).catch(() => current);
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[yearly] step failed:", msg);
    const fresh = stateOf(await reloadRow(admin, current)) ?? state;
    const attempts = fresh.attempts + 1;
    if (attempts >= YEARLY_MAX_ATTEMPTS) return failYearly(admin, current, `yearly failed: ${msg}`);
    return saveYearly(admin, current, { ...fresh, attempts }, {
      lease_until: null,
      error_message: `yearly retry: ${msg}`.slice(0, 500),
    }).catch(() => current);
  }
}
