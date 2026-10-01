/**
 * 音檔轉成 WAV（單聲道 24kHz 16-bit）：
 * - 錄音複製聲音：瀏覽器錄的是 webm／mp4，平台只收 MP3／WAV／M4A
 * - 複製聲音的配音可能回 mp3，口白流程（算秒數、ffmpeg 混音）都用 WAV
 *
 * 只能在伺服器端使用（用 ffmpeg-static；route 要在 next.config 的 outputFileTracingIncludes 帶上 ffmpeg）
 */

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runFfmpeg } from "./video-compose";

const CONVERT_TIMEOUT_MS = 20_000;

export function isWav(buf: Buffer): boolean {
  return buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WAVE";
}

/**
 * 使用者上傳的錄音不能讓 ffmpeg 自己猜格式就照做：偽裝成音檔的 DASH／HLS 清單會讓伺服器去連任意網址（SSRF，
 * 已在 Vercel 同款 Linux ffmpeg 重現）。只准讀本機檔案、只准常見的錄音格式
 */
export const SAFE_AUDIO_INPUT = [
  "-protocol_whitelist", "file",
  "-format_whitelist", "mov,mp4,m4a,3gp,3g2,mj2,matroska,webm,ogg,wav,mp3,aac",
];

export function buildToWavArgs(inPath: string, outPath: string, maxSeconds?: number): string[] {
  return [
    "-hide_banner", "-nostdin", "-y",
    ...SAFE_AUDIO_INPUT,
    "-i", inPath,
    ...(maxSeconds ? ["-t", String(maxSeconds)] : []),
    "-vn", "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le",
    outPath,
  ];
}

/** 任何 ffmpeg 讀得懂的音檔 → WAV；maxSeconds 會截掉多餘的部分 */
export async function toWav(input: Buffer, opts: { maxSeconds?: number } = {}): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "audio-"));
  try {
    const inPath = path.join(dir, "in.bin");
    const outPath = path.join(dir, "out.wav");
    await writeFile(inPath, input);
    const result = await runFfmpeg(buildToWavArgs(inPath, outPath, opts.maxSeconds), CONVERT_TIMEOUT_MS);
    if (result.code !== 0) throw new Error(`ffmpeg audio convert exited ${result.code}: ${result.stderr.slice(-400)}`);
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** 16-bit PCM WAV 的音量（RMS，0～1）：用來擋「錄到一片安靜」的錄音 */
export function wavRms(buf: Buffer): number {
  if (!isWav(buf)) throw new Error("not a WAV file");
  let offset = 12;
  let bits = 16;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") bits = buf.readUInt16LE(offset + 22);
    if (id === "data") {
      if (bits !== 16) throw new Error(`unsupported WAV bit depth ${bits}`);
      const end = Math.min(buf.length, offset + 8 + size);
      let sum = 0;
      let n = 0;
      for (let i = offset + 8; i + 1 < end; i += 2) {
        const v = buf.readInt16LE(i) / 32768;
        sum += v * v;
        n += 1;
      }
      return n ? Math.sqrt(sum / n) : 0;
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAV missing data chunk");
}

/** WAV → m4a（AAC 單聲道 64k）：語音留言用，iPhone、Android、電腦瀏覽器都能播 */
export async function wavToM4a(wav: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "audio-"));
  try {
    const inPath = path.join(dir, "in.wav");
    const outPath = path.join(dir, "out.m4a");
    await writeFile(inPath, wav);
    const result = await runFfmpeg(
      ["-hide_banner", "-nostdin", "-y", ...SAFE_AUDIO_INPUT, "-i", inPath, "-ac", "1", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", outPath],
      CONVERT_TIMEOUT_MS
    );
    if (result.code !== 0) throw new Error(`ffmpeg m4a exited ${result.code}: ${result.stderr.slice(-400)}`);
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
