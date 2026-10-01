/**
 * 多張照片遊記影片（全部在自己的伺服器用 ffmpeg 做，不經過 AI 影片平台）：
 *   每張照片 → 一段「慢慢拉近／拉遠／平移」的小片段（Ken Burns），淡入淡出，字幕燒進去
 *   全部片段直接接起來（不重新編碼）＋ 每張的口白依序疊上 → 一支遊記影片
 *
 * 只能在伺服器端使用。Linux（Vercel）版 ffmpeg 沒有 drawtext，字幕一律用 ASS（見 video-compose.ts）
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  ComposeBudgetError,
  buildAssSubtitles,
  buildFontconfig,
  escapeFilterPath,
  fontFamilyName,
  runFfmpeg,
} from "./video-compose";
import { NARRATION_DELAY_SECONDS, buildSubtitleCues } from "../travel-video";

export const MONTAGE_FPS = 25;
export const MONTAGE_FADE_SECONDS = 0.5;
export const MONTAGE_MIN_CLIP_SECONDS = 3.5;
export const MONTAGE_MAX_CLIP_SECONDS = 12;
/** 一段片段 ffmpeg 的上限（本機 < 3 秒；雲端 CPU 較慢，保守抓） */
const CLIP_TIMEOUT_MS = 25_000;
const MUX_TIMEOUT_MS = 20_000;
/** 剩餘時間少於這個就不開始下一段（留給上傳、寫 DB） */
export const MIN_CLIP_BUDGET_MS = 12_000;

export interface MontageSize {
  width: number;
  height: number;
}

/** 直式照片比較多 → 直式影片（手機看剛好）；否則橫式 */
export function montageSize(photos: Array<{ width: number; height: number }>): MontageSize {
  const portrait = photos.filter((p) => p.height > p.width).length;
  return portrait > photos.length - portrait ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
}

/** 每張照片停留的秒數：口白念完再多停一下（前面留 0.4 秒、後面 0.9 秒） */
export function montageClipSeconds(narrationSeconds: number): number {
  const s = NARRATION_DELAY_SECONDS + Math.max(0, narrationSeconds) + 0.9;
  return Math.min(MONTAGE_MAX_CLIP_SECONDS, Math.max(MONTAGE_MIN_CLIP_SECONDS, Math.round(s * 10) / 10));
}

export function montageFrames(seconds: number): number {
  return Math.round(seconds * MONTAGE_FPS);
}

/**
 * Ken Burns：四種鏡頭輪流用，避免每張都一樣。
 * zoompan 的輸入是 2 倍大的畫面（位移時比較不會抖），z＝放大倍率、x/y＝取景左上角
 */
export function kenBurns(variant: number, frames: number, size: MontageSize): string {
  const last = Math.max(1, frames - 1);
  const t = `on/${last}`;
  const center = { x: "(iw-iw/zoom)/2", y: "(ih-ih/zoom)/2" };
  const moves = [
    { z: `1+0.15*${t}`, ...center }, // 慢慢拉近
    { z: `1.15-0.15*${t}`, ...center }, // 慢慢拉遠
    { z: "1.15", x: `(iw-iw/zoom)*${t}`, y: center.y }, // 由左往右
    { z: "1.15", x: `(iw-iw/zoom)*(1-${t})`, y: center.y }, // 由右往左
  ];
  const m = moves[((variant % moves.length) + moves.length) % moves.length];
  return `zoompan=z='${m.z}':x='${m.x}':y='${m.y}':d=${frames}:s=${size.width}x${size.height}:fps=${MONTAGE_FPS}`;
}

/**
 * 一張照片 → 一段片段（只有畫面，沒有聲音）。
 * 照片完整放進畫面，四周空白用同一張照片放大模糊補滿（直式、橫式照片混著用也好看）
 */
