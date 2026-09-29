/**
 * AI 服務計費表（USD per million tokens / per minute）
 * 來源：各家官方定價，請定期更新
 */
export const PRICING = {
  // Google Gemini（免費額度耗盡後的計費）
  "gemini-2.5-pro": {
    input: 1.25 / 1_000_000,
    output: 10.0 / 1_000_000,
  },
  "gemini-2.5-flash": {
    input: 0.30 / 1_000_000,    // 比 pro 便宜很多
    output: 2.50 / 1_000_000,
  },
  "gemini-2.5-flash-lite": {
    input: 0.10 / 1_000_000,
    output: 0.40 / 1_000_000,
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

  // MiniMax 海螺 H3 影片（經 lk888 平台；依輸出秒數計費，固定 768P）
  // 以 MiniMax 官方單價估算；實際扣費見 ai_usage.metadata.platform_cost
  "minimax-h3": {
    video_output: 0.08,   // $0.08 per second @768P
  },
  "minimax-h3-max": {
    video_output: 0.08,   // $0.08 per second @768P
  },
} as const;

export type PricedModel = keyof typeof PRICING;

export function calculateCost(opts: {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  audioInputSeconds?: number;
  audioOutputSeconds?: number;
  videoOutputSeconds?: number;
}): number {
  const p = (PRICING as Record<string, Record<string, number>>)[opts.model];
  if (!p) return 0;
  let cost = 0;
  if (opts.inputTokens) cost += opts.inputTokens * (p.input ?? 0);
  if (opts.outputTokens) cost += opts.outputTokens * (p.output ?? 0);
  if (opts.audioInputSeconds) cost += opts.audioInputSeconds * (p.audio_input ?? 0);
  if (opts.audioOutputSeconds) cost += opts.audioOutputSeconds * (p.audio_output ?? 0);
  if (opts.videoOutputSeconds) cost += opts.videoOutputSeconds * (p.video_output ?? 0);
  return cost;
}
