// 語音對話：一段 mp3 ＋ 前文 → lk888 的 Gemini 聽懂並回答（一次呼叫）
import type { Content } from "@google/generative-ai";
import { getGeminiModel, type GeminiProvider, modelText } from "./gemini";
import { buildAskSystemPrompt, type AskMessage, type AskPromptContext } from "@/lib/ask";
import { VOICE_RULES, parseVoiceReply } from "@/lib/voice-chat";

export function buildVoiceSystemPrompt(ctx: AskPromptContext): string {
  return `${buildAskSystemPrompt(ctx)}\n\n${VOICE_RULES}`;
}

export async function answerVoiceTurn(
  mp3: Buffer,
  history: AskMessage[],
  ctx: AskPromptContext
): Promise<{ heard: string; reply: string; usage: { inputTokens: number; outputTokens: number; model: string; provider: GeminiProvider } }> {
  const { model, config } = getGeminiModel({ temperature: 0.5, maxOutputTokens: 400 }, { task: "text", googleModel: "gemini-2.5-flash-lite" });
  const contents: Content[] = [
    ...history.map((m): Content => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
    { role: "user", parts: [{ inlineData: { mimeType: "audio/mp3", data: mp3.toString("base64") } }] },
  ];
  const res = await model.generateContent({
    systemInstruction: { role: "system", parts: [{ text: buildVoiceSystemPrompt(ctx) }] },
    contents,
  });
  const { heard, reply } = parseVoiceReply(modelText(res.response) ?? "");
  if (!reply) throw new Error("voice: empty reply");
  const meta = res.response.usageMetadata;
  return {
    heard,
    reply,
    usage: { inputTokens: meta?.promptTokenCount ?? 0, outputTokens: meta?.candidatesTokenCount ?? 0, model: config.model, provider: config.provider },
  };
}
