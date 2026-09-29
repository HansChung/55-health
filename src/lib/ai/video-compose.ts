/**
 * 出遊影片後製：把口白疊到 H3 影片上（環境音調小），字幕照原句燒進畫面
 * 用 ffmpeg-static 內建的 ffmpeg；字型在執行時向 Google Fonts 只取「字幕用到的字」（通常 < 20KB）
 *
 * 只能在伺服器端使用。Vercel 需在 next.config 的 outputFileTracingIncludes 帶上 ffmpeg 執行檔
 */

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { NARRATION_DELAY_SECONDS, type SubtitleCue } from "../travel-video";

/** 要留在 route maxDuration（60 秒）內：前面還有下載、後面還要上傳 */
const FFMPEG_TIMEOUT_MS = 30_000;
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

export function buildComposeArgs(opts: {
  videoPath: string;
  narrationPath: string;
  fontPath: string;
  cues: Array<SubtitleCue & { textFile: string }>;
  info: MediaInfo;
  outPath: string;
}): string[] {
  const { info } = opts;
  const fontSize = subtitleFontSize(info.width, info.height);
  const margin = Math.round(info.height * 0.07);
  const delayMs = Math.round(NARRATION_DELAY_SECONDS * 1000);

  const drawtexts = opts.cues.map(
    (c) =>
      `drawtext=fontfile='${escapeFilterPath(opts.fontPath)}':textfile='${escapeFilterPath(c.textFile)}'` +
      `:fontsize=${fontSize}:fontcolor=white:line_spacing=${Math.round(fontSize * 0.25)}` +
      `:box=1:boxcolor=black@0.45:boxborderw=${Math.round(fontSize * 0.35)}` +
      `:x=(w-text_w)/2:y=h-text_h-${margin}:enable='between(t,${c.start},${c.end})'`
  );
  const video = `[0:v]${drawtexts.length ? drawtexts.join(",") : "null"}[vout]`;
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

function runFfmpeg(args: string[]): Promise<{ code: number | null; stderr: string }> {
  if (!ffmpegPath) throw new Error("ffmpeg binary not available");
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath as string, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), FFMPEG_TIMEOUT_MS);
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stderr }); });
  });
}

/** Google Fonts 對非瀏覽器 UA 回 TTF；text= 只打包用到的字 */
export async function fetchSubtitleFont(text: string): Promise<Buffer> {
  const glyphs = [...new Set([...text])].join("");
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(glyphs)}`,
      { headers: { "User-Agent": "curl/8.0" }, signal: AbortSignal.timeout(10_000) }
    )
  ).text();
  const url = css.match(/url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error("subtitle font url not found");
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`subtitle font HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** 合成：回傳新的 mp4。任何一步失敗都丟錯，由呼叫端決定是否改用原始影片 */
export async function composeNarratedVideo(opts: {
  video: Buffer;
  narration: Buffer;
  cues: SubtitleCue[];
}): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "travel-video-"));
  try {
    const videoPath = path.join(dir, "in.mp4");
    const narrationPath = path.join(dir, "narration.wav");
    const fontPath = path.join(dir, "font.ttf");
    const outPath = path.join(dir, "out.mp4");
    await writeFile(videoPath, opts.video);
    await writeFile(narrationPath, opts.narration);

    const probe = await runFfmpeg(["-hide_banner", "-i", videoPath]);
    const info = parseMediaInfo(probe.stderr);
    if (!info.width || !info.height) throw new Error("cannot read video size");

    const fontSize = subtitleFontSize(info.width, info.height);
    const maxChars = Math.max(6, Math.floor((info.width * 0.86) / fontSize));
    const cues = await Promise.all(
      opts.cues.map(async (c, i) => {
        const textFile = path.join(dir, `cue${i}.txt`);
        await writeFile(textFile, wrapSubtitle(c.text, maxChars), "utf8");
        return { ...c, textFile };
      })
    );
    if (cues.length > 0) {
      await writeFile(fontPath, await fetchSubtitleFont(opts.cues.map((c) => c.text).join("")));
    }

    const result = await runFfmpeg(
      buildComposeArgs({ videoPath, narrationPath, fontPath, cues, info, outPath })
    );
    if (result.code !== 0) {
      throw new Error(`ffmpeg exited ${result.code}: ${result.stderr.slice(-600)}`);
    }
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
