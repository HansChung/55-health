/**
 * 邁笙平台 Suno v4.5 做歌（遊記 MV 用）：一次約 0.54 算力、做出兩個版本，約 1～3 分鐘
 * 流程同影片：POST /v1/media/generate 拿 task_id → GET /v1/skills/task-status 輪詢（queryVideoTask）
 * 只能在伺服器端使用（會讀 LK888_API_KEY）
 */

import { lk888ApiKey, lk888BaseUrl } from "./lk888";
import { parseCreateResponse, VideoProviderError } from "./lk888-video";
import type { MvVocal } from "../travel-video";

export const SONG_MODEL = "suno-v4.5";

/** 自訂歌詞模式：prompt＝曲風描述、params.lyrics＝歌詞 */
export function buildSongRequest(opts: { stylePrompt: string; lyrics: string; vocal: MvVocal }) {
  return {
    model: SONG_MODEL,
    prompt: opts.stylePrompt,
    params: {
      lyrics: opts.lyrics,
      mv: "chirp-v4-5",
      make_instrumental: "song",
      vocal_gender: opts.vocal,
    },
  };
}

export async function createSongTask(opts: { stylePrompt: string; lyrics: string; vocal: MvVocal }): Promise<string> {
  const apiKey = lk888ApiKey();
  if (!apiKey) throw new VideoProviderError("LK888_API_KEY not configured", 0, "not_configured");
  let res: Response;
  try {
    res = await fetch(`${lk888BaseUrl()}/v1/media/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildSongRequest(opts)),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    // 逾時：平台可能其實已建立並扣費，呼叫端不能當作「沒建成功」重送
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new VideoProviderError("LK888 song create timeout", 0, "timeout");
    }
    throw e;
  }
  return parseCreateResponse(res.status, await res.json().catch(() => null));
}