export function buildClipArgs(opts: {
  photoPath: string;
  assPath: string | null;
  fontsDir: string;
  size: MontageSize;
  seconds: number;
  variant: number;
  outPath: string;
}): string[] {
  const { width: W, height: H } = opts.size;
  const frames = montageFrames(opts.seconds);
  const fadeOutStart = Math.max(0, opts.seconds - MONTAGE_FADE_SECONDS).toFixed(2);
  const bw = Math.round(W / 4);
  const bh = Math.round(H / 4);
  const subtitles = opts.assPath
    ? `,ass=filename='${escapeFilterPath(opts.assPath)}':fontsdir='${escapeFilterPath(opts.fontsDir)}'`
    : "";
  const graph = [
    "[0:v]split=2[bgsrc][fgsrc]",
    `[bgsrc]scale=${bw}:${bh}:force_original_aspect_ratio=increase,crop=${bw}:${bh},boxblur=8:1,scale=${W * 2}:${H * 2},setsar=1[bg]`,
    `[fgsrc]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=decrease,setsar=1[fg]`,
    `[bg][fg]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2,${kenBurns(opts.variant, frames, opts.size)},` +
      `fade=t=in:st=0:d=${MONTAGE_FADE_SECONDS},fade=t=out:st=${fadeOutStart}:d=${MONTAGE_FADE_SECONDS}` +
      `${subtitles},format=yuv420p[v]`,
  ].join(";");
  return [
    "-hide_banner", "-y",
    // 照片是使用者上傳的：只准讀本機檔案、只准圖片格式（偽裝成照片的串流清單會讓伺服器去連任意網址）
    "-protocol_whitelist", "file",
    "-format_whitelist", "image2,jpeg_pipe,png_pipe,webp_pipe",
    "-i", opts.photoPath,
    "-filter_complex", graph,
    "-map", "[v]",
    "-frames:v", String(frames),
    "-r", String(MONTAGE_FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-video_track_timescale", "12800",
    "-an",
    "-movflags", "+faststart",
    opts.outPath,
  ];
}

/** concat demuxer 清單：路徑裡的單引號要跳脫 */
export function buildConcatList(paths: string[]): string {
  return paths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n") + "\n";
}

/** 每句口白在整支影片裡開始的秒數（片段開頭 + 0.4 秒） */
export function narrationStarts(clipSeconds: number[]): number[] {
  let t = 0;
  return clipSeconds.map((s) => {
    const start = t + NARRATION_DELAY_SECONDS;
    t += s;
    return Math.round(start * 1000) / 1000;
  });
}

/**
 * 配樂的混音：配樂檔已事先做成 -28 LUFS（public/music），這裡只做淡入淡出，
 * 並在有人說話時自動壓低（sidechaincompress 以口白當觸發），讓長輩聽得清楚
 */
export function buildMusicGraph(musicInput: number, total: number): string[] {
  const t = total.toFixed(2);
  const fadeOutStart = Math.max(0, total - 3).toFixed(2);
  return [
    // 口白是單聲道：左右聲道各複製一份（用 aformat 轉會小 3dB），混出來的配樂才不會被壓成單聲道
    "[narr]pan=stereo|c0=c0|c1=c0,asplit=2[voice][key]",
    `[${musicInput}:a]aresample=44100,atrim=0:${t},asetpts=PTS-STARTPTS,` +
      `afade=t=in:d=1.5,afade=t=out:st=${fadeOutStart}:d=3[bgm]`,
    "[bgm][key]sidechaincompress=threshold=0.015:ratio=6:attack=30:release=600[duck]",
    "[voice][duck]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]",
  ];
}

/** 片段接起來（不重新編碼）＋口白依序疊上；有配樂就墊在底下 */
export function buildMuxArgs(opts: {
  listPath: string;
  audioPaths: string[];
  clipSeconds: number[];
  outPath: string;
  /** 配樂檔（public/music/*.m4a）；沒有就只有口白 */
  musicPath?: string | null;
}): string[] {
  const total = opts.clipSeconds.reduce((a, b) => a + b, 0);
  const starts = narrationStarts(opts.clipSeconds);
  const delays = opts.audioPaths.map(
    (_, i) => `[${i + 1}:a]aresample=44100,adelay=${Math.round(starts[i] * 1000)}:all=1[a${i}]`
  );
  const withMusic = Boolean(opts.musicPath);
  const mix =
    opts.audioPaths.map((_, i) => `[a${i}]`).join("") +
    `amix=inputs=${opts.audioPaths.length}:duration=longest:dropout_transition=0:normalize=0,` +
    `apad,atrim=0:${total.toFixed(2)}${withMusic ? "[narr]" : "[aout]"}`;
  const music = withMusic ? buildMusicGraph(opts.audioPaths.length + 1, total) : [];
  return [
    "-hide_banner", "-y",
    "-f", "concat", "-safe", "0", "-i", opts.listPath,
    ...opts.audioPaths.flatMap((p) => ["-i", p]),
    // 配樂比影片短也不會斷（循環播放）
    ...(withMusic ? ["-stream_loop", "-1", "-i", opts.musicPath as string] : []),
    "-filter_complex", [...delays, mix, ...music].join(";"),
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
    "-t", total.toFixed(2),
    "-movflags", "+faststart",
    opts.outPath,
  ];
}

/**
 * 做一段片段。font：字幕字型（整支影片共用，呼叫端先抓好）；沒有字型就不上字幕。
 * deadline：時間不夠就丟 ComposeBudgetError（下次輪詢再做，不算失敗）
 */
export async function renderMontageClip(opts: {
  photo: Buffer;
  line: string;
  narrationSeconds: number;
  size: MontageSize;
  variant: number;
  font: Buffer | null;
  deadline: number;
}): Promise<{ clip: Buffer; seconds: number }> {
  const left = () => opts.deadline - Date.now();
  if (left() < MIN_CLIP_BUDGET_MS) throw new ComposeBudgetError();
  const seconds = montageClipSeconds(opts.narrationSeconds);
  const dir = await mkdtemp(path.join(tmpdir(), "montage-clip-"));
  try {
    const photoPath = path.join(dir, "photo.jpg");
    const fontsDir = path.join(dir, "fonts");
    const outPath = path.join(dir, "clip.mp4");
    await writeFile(photoPath, opts.photo);
    await mkdir(fontsDir, { recursive: true });

    let assPath: string | null = null;
    const cues = opts.line ? buildSubtitleCues(opts.line, opts.narrationSeconds, seconds) : [];
    if (opts.font && cues.length > 0) {
      await writeFile(path.join(fontsDir, "subtitle.ttf"), opts.font);
      assPath = path.join(dir, "subtitles.ass");
      await writeFile(
        assPath,
        buildAssSubtitles({
          cues,
          width: opts.size.width,
          height: opts.size.height,
          fontName: fontFamilyName(opts.font) ?? "Noto Sans TC",
        }),
        "utf8"
      );
    }
    const fontconfigFile = path.join(dir, "fonts.conf");
    await writeFile(fontconfigFile, buildFontconfig(fontsDir, path.join(dir, "fc-cache")), "utf8");

    const result = await runFfmpeg(
      buildClipArgs({ photoPath, assPath, fontsDir, size: opts.size, seconds, variant: opts.variant, outPath }),
      Math.min(CLIP_TIMEOUT_MS, left()),
      { ...process.env, FONTCONFIG_FILE: fontconfigFile }
    );
    if (result.code !== 0) throw new Error(`ffmpeg clip exited ${result.code}: ${result.stderr.slice(-600)}`);
    return { clip: await readFile(outPath), seconds };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** 片段＋口白 → 完成的 mp4 */
export async function muxMontage(opts: {
  clips: Buffer[];
  narrations: Buffer[];
  clipSeconds: number[];
  deadline: number;
  musicPath?: string | null;
}): Promise<Buffer> {
  const left = () => opts.deadline - Date.now();
  if (left() < 5_000) throw new ComposeBudgetError();
  if (opts.clips.length === 0 || opts.clips.length !== opts.narrations.length) {
    throw new Error("montage clips/narrations mismatch");
  }
  const dir = await mkdtemp(path.join(tmpdir(), "montage-mux-"));
  try {
    const clipPaths = await Promise.all(
      opts.clips.map(async (c, i) => {
        const p = path.join(dir, `clip-${i}.mp4`);
        await writeFile(p, c);
        return p;
      })
    );
    const audioPaths = await Promise.all(
      opts.narrations.map(async (a, i) => {
        const p = path.join(dir, `line-${i}.wav`);
        await writeFile(p, a);
        return p;
      })
    );
    const listPath = path.join(dir, "list.txt");
    await writeFile(listPath, buildConcatList(clipPaths), "utf8");
    const outPath = path.join(dir, "montage.mp4");
    const result = await runFfmpeg(
      buildMuxArgs({ listPath, audioPaths, clipSeconds: opts.clipSeconds, outPath, musicPath: opts.musicPath }),
      Math.min(MUX_TIMEOUT_MS, left())
    );
    if (result.code !== 0) throw new Error(`ffmpeg mux exited ${result.code}: ${result.stderr.slice(-600)}`);
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
