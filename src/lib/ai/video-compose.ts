/**
 * 出遊影片後製：把口白疊到 H3 影片上（環境音調小），字幕照原句燒進畫面
 * 用 ffmpeg-static 內建的 ffmpeg；字型在執行時向 Google Fonts 只取「字幕用到的字」（通常 < 20KB）
 *
 * 字幕用 ASS 字幕檔＋ass 濾鏡（libass），不要用 drawtext：
 * Vercel 上的 Linux 版（johnvansickle 7.0.2 static）沒有 drawtext，macOS 版才有（實測踩過）
 *
 * 只能在伺服器端使用。Vercel 需在 next.config 的 outputFileTracingIncludes 帶上 ffmpeg 執行檔
 */

import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { NARRATION_DELAY_SECONDS, type SubtitleCue } from "../travel-video";

/** ffmpeg 單次上限；實際還會再被呼叫端給的 deadline 壓縮 */
const FFMPEG_TIMEOUT_MS = 30_000;
/** 剩餘時間少於這個就不開始跑 ffmpeg（10 秒影片本機 < 1 秒，保守留給較慢的雲端 CPU） */
const MIN_FFMPEG_MS = 10_000;
const FONT_TIMEOUT_MS = 8_000;

/** 時間不夠、這次先不合成（呼叫端應該下次再試，不是真的失敗） */
export class ComposeBudgetError extends Error {
  constructor() {
    super("not enough time left to compose");
    this.name = "ComposeBudgetError";
  }
}
/** H3 自帶的環境音：口白期間壓低，不要蓋過人聲 */
const AMBIENT_VOLUME = 0.25; // 實測：H3 沒被要求念口白時不會出人聲，但常自帶配樂

export interface MediaInfo {
  width: number;
  height: number;
  hasAudio: boolean;
  duration: number | null;
}

