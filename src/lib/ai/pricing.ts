/**
 * AI 服務計費表（USD per million tokens / per minute）
 * 來源：各家官方定價，請定期更新
 */
export const PRICING = {
  // Google Gemini
  "gemini-2.5-pro": {
    input: 1.25 / 1_000_000,   // $1.25 / 1M input tokens
    output: 10.0 / 1_000_000,  // $10 / 1M output tokens
  },
  "gemini-3.1-pro": {
    input: 1.25 / 1_000_000,
    output: 10.0 / 1_000_000,
  },
  "gemini-1.5-flash": {
    input: 0.075 / 1_000_000,
    output: 0.30 / 1_000_000,
  },

  // OpenAI Realtime
  "gpt-realtime": {
    input: 5.0 / 1_000_000,
    output: 20.0 / 1_000_000,
    audio_input: 0.06 / 60,  // $0.06 per minute → per second
    audio_output: 0.24 / 60,
  },
  "gpt-realtime-2": {
    input: 5.0 / 1_000_000,
    output: 20.0 / 1_000_000,
    audio_input: 0.06 / 60,
    audio_output: 0.24 / 60,
  },
  "gpt-4o-mini": {
    input: 0.15 / 1_000_000,
    output: 0.60 / 1_000_000,
  },
} as const;

export type PricedModel = keyof typeof PRICING;

export function calculateCost(opts: {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  audioInputSeconds?: number;
  audioOutputSeconds?: number;
}): number {
  const p = (PRICING as Record<string, Record<string, number>>)[opts.model];
  if (!p) return 0;
  let cost = 0;
  if (opts.inputTokens) cost += opts.inputTokens * (p.input ?? 0);
  if (opts.outputTokens) cost += opts.outputTokens * (p.output ?? 0);
  if (opts.audioInputSeconds) cost += opts.audioInputSeconds * (p.audio_input ?? 0);
  if (opts.audioOutputSeconds) cost += opts.audioOutputSeconds * (p.audio_output ?? 0);
  return cost;
}
