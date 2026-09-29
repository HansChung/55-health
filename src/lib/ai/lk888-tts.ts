/**
 * 邁笙平台 AI 配音（預設 gem-3.1-tts），出遊影片口白用
 * 流程同影片：POST /v1/media/generate 拿 task_id → 輪詢 task-status → 下載音檔
 * 配音通常 10～20 秒完成，所以在請求內直接等結果
 *
 * 只能在伺服器端使用（會讀 LK888_API_KEY）
 */

import { lk888ApiKey, lk888BaseUrl } from "./lk888";
import { parseCreateResponse, queryVideoTask, VideoProviderError } from "./lk888-video";
import { narrationVoice, type NarrationVoiceId } from "../travel-video";

const DEFAULT_TTS_MODEL = "gem-3.1-tts";
const POLL_INTERVAL_MS = 2_000;
const MAX_WAIT_MS = 40_000;

export function ttsModel(): string {
  return process.env.LK888_TTS_MODEL || DEFAULT_TTS_MODEL;
}

/** 實測：用英文描述語氣＋台灣口音，模型不會把指示念出來，念的內容與原句一致 */
export function buildTtsPrompt(text: string, voice: NarrationVoiceId): string {
  const { persona } = narrationVoice(voice);
  return `Read slowly in a warm, kind, elderly Taiwanese ${persona}'s voice, with a gentle Taiwanese Mandarin accent: ${text}`;
}

/** 讀 WAV（RIFF）標頭算秒數；找 fmt / data 區塊，不假設固定 44 bytes */
export function wavDurationSeconds(buf: Buffer): number {
  if (buf.length < 12 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("not a WAV file");
  }
  let byteRate = 0;
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(offset + 16);
    if (id === "data") {
      if (!byteRate) throw new Error("WAV missing fmt chunk");
      const dataBytes = Math.min(size, buf.length - offset - 8);
      return dataBytes / byteRate;
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAV missing data chunk");
}

export interface NarrationAudio {
  audio: Buffer;
  seconds: number;
  model: string;
  taskId: string;
  platformCost: number | null;
}

export async function synthesizeNarration(text: string, voice: NarrationVoiceId): Promise<NarrationAudio> {
  const apiKey = lk888ApiKey();
  if (!apiKey) throw new VideoProviderError("LK888_API_KEY not configured", 0, "not_configured");
  const model = ttsModel();

  const res = await fetch(`${lk888BaseUrl()}/v1/media/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: buildTtsPrompt(text, voice),
      params: { voice_id: narrationVoice(voice).ttsVoice },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const taskId = parseCreateResponse(res.status, await res.json().catch(() => null));

  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const task = await queryVideoTask(taskId);
    if (task.status === "failed") {
      throw new VideoProviderError(`TTS failed: ${task.errorMessage ?? "unknown"}`, 0, "tts_failed");
    }
    if (task.status === "succeeded" && task.videoUrl) {
      const dl = await fetch(task.videoUrl, { signal: AbortSignal.timeout(15_000) });
      if (!dl.ok) throw new Error(`TTS download HTTP ${dl.status}`);
      const audio = Buffer.from(await dl.arrayBuffer());
      return { audio, seconds: wavDurationSeconds(audio), model, taskId, platformCost: task.platformCost };
    }
  }
  throw new VideoProviderError("TTS timeout", 0, "timeout");
}
