/**
 * 邁笙平台 AI 配音（預設 gem-3.1-tts），出遊影片口白用
 * 流程同影片：POST /v1/media/generate 拿 task_id → 輪詢 task-status → 下載音檔
 * 配音通常 10～20 秒完成，所以在請求內直接等結果
 *
 * 只能在伺服器端使用（會讀 LK888_API_KEY）
 */

import { lk888ApiKey, lk888BaseUrl } from "./lk888";
import { parseCreateResponse, queryVideoTask, VideoProviderError } from "./lk888-video";
import { isWav, toWav } from "./audio-convert";
import {
  DEFAULT_NARRATION_ACCENT,
  narrationAccent,
  narrationVoice,
  type NarrationAccentId,
  type NarrationVoiceId,
} from "../travel-video";

const DEFAULT_TTS_MODEL = "gem-3.1-tts";
/** 複製聲音用的配音模型（邁笙只有 speech-2.8 支援複製的音色） */
export const CLONE_TTS_MODEL = "speech-2.8";

/** 誰來念：四種 AI 聲音（可選口音）或長輩自己複製的聲音 */
export type NarrationSpeaker =
  | { kind: "preset"; voice: NarrationVoiceId; accent?: NarrationAccentId }
  | { kind: "clone"; providerVoiceId: string };
const POLL_INTERVAL_MS = 2_000;
/**
 * 建立＋輪詢＋下載共用一個總期限：route 與前端都是 60 秒，留時間上傳 Storage
 * （每一步的逾時都不超過剩餘時間，避免付費的配音做好了卻因請求被砍而拿不到）
 */
const TOTAL_BUDGET_MS = 45_000;

export function ttsModel(): string {
  return process.env.LK888_TTS_MODEL || DEFAULT_TTS_MODEL;
}

/** 換口音時不提台灣，免得口音被拉回台灣腔 */
const ACCENT_SPEAKER: Record<NarrationVoiceId, string> = {
  female: "an elderly grandmother",
  male: "an elderly grandfather",
  young_female: "a young woman in her late twenties",
  young_male: "a young man in his late twenties",
};

/**
 * 實測：用英文描述語氣＋口音，模型不會把指示念出來。
 * 預設台灣口音沿用最早實測過的指示；換口音時模型容易自己加「齁、捏、啊」，所以要求一字不改（字幕照原句）
 */
export function buildTtsPrompt(text: string, voice: NarrationVoiceId, accent: NarrationAccentId = DEFAULT_NARRATION_ACCENT): string {
  const { persona, young } = narrationVoice(voice);
  if (accent === DEFAULT_NARRATION_ACCENT) {
    return young
      ? `Read in a warm, friendly, ${persona}'s voice (in their late twenties), with a natural Taiwanese Mandarin accent, at a relaxed pace: ${text}`
      : `Read slowly in a warm, kind, ${persona}'s voice, with a gentle Taiwanese Mandarin accent: ${text}`;
  }
  const tone = young ? "warm, friendly" : "warm, kind";
  const pace = young ? "at a relaxed pace" : "slowly";
  return (
    `In the ${tone} voice of ${ACCENT_SPEAKER[voice]}, speak Mandarin with ${narrationAccent(accent).phrase}, ${pace}. ` +
    `Read these exact words only, without adding or changing any word or particle: ${text}`
  );
}