/** 解析 `ffmpeg -i` 印出的串流資訊（ffmpeg-static 沒附 ffprobe） */
export function parseMediaInfo(stderr: string): MediaInfo {
  const size = stderr.match(/Stream #[^\n]*Video:[^\n]*?\b(\d{2,5})x(\d{2,5})\b/);
  const dur = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  return {
    width: size ? Number(size[1]) : 0,
    height: size ? Number(size[2]) : 0,
    hasAudio: /Stream #[^\n]*Audio:/.test(stderr),
    duration: dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : null,
  };
}

/** 字幕字級：依畫面大小，直式影片也放得下 */
export function subtitleFontSize(width: number, height: number): number {
  return Math.max(24, Math.round(Math.min(height, width) * 0.058));
}

/** 一行放不下就平均切成多行（中文逐字切） */
export function wrapSubtitle(text: string, maxChars: number): string {
  const chars = [...text];
  if (chars.length <= maxChars) return text;
  const lines = Math.ceil(chars.length / maxChars);
  const per = Math.ceil(chars.length / lines);
  const out: string[] = [];
  for (let i = 0; i < chars.length; i += per) out.push(chars.slice(i, i + per).join(""));
  return out.join("\n");
}

/** filtergraph 參數值裡的路徑要跳脫 \ : ' */
function escapeFilterPath(p: string): string {
  return p.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

/** ASS 時間格式 h:mm:ss.cc */
export function assTime(seconds: number): string {
  const cs = Math.max(0, Math.round(seconds * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const sec = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
}

/** ASS 裡 { } \ 有特殊意義：換成全形，換行用 \N */
function assText(text: string): string {
  return text.replace(/\\/g, "＼").replace(/\{/g, "｛").replace(/\}/g, "｝").replace(/\n/g, "\\N");
}

/**
 * 產生 ASS 字幕：座標以影片像素為準（PlayRes = 影片大小），
 * 白字、半透明黑底框（BorderStyle 3）、置中靠下，一段一行 Dialogue
 */
export function buildAssSubtitles(opts: {
  cues: SubtitleCue[];
  width: number;
  height: number;
  fontName: string;
}): string {
  const fontSize = subtitleFontSize(opts.width, opts.height);
  const maxChars = Math.max(6, Math.floor((opts.width * 0.86) / fontSize));
  const box = Math.round(fontSize * 0.3);
  const marginV = Math.round(opts.height * 0.07);
  // &HAABBGGRR：AA=00 不透明、FF 全透明；8C ≈ 45% 不透明的黑
  const boxColour = "&H8C000000";
  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${opts.width}`,
    `PlayResY: ${opts.height}`,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,${opts.fontName},${fontSize},&H00FFFFFF,&H00FFFFFF,${boxColour},${boxColour},-1,0,0,0,100,100,0,0,3,${box},0,2,20,20,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...opts.cues.map(
      (c) => `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Default,,0,0,0,,${assText(wrapSubtitle(c.text, maxChars))}`
    ),
    "",
  ].join("\n");
}

/** 只認得我們下載的字型：不依賴伺服器裝了什麼字型（Vercel 上沒有中文字型） */
export function buildFontconfig(fontsDir: string, cacheDir: string): string {
  return [
    '<?xml version="1.0"?>',
    '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">',
    "<fontconfig>",
    `  <dir>${fontsDir}</dir>`,
    `  <cachedir>${cacheDir}</cachedir>`,
    "</fontconfig>",
    "",
  ].join("\n");
}

/** 從 TTF 的 name 表讀字型家族名稱（ASS 樣式要用同一個名字）；讀不到就回 null */
export function fontFamilyName(buf: Buffer): string | null {
  try {
    const numTables = buf.readUInt16BE(4);
    for (let i = 0; i < numTables; i++) {
      const rec = 12 + i * 16;
      if (buf.toString("ascii", rec, rec + 4) !== "name") continue;
      const table = buf.readUInt32BE(rec + 8);
      const count = buf.readUInt16BE(table + 2);
      const strings = table + buf.readUInt16BE(table + 4);
      let fallback: string | null = null;
      for (let j = 0; j < count; j++) {
        const r = table + 6 + j * 12;
        const platform = buf.readUInt16BE(r);
        const nameId = buf.readUInt16BE(r + 6);
        if (platform !== 3 || (nameId !== 1 && nameId !== 16)) continue;
        const len = buf.readUInt16BE(r + 8);
        const off = strings + buf.readUInt16BE(r + 10);
        const raw = buf.subarray(off, off + len);
        const utf16le = Buffer.alloc(raw.length);
        for (let k = 0; k + 1 < raw.length; k += 2) { utf16le[k] = raw[k + 1]; utf16le[k + 1] = raw[k]; }
        const name = utf16le.toString("utf16le");
        if (nameId === 16) return name; // 字型家族（優先）
        fallback ??= name;
      }
      return fallback;
    }
  } catch {
    /* 格式不對就用預設名稱 */
  }
  return null;
}

export function buildComposeArgs(opts: {
  videoPath: string;
  narrationPath: string;
  assPath: string | null;
  fontsDir: string;
  info: MediaInfo;
  outPath: string;
}): string[] {
  const { info } = opts;
  const delayMs = Math.round(NARRATION_DELAY_SECONDS * 1000);

  const video = opts.assPath
    ? `[0:v]ass=filename='${escapeFilterPath(opts.assPath)}':fontsdir='${escapeFilterPath(opts.fontsDir)}'[vout]`
    : "[0:v]null[vout]";
  const narration = `[1:a]adelay=${delayMs}:all=1[nar]`;
  const audio = info.hasAudio
    ? `[0:a]volume=${AMBIENT_VOLUME}[amb];${narration};[amb][nar]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]`
    : `${narration.replace("[nar]", ",apad[aout]")}`;

  return [
    "-hide_banner", "-y",
    "-i", opts.videoPath,
    "-i", opts.narrationPath,
    "-filter_complex", `${video};${audio}`,
    "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
    "-movflags", "+faststart",
    ...(info.duration ? ["-t", info.duration.toFixed(2)] : ["-shortest"]),
    opts.outPath,
  ];
}

/**
 * 確保 ffmpeg 可執行。Vercel／Lambda 的程式目錄是唯讀的，打包後執行權限可能不見：
 * 沒有執行權限就複製到可寫的 tmpTarget（/tmp）再補權限
 */
export async function ensureExecutable(source: string | null, tmpTarget: string): Promise<string> {
  if (!source) throw new Error("ffmpeg binary not available (ffmpeg-static returned no path)");
  try {
    await access(source, fsConstants.F_OK);
  } catch {
    throw new Error(`ffmpeg binary missing at ${source} (check outputFileTracingIncludes in next.config)`);
  }
  try {
    await access(source, fsConstants.X_OK);
    return source;
  } catch {
    await copyFile(source, tmpTarget);
    await chmod(tmpTarget, 0o755);
    return tmpTarget;
  }
}

/** 同一個執行個體只檢查一次；失敗就下次重試 */
let executablePath: Promise<string> | null = null;
function resolveFfmpegPath(): Promise<string> {
  executablePath ??= ensureExecutable(
    ffmpegPath as string | null,
    path.join(tmpdir(), "ffmpeg-static-bin")
  ).catch((e) => {
    executablePath = null;
    throw e;
  });
  return executablePath;
}

async function runFfmpeg(
  args: string[],
  timeoutMs = FFMPEG_TIMEOUT_MS,
  env: NodeJS.ProcessEnv = process.env
): Promise<{ code: number | null; stderr: string }> {
  const bin = await resolveFfmpegPath();
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"], env });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stderr }); });
  });
}

/** Google Fonts 對非瀏覽器 UA 回 TTF；text= 只打包用到的字 */
export async function fetchSubtitleFont(text: string, timeoutMs = FONT_TIMEOUT_MS): Promise<Buffer> {
  const deadline = Date.now() + timeoutMs;
  const left = () => Math.max(500, deadline - Date.now());
  const glyphs = [...new Set([...text])].join("");
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(glyphs)}`,
      { headers: { "User-Agent": "curl/8.0" }, signal: AbortSignal.timeout(left()) }
    )
  ).text();
  const url = css.match(/url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error("subtitle font url not found");
  const res = await fetch(url, { signal: AbortSignal.timeout(left()) });
  if (!res.ok) throw new Error(`subtitle font HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * 合成：回傳新的 mp4。任何一步失敗都丟錯，由呼叫端決定是否改用原始影片。
 * deadline（epoch ms）：抓字型與 ffmpeg 都不會超過它；剩的時間不夠就丟 ComposeBudgetError
 */
export async function composeNarratedVideo(opts: {
  video: Buffer;
  narration: Buffer;
  cues: SubtitleCue[];
  deadline?: number;
}): Promise<Buffer> {
  const deadline = opts.deadline ?? Date.now() + FFMPEG_TIMEOUT_MS + FONT_TIMEOUT_MS + 5_000;
  const left = () => deadline - Date.now();
  if (left() < MIN_FFMPEG_MS) throw new ComposeBudgetError();

  const dir = await mkdtemp(path.join(tmpdir(), "travel-video-"));
  try {
    const videoPath = path.join(dir, "in.mp4");
    const narrationPath = path.join(dir, "narration.wav");
    const fontsDir = path.join(dir, "fonts");
    const outPath = path.join(dir, "out.mp4");
    await writeFile(videoPath, opts.video);
    await writeFile(narrationPath, opts.narration);

    const probe = await runFfmpeg(["-hide_banner", "-i", videoPath]);
    const info = parseMediaInfo(probe.stderr);
    if (!info.width || !info.height) throw new Error("cannot read video size");

    let assPath: string | null = null;
    if (opts.cues.length > 0) {
      const fontBudget = Math.min(FONT_TIMEOUT_MS, left() - MIN_FFMPEG_MS);
      if (fontBudget < 1_000) throw new ComposeBudgetError();
      const font = await fetchSubtitleFont(opts.cues.map((c) => c.text).join(""), fontBudget);
      await mkdir(fontsDir, { recursive: true });
      await writeFile(path.join(fontsDir, "subtitle.ttf"), font);
      assPath = path.join(dir, "subtitles.ass");
      await writeFile(
        assPath,
        buildAssSubtitles({
          cues: opts.cues,
          width: info.width,
          height: info.height,
          fontName: fontFamilyName(font) ?? "Noto Sans TC",
        }),
        "utf8"
      );
    }

    const ffmpegBudget = Math.min(FFMPEG_TIMEOUT_MS, left());
    if (ffmpegBudget < MIN_FFMPEG_MS) throw new ComposeBudgetError();
    const fontconfigFile = path.join(dir, "fonts.conf");
    await writeFile(fontconfigFile, buildFontconfig(fontsDir, path.join(dir, "fc-cache")), "utf8");
    const result = await runFfmpeg(
      buildComposeArgs({ videoPath, narrationPath, assPath, fontsDir, info, outPath }),
      ffmpegBudget,
      { ...process.env, FONTCONFIG_FILE: fontconfigFile }
    );
    if (result.code !== 0) {
      throw new Error(`ffmpeg exited ${result.code}: ${result.stderr.slice(-600)}`);
    }
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
