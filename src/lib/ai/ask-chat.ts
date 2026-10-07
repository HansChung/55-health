// ────────────────────────────────────────────────
// 打字問暖暖：把對話送給文字模型（有 LK888_API_KEY 走邁笙 gem-3.5-flash-lite，否則 Google 直連）
// ────────────────────────────────────────────────
import type { Content } from "@google/generative-ai";
import { getGeminiModel, type GeminiProvider } from "./gemini";
import { buildAskSystemPrompt, cleanAskReply, type AskMessage, type AskPromptContext } from "../ask";

/** 摘要模式：在對話最後補一句「請整理」，讓模型照 system 的摘要規則回覆 */
const SUMMARY_REQUEST = "請把我們剛剛的對話整理成摘要，讓我存回書本這一章。";

export function toGeminiContents(messages: AskMessage[], mode: AskPromptContext["mode"]): Content[] {
  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));
  if (mode === "summary") contents.push({ role: "user", parts: [{ text: SUMMARY_REQUEST }] });
  return contents;
}

export async function askNuannuan(
  messages: AskMessage[],
  ctx: AskPromptContext
): Promise<{
  reply: string;
  usage: { inputTokens: number; outputTokens: number; model: string; provider: GeminiProvider };
}> {
  const { model, config } = getGeminiModel(
    { temperature: ctx.mode === "summary" ? 0.3 : 0.6, maxOutputTokens: 1024 },
    { task: "text", googleModel: "gemini-2.5-flash-lite" }
  );
  const response = await model.generateContent({
    systemInstruction: { role: "system", parts: [{ text: buildAskSystemPrompt(ctx) }] },
    contents: toGeminiContents(messages, ctx.mode),
  });
  const reply = cleanAskReply(response.response.text() ?? "");
  if (!reply) throw new Error("ask: empty reply");
  const meta = response.response.usageMetadata;
  return {
    reply,
    usage: {
      inputTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      model: config.model,
      provider: config.provider,
    },
  };
}
