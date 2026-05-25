import { GoogleGenerativeAI } from "@google/generative-ai";

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
  usage: { inputTokens: number; outputTokens: number; model: string };
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const result = await generativeModel.generateContent([
    { text: FOOD_ANALYSIS_PROMPT },
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const text = result.response.text();
  let parsed: FoodAnalysisResult;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error("Gemini 回傳格式錯誤：" + text.substring(0, 200));
  }

  const usageMetadata = result.response.usageMetadata;
  return {
    result: parsed,
    usage: {
      inputTokens: usageMetadata?.promptTokenCount ?? 0,
      outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
      model,
    },
  };
}
