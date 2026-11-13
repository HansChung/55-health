import {
  GoogleGenerativeAI,
  type GenerationConfig,
  type GenerativeModel,
} from "@google/generative-ai";
import { lk888ApiKey, lk888BaseUrl } from "./lk888";

export type GeminiProvider = "lk888" | "google";
/** vision = 拍照辨識（食物、藥袋）；text = AI 建議等純文字 */
export type GeminiTask = "vision" | "text";

export interface GeminiConfig {
  provider: GeminiProvider;
  apiKey: string | null;
  model: string;
  /** 只有走邁笙時才有（Gemini 相容協議，SDK 換 base_url 即可） */
  baseUrl?: string;
}

const LK888_DEFAULT_MODEL: Record<GeminiTask, string> = {
  vision: "gem-3.8-flash", // 多模態、速度快
  text: "gem-3.5-flash-lite", // 最快最便宜，文字建議夠用
};

/**
 * Gemini 呼叫走哪一家（拍照辨識、AI 建議共用）：
 * - 有 LK888_API_KEY → 邁笙平台，模型 gem-*
 *   看圖預設 gem-3.8-flash（LK888_VISION_MODEL）、文字預設 gem-3.5-flash-lite（LK888_TEXT_MODEL）
 * - GEMINI_PROVIDER=google → 強制改回 Google 直連（GEMINI_API_KEY）；googleModel 只在這時生效
 */
export function resolveGeminiConfig(
  env: Record<string, string | undefined> = process.env,
  opts: { task?: GeminiTask; googleModel?: string } = {}
): GeminiConfig {
  const task = opts.task ?? "vision";
  const useLk888 =
    env.GEMINI_PROVIDER === "lk888" ||
    (env.GEMINI_PROVIDER !== "google" && Boolean(lk888ApiKey(env)));
  if (useLk888) {
    const override = task === "vision" ? env.LK888_VISION_MODEL : env.LK888_TEXT_MODEL;
    return {
      provider: "lk888",
      apiKey: lk888ApiKey(env),
      model: override || LK888_DEFAULT_MODEL[task],
      baseUrl: lk888BaseUrl(env),
    };
  }

  // 強制使用 flash（2.5-pro 免費額度=0，避免 env var 錯設）
  let model = opts.googleModel || env.GEMINI_MODEL || "gemini-2.5-flash";
  if (model === "gemini-2.5-pro") {
    console.warn("[gemini] GEMINI_MODEL was set to gemini-2.5-pro, forcing to gemini-2.5-flash (免費版無 pro 額度)");
    model = "gemini-2.5-flash";
  }
  return { provider: "google", apiKey: env.GEMINI_API_KEY || null, model };
}

export function isGeminiConfigured(): boolean {
  return Boolean(resolveGeminiConfig().apiKey);
}

/**
 * 看圖模型的備援：主模型在邁笙的線路全掛時改用這個再試一次
 * 2026-11-12 gem-3.8-flash 勾選的兩條線路（AM-cli、ZG-Anti-GEM-1）同時「臨時下線」→ 拍照記餐、拍照問暖暖整天都失敗；
 * gem-3.5-flash-lite 也看得懂照片（實測約 2 秒、JSON 正常），平常就給文字用，線路是另一組。
 * LK888_VISION_FALLBACK_MODEL 可改；設成 none 就關掉。只有走邁笙的看圖任務才有。
 */
export function visionFallbackModel(
  env: Record<string, string | undefined>,
  task: GeminiTask,
  config: GeminiConfig
): string | null {
  if (config.provider !== "lk888" || task !== "vision") return null;
  const raw = env.LK888_VISION_FALLBACK_MODEL?.trim();
  if (raw && raw.toLowerCase() === "none") return null;
  const model = raw || LK888_DEFAULT_MODEL.text;
  return model === config.model ? null : model;
}

/** 線路下線（403）、限流（429）、逾時、上游 5xx、連不上 → 換模型可能會好；400／401 換了也一樣，不換 */
export function shouldFallBack(e: unknown): boolean {
  if (e instanceof Error && e.name === "AbortError") return false;
  const status = (e as { status?: unknown } | null)?.status;
  if (typeof status !== "number") return true;
  return status === 403 || status === 408 || status === 429 || status >= 500;
}

