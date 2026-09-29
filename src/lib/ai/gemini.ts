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

export function getGeminiModel(
  generationConfig: GenerationConfig,
  opts: { task?: GeminiTask; googleModel?: string } = {}
): { model: GenerativeModel; config: GeminiConfig } {
  const config = resolveGeminiConfig(process.env, opts);
  if (!config.apiKey) {
    throw new Error(`${config.provider === "lk888" ? "LK888_API_KEY" : "GEMINI_API_KEY"} not configured`);
  }
  const model = new GoogleGenerativeAI(config.apiKey).getGenerativeModel(
    { model: config.model, generationConfig },
    config.baseUrl ? { baseUrl: config.baseUrl, timeout: 60_000 } : undefined
  );
  return { model, config };
}

/** 解析模型回的 JSON；容錯偶爾包在 ```json 區塊裡的情況 */
export function parseModelJson<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed) as T;
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

  const text = result.response.text();
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