/** 送去平台的請求內容（兩種模型的參數不同） */
export function buildTtsRequest(text: string, speaker: NarrationSpeaker): { model: string; prompt: string; params: Record<string, string> } {
  if (speaker.kind === "clone") {
    // speech-2.8：Turbo 目前平台沒開，只能用 HD；念的就是原句，不加語氣指示（會被念出來）
    return { model: CLONE_TTS_MODEL, prompt: text, params: { voice_id: speaker.providerVoiceId, quality: "hd" } };
  }
  return {
    model: ttsModel(),
    prompt: buildTtsPrompt(text, speaker.voice, speaker.accent),
    params: { voice_id: narrationVoice(speaker.voice).ttsVoice },
  };
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

export async function synthesizeNarration(text: string, speaker: NarrationSpeaker): Promise<NarrationAudio> {
  const apiKey = lk888ApiKey();
  if (!apiKey) throw new VideoProviderError("LK888_API_KEY not configured", 0, "not_configured");
  const request = buildTtsRequest(text, speaker);
  const model = request.model;
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const budget = (maxMs: number) => Math.max(1_000, Math.min(maxMs, deadline - Date.now()));

  const res = await fetch(`${lk888BaseUrl()}/v1/media/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(budget(15_000)),
  });
  const taskId = parseCreateResponse(res.status, await res.json().catch(() => null));

  while (deadline - Date.now() > POLL_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const task = await queryVideoTask(taskId, budget(10_000));
    if (task.status === "failed") {
      throw new VideoProviderError(`TTS failed: ${task.errorMessage ?? "unknown"}`, 0, "tts_failed");
    }
    if (task.status === "succeeded" && task.videoUrl) {
      const dl = await fetch(task.videoUrl, { signal: AbortSignal.timeout(budget(15_000)) });
      if (!dl.ok) throw new Error(`TTS download HTTP ${dl.status}`);
      const raw = Buffer.from(await dl.arrayBuffer());
      // 複製聲音的模型可能回 mp3 → 一律轉成 WAV，後面算秒數、混音都用同一種格式
      const audio = isWav(raw) ? raw : await toWav(raw);
      return { audio, seconds: wavDurationSeconds(audio), model, taskId, platformCost: task.platformCost };
    }
  }
  throw new VideoProviderError("TTS timeout", 0, "timeout");
}

// ── 複製聲音（邁笙 POST /v1/skills/voices/clone，只給 speech-2.8 用）──
// 建立 0.1 算力；新音色 7 天內沒用就失效；第一次拿來配音時平台另收一次 18.8 算力啟用費，之後永久有效

export interface ClonedVoice {
  voiceId: string;
  demoUrl: string | null;
  expiresAt: string | null;
}

/** /v1/skills/* 是裸物件（不是 {code,msg,data}），出錯時 {error:{message,type}} 看 HTTP 狀態 */
export function parseCloneResponse(httpStatus: number, json: unknown): ClonedVoice {
  const body = (json ?? {}) as Record<string, unknown>;
  const err = body.error as { message?: string; type?: string } | undefined;
  if (httpStatus < 200 || httpStatus >= 300 || err) {
    const code = httpStatus === 402 ? "insufficient_balance" : err?.type ?? null;
    throw new VideoProviderError(`voice clone failed: ${err?.message ?? `HTTP ${httpStatus}`}`, httpStatus, code);
  }
  const voiceId = typeof body.voice_id === "string" ? body.voice_id : "";
  if (!voiceId) throw new VideoProviderError("voice clone response missing voice_id", httpStatus, "bad_response");
  return {
    voiceId,
    demoUrl: typeof body.demo_audio === "string" && body.demo_audio ? body.demo_audio : null,
    expiresAt: typeof body.expires_at === "string" && body.expires_at ? body.expires_at : null,
  };
}

/** sampleWav：長輩的錄音（已轉成 WAV、10～60 秒）；name 在同一把 key 下不能重複、≤50 字 */
export async function cloneVoice(sampleWav: Buffer, name: string): Promise<ClonedVoice> {
  const apiKey = lk888ApiKey();
  if (!apiKey) throw new VideoProviderError("LK888_API_KEY not configured", 0, "not_configured");
  const res = await fetch(`${lk888BaseUrl()}/v1/skills/voices/clone`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ audio_url: `data:audio/wav;base64,${sampleWav.toString("base64")}`, name: name.slice(0, 50) }),
    signal: AbortSignal.timeout(40_000),
  });
  return parseCloneResponse(res.status, await res.json().catch(() => null));
}
