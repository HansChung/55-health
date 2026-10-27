// 說話變文字（伺服器聽寫）：一句 mp3 → lk888 的 Gemini 逐字聽寫成繁體中文
import { getGeminiModel, type GeminiProvider } from "./gemini";
import { cleanTranscript } from "@/lib/dictation";

export const TRANSCRIBE_PROMPT = [
  "把這段錄音逐字聽寫成繁體中文（台灣用語）。說話的人是台灣的長輩，可能有口音或夾雜台語。",
  "只輸出他說的話，加上適當的逗號、句號，不要加任何說明、引號或「聽寫：」。",
  "量測的數字寫成阿拉伯數字（例如「一百三十八」寫成 138）；時間、日期照他說的寫（例如「兩點」「下禮拜三」）。",
  "真的聽不到人聲就只輸出空白。",
].join("\n");

export async function transcribeSpeech(
  mp3: Buffer
): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number; model: string; provider: GeminiProvider } }> {
  const { model, config } = getGeminiModel({ temperature: 0, maxOutputTokens: 400 }, { task: "text", googleModel: "gemini-2.5-flash-lite" });
  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: TRANSCRIBE_PROMPT }, { inlineData: { mimeType: "audio/mp3", data: mp3.toString("base64") } }] }],
  });
  const meta = res.response.usageMetadata;
  return {
    text: cleanTranscript(res.response.text()),
    usage: { inputTokens: meta?.promptTokenCount ?? 0, outputTokens: meta?.candidatesTokenCount ?? 0, model: config.model, provider: config.provider },
  };
}