export function getGeminiModel(
  generationConfig: GenerationConfig,
  opts: { task?: GeminiTask; googleModel?: string } = {}
): { model: GenerativeModel; config: GeminiConfig } {
  const config = resolveGeminiConfig(process.env, opts);
  if (!config.apiKey) {
    throw new Error(`${config.provider === "lk888" ? "LK888_API_KEY" : "GEMINI_API_KEY"} not configured`);
  }
  const build = (name: string) =>
    new GoogleGenerativeAI(config.apiKey!).getGenerativeModel(
      { model: name, generationConfig },
      config.baseUrl ? { baseUrl: config.baseUrl, timeout: 60_000 } : undefined
    );
  const model = build(config.model);

  const fallback = visionFallbackModel(process.env, opts.task ?? "vision", config);
  if (fallback) {
    const primary = model.generateContent.bind(model);
    model.generateContent = async (...args) => {
      try {
        return await primary(...args);
      } catch (e) {
        if (!shouldFallBack(e)) throw e;
        console.warn(`[gemini] ${config.model} failed, retrying with ${fallback}:`, e instanceof Error ? e.message.slice(0, 200) : e);
        const result = await build(fallback).generateContent(...args);
        // 呼叫端用 config.model 記用量／算成本：記成真的回答的那個模型
        config.model = fallback;
        return result;
      }
    };
  }
  return { model, config };
}

/**
 * 模型真正的回答：只取不是「思考過程」的段落
 * 有些通道（例如 lk888 的 AM-cli）會把思考摘要當成第一段 part（thought: true）一起回；
 * SDK 的 response.text() 會把它也接進去 → 前面多一大段英文，JSON 解析失敗（2026-10-27 拍照全部失敗就是這個）
 */
export function modelText(response: { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[]; text: () => string }): string {
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) return response.text();
  return parts
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

/** 解析模型回的 JSON；容錯包在 ```json 區塊裡、或前後多了說明文字的情況 */
export function parseModelJson<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(body) as T;
  } catch (e) {
    // 前面混了別的字：取最後一個 ```json 區塊，或第一個 { / [ 到最後一個 } / ] 之間
    const blocks = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)];
    if (blocks.length > 0) return JSON.parse(blocks[blocks.length - 1][1]) as T;
    const start = body.search(/[{[]/);
    const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(body.slice(start, end + 1)) as T;
    throw e;
  }
}

const FOOD_ANALYSIS_PROMPT = `你是專業的台灣營養師，請分析這張照片裡的食物。

請用 JSON 格式回覆（只回 JSON，不要其他文字）：
{
  "items": [
    { "name": "食物名稱（繁體中文）", "amount": "份量描述", "cal": 熱量大卡, "emoji": "對應emoji", "color": "#hex顏色" }
  ],
  "total": {
    "cal": 總熱量,
    "protein": 蛋白質克數,
    "carb": 醣類克數,
    "fat": 脂肪克數
  },
  "tip": "一句給長輩的健康提醒（30 字內，溫暖口吻）"
}

重要：
- 用繁體中文（台灣用語）
- 份量說「半碗」「一份」「3 塊」這種長輩看得懂的描述
- 顏色用食物本身的色調 hex
- 若不確定請給合理估計，不要寫「未知」`;

export interface FoodAnalysisResult {
  items: Array<{
    name: string;
    amount: string;
    cal: number;
    emoji: string;
    color: string;
  }>;
  total: {
    cal: number;
    protein: number;
    carb: number;
    fat: number;
  };
  tip: string;
}

export async function analyzeFoodImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{
  result: FoodAnalysisResult;
  usage: { inputTokens: number; outputTokens: number; model: string; provider: GeminiProvider };
}> {
  const { model: generativeModel, config } = getGeminiModel({
    responseMimeType: "application/json",
    temperature: 0.4,
  });

  const result = await generativeModel.generateContent([
    { text: FOOD_ANALYSIS_PROMPT },
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const text = modelText(result.response);
  let parsed: FoodAnalysisResult;
  try {
    parsed = parseModelJson<FoodAnalysisResult>(text);
  } catch (e) {
    throw new Error("Gemini 回傳格式錯誤：" + text.substring(0, 200));
  }

  const usageMetadata = result.response.usageMetadata;
  return {
    result: parsed,
    usage: {
      inputTokens: usageMetadata?.promptTokenCount ?? 0,
      outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
      model: config.model,
      provider: config.provider,
    },
  };
}
