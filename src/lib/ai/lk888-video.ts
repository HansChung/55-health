/**
 * 邁笙 AI 影音創作平台（api.lk888.ai）圖轉影片，預設模型 minimax-h3（MiniMax 海螺 H3）
 * 文件：https://maxim.lk888.ai/apidoc#model/minimax-h3
 * 非同步流程：POST /v1/media/generate 拿 task_id → GET /v1/skills/task-status 輪詢 → 成功給 result_url
 *
 * 只能在伺服器端使用（會讀 LK888_API_KEY）
 */

import { TRAVEL_VIDEO_DURATION_SECONDS, type TravelVideoStatus } from "../travel-video";
import { lk888ApiKey, lk888BaseUrl } from "./lk888";

const DEFAULT_MODEL = "minimax-h3";
/** 768P 性價比最高、出片快；2K 單價約 1.6 倍 */
export const VIDEO_RESOLUTION = "768P";

export class VideoProviderError extends Error {
  httpStatus: number;
  code: string | null;
  constructor(message: string, httpStatus: number, code: string | null = null) {
    super(message);
    this.name = "VideoProviderError";
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export function isVideoProviderConfigured(): boolean {
  return Boolean(lk888ApiKey());
}

export function videoModel(): string {
  return process.env.LK888_VIDEO_MODEL || DEFAULT_MODEL;
}

function getConfig() {
  const apiKey = lk888ApiKey();
  if (!apiKey) throw new VideoProviderError("LK888_API_KEY not configured", 0, "not_configured");
  return { apiKey, baseUrl: lk888BaseUrl(), model: videoModel() };
}

/**
 * imageUrl 可以是公網直鏈或 data:image/...;base64（解碼後 ≤10MB）
 * notifyUrl：任務到終態時平台會 POST 到這裡（頂層欄位，不放 params）
 */
export function buildImageToVideoBody(opts: {
  model: string;
  imageUrl: string;
  prompt: string;
  notifyUrl?: string | null;
  /** 4～15 秒；有口白時依口白長度決定 */
  durationSeconds?: number;
}) {
  return {
    model: opts.model,
    prompt: opts.prompt,
    ...(opts.notifyUrl ? { notify_url: opts.notifyUrl } : {}),
    // 模型專屬參數一律放 params；select 類參數要傳字串
    params: {
      mode: "shouweizhen", // 首尾幀模式
      // 首幀＝尾幀＝同一張照片：影片必須回到原照片，H3 就不會中途換成自己生成的場景或冒出陌生人
      // （實測只給首幀時曾在第 3 秒切到新鏡頭並多出一對男女；頭尾同圖則全程是原場景、動態幅度不變）
      images: [opts.imageUrl, opts.imageUrl],
      duration: String(opts.durationSeconds ?? TRAVEL_VIDEO_DURATION_SECONDS),
      resolution: VIDEO_RESOLUTION,
      aspect_ratio: "adaptive", // 跟著照片比例
    },
  };
}

type Json = Record<string, unknown> | null;

function errorFrom(httpStatus: number, json: Json): VideoProviderError {
  const err = json?.error as { message?: string; type?: string } | string | undefined;
  const message =
    (typeof err === "string" ? err : err?.message) ??
    (typeof json?.msg === "string" ? json.msg : undefined) ??
    "unknown error";
  const code = typeof err === "object" && err?.type ? err.type : null;
  return new VideoProviderError(`LK888 HTTP ${httpStatus}: ${message}`, httpStatus, code);
}

/** 成功判定：HTTP 2xx 且 body.code === 200（這個平台沒有 code=0 的語義） */
export function parseCreateResponse(httpStatus: number, json: Json): string {
  if (httpStatus < 200 || httpStatus >= 300) throw errorFrom(httpStatus, json);
  const bodyCode = typeof json?.code === "number" ? json.code : null;
  if (bodyCode !== 200) {
    // 例：402 餘額不足、400 檔案太大、500 Key 額度不足（data.失敗原因）
    const data = json?.data as Record<string, unknown> | undefined;
    const reason = typeof data?.["失败原因"] === "string" ? `（${data["失败原因"]}）` : "";
    const e = errorFrom(bodyCode ?? httpStatus, json);
    e.message += reason;
    throw e;
  }
  const taskId = (json?.data as { task_id?: unknown } | undefined)?.task_id;
  if (typeof taskId !== "number" && typeof taskId !== "string") {
    throw new VideoProviderError("LK888 response missing data.task_id", httpStatus, "bad_response");
  }
  return String(taskId);
}

export interface VideoTaskResult {
  status: TravelVideoStatus;
  videoUrl: string | null;
  /** 全部結果（Suno 一次做兩個版本）；videoUrl 是第一個 */
  urls?: string[];
  errorMessage: string | null;
  /** 平台實際扣的算力值（完成後才有） */
  platformCost: number | null;
}

export function parseQueryResponse(httpStatus: number, json: Json): VideoTaskResult {
  if (httpStatus < 200 || httpStatus >= 300) throw errorFrom(httpStatus, json);
  const state = json?.state;
  if (typeof state !== "string") {
    throw new VideoProviderError("LK888 response missing state", httpStatus, "bad_response");
  }

  const urls = Array.isArray(json?.result_urls) ? (json.result_urls as unknown[]) : [];
  const url =
    (typeof urls[0] === "string" && urls[0]) ||
    (typeof json?.result_url === "string" && json.result_url) ||
    null;
  const platformCost = typeof json?.cost === "number" ? json.cost : null;
  const errorText = typeof json?.error === "string" && json.error ? json.error : null;

  if (state === "success") {
    // 轉存還沒好時 result_url 會是空的 → 當作還在做，下次再查
    const all = urls.filter((u): u is string => typeof u === "string" && Boolean(u));
    return url
      ? { status: "succeeded", videoUrl: url, urls: all.length > 0 ? all : [url], errorMessage: null, platformCost }
      : { status: "running", videoUrl: null, errorMessage: null, platformCost };
  }
  if (state === "failed" || json?.is_final === true) {
    return { status: "failed", videoUrl: null, errorMessage: errorText ?? state, platformCost };
  }
  return {
    status: state === "pending" ? "queued" : "running",
    videoUrl: null,
    errorMessage: null,
    platformCost,
  };
}

/** 建立圖轉影片任務，回傳 task_id */
export async function createImageToVideoTask(opts: {
  imageUrl: string;
  prompt: string;
  notifyUrl?: string | null;
  durationSeconds?: number;
}): Promise<{ taskId: string; model: string }> {
  const { apiKey, baseUrl, model } = getConfig();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/v1/media/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildImageToVideoBody({ model, ...opts })),
      // 留在 route maxDuration（60 秒）內，後面還要寫 DB
      signal: AbortSignal.timeout(35_000),
    });
  } catch (e) {
    // 逾時：平台可能其實已建立並扣費（文件警告），呼叫端不能當作「沒建成功」
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new VideoProviderError("LK888 create timeout", 0, "timeout");
    }
    throw e;
  }
  const json = (await res.json().catch(() => null)) as Json;
  return { taskId: parseCreateResponse(res.status, json), model };
}

/** 查任務狀態（影片、配音共用同一個端點） */
export async function queryVideoTask(taskId: string, timeoutMs = 15_000): Promise<VideoTaskResult> {
  const { apiKey, baseUrl } = getConfig();
  const res = await fetch(
    `${baseUrl}/v1/skills/task-status?task_id=${encodeURIComponent(taskId)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    }
  );
  const json = (await res.json().catch(() => null)) as Json;
  return parseQueryResponse(res.status, json);
}
