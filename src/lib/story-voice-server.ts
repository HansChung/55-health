// ────────────────────────────────────────────────
// 故事用自己的聲音念（只在 API route 用；service role）
// 一段段用複製的聲音合成（speech-2.8，回來都轉成 WAV）→ ffmpeg 接起來、段落間停一下 → m4a
// 存在 story-audio：{user}/{story}/voice-{hash}.m4a；文字改了 hash 就不一樣，畫面提示可以重念
// 用到 ffmpeg：route 要在 next.config 的 outputFileTracingIncludes 帶上 ffmpeg
// ────────────────────────────────────────────────

import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runFfmpeg } from "@/lib/ai/video-compose";
import { synthesizeNarration, type NarrationSpeaker } from "@/lib/ai/lk888-tts";
import { STORY_VOICE_PAUSE_SECONDS, splitForVoice } from "@/lib/story-voice";

/** 同時合成幾段（太多容易被平台限流） */
const PARALLEL = 3;
const CONCAT_TIMEOUT_MS = 60_000;

export interface StoredVoiceReading {
  path: string;
  seconds: number;
  /** 念的是哪個版本的文字（storyVoiceHash） */
  text_hash: string;
  /** 用哪一個「我的聲音」念的 */
  clone_id: string;
  created_at: string;
}

export function storyVoiceHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

export function storyVoicePath(userId: string, storyId: string, hash: string): string {
  return `${userId}/${storyId}/voice-${hash}.m4a`;
}

/** 接起來的 ffmpeg 參數：每段統一成 24k 單聲道、後面補一點停頓，再串成一個 AAC m4a */
export function buildVoiceConcatArgs(inputs: string[], outPath: string, pauseSeconds = STORY_VOICE_PAUSE_SECONDS): string[] {
  const filters = inputs.map(
    (_, i) => `[${i}:a]aresample=24000,aformat=sample_fmts=fltp:channel_layouts=mono${i < inputs.length - 1 ? `,apad=pad_dur=${pauseSeconds}` : ""}[a${i}]`
  );
  const concat = `${inputs.map((_, i) => `[a${i}]`).join("")}concat=n=${inputs.length}:v=0:a=1[out]`;
  return [
    "-hide_banner", "-nostdin", "-y",
    ...inputs.flatMap((p) => ["-i", p]),
    "-filter_complex", [...filters, concat].join(";"),
    "-map", "[out]", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart",
    outPath,
  ];
}

async function concatToM4a(wavs: Buffer[]): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "story-voice-"));
  try {
    const inputs = await Promise.all(
      wavs.map(async (w, i) => {
        const p = path.join(dir, `part-${i}.wav`);
        await writeFile(p, w);
        return p;
      })
    );
    const outPath = path.join(dir, "out.m4a");
    const result = await runFfmpeg(buildVoiceConcatArgs(inputs, outPath), CONCAT_TIMEOUT_MS);
    if (result.code !== 0) throw new Error(`ffmpeg story voice exited ${result.code}: ${result.stderr.slice(-300)}`);
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export interface SynthesizedStoryVoice {
  m4a: Buffer;
  seconds: number;
  chunks: number;
  chars: number;
  model: string;
  platformCost: number;
}

/**
 * 整篇念出來。firstUse：這個聲音還沒啟用（平台第一次合成收啟用費）→ 先念第一段、啟用好了再同時念其他段，
 * 不會同時觸發好幾次啟用；onActivated 在第一段成功後呼叫（記下已啟用）
 */
export async function synthesizeStoryVoice(
  text: string,
  speaker: NarrationSpeaker,
  opts: { firstUse?: boolean; onActivated?: () => Promise<void> } = {}
): Promise<SynthesizedStoryVoice> {
  const chunks = splitForVoice(text);
  if (chunks.length === 0) throw new Error("story voice: empty text");
  const results: Awaited<ReturnType<typeof synthesizeNarration>>[] = new Array(chunks.length);
  let next = 0;
  if (opts.firstUse) {
    results[0] = await synthesizeNarration(chunks[0], speaker);
    await opts.onActivated?.();
    next = 1;
  }
  const worker = async () => {
    while (next < chunks.length) {
      const i = next++;
      results[i] = await synthesizeNarration(chunks[i], speaker);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, chunks.length - next) }, worker));
  const m4a = await concatToM4a(results.map((r) => r.audio));
  const speechSeconds = results.reduce((s, r) => s + r.seconds, 0);
  return {
    m4a,
    seconds: Math.round(speechSeconds + STORY_VOICE_PAUSE_SECONDS * (chunks.length - 1)),
    chunks: chunks.length,
    chars: [...chunks.join("")].length,
    model: results[0].model,
    platformCost: Number(results.reduce((s, r) => s + (r.platformCost ?? 0), 0).toFixed(4)),
  };
}
