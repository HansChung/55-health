// ────────────────────────────────────────────────
// 我的故事集：把和暖暖的問答整理成一篇文章（不存，長輩看過、改好再存）
// POST { messages } → { draft: { title, era, body }, quota }
// 和打字問暖暖共用每天的題數（整理一次算一題）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getGeminiModel, isGeminiConfigured, parseModelJson } from "@/lib/ai/gemini";
import { ASK_ENDPOINT, loadAsker } from "@/lib/ai/ask-quota-server";
import { finishReservedUsage, releaseReservedUsage, reserveDailySlot, trackAiUsage } from "@/lib/ai/usage-tracker";
import { askDailyLimit, taipeiDayStartIso, trimAskHistory } from "@/lib/ask";
import { STORY_MIN_ANSWERS, buildStoryWritePrompt, normalizeStoryDraft, storyAnswerCount } from "@/lib/life-stories";

export const maxDuration = 60;

const Schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(3000) })).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const messages = trimAskHistory(parsed.data.messages);
  if (storyAnswerCount(messages) < STORY_MIN_ANSWERS) {
    return NextResponse.json({ error: `再多回答暖暖幾題（至少 ${STORY_MIN_ANSWERS} 題），故事才寫得完整` }, { status: 400 });
  }
  if (!isGeminiConfigured()) return NextResponse.json({ error: "暖暖暫時休息中，請稍後再試" }, { status: 503 });

  const { profile, tier } = await loadAsker(user.id, user.email);
  const limit = askDailyLimit(tier);
  let slot: { id: string | null; used: number } = { id: null, used: 0 };
  if (tier !== "admin") {
    try {
      slot = await reserveDailySlot({ userId: user.id, service: "gemini_text", endpoint: ASK_ENDPOINT, sinceIso: taipeiDayStartIso(), limit });
    } catch (e) {
      console.error("[api] story write quota:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!slot.id) {
      return NextResponse.json(
        { error: `今天的 ${limit} 題問完了，明天再來整理吧（對話會留著）`, quota: { used: limit, limit } },
        { status: 429 }
      );
    }
  }

  try {
    const { model, config } = getGeminiModel(
      { responseMimeType: "application/json", temperature: 0.5, maxOutputTokens: 2048 },
      { task: "text", googleModel: "gemini-2.5-flash-lite" }
    );
    const result = await model.generateContent(buildStoryWritePrompt(messages, { displayName: profile?.display_name }));
    const draft = normalizeStoryDraft(parseModelJson<unknown>(result.response.text()));
    const meta = result.response.usageMetadata;
    const usage = {
      model: config.model,
      inputTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      metadata: { provider: config.provider, mode: "story_write", turns: messages.length },
    };
    if (slot.id) await finishReservedUsage(slot.id, usage);
    else await trackAiUsage({ userId: user.id, service: "gemini_text", endpoint: ASK_ENDPOINT, success: true, ...usage });
    return NextResponse.json({ draft, quota: { used: slot.id ? slot.used : 0, limit } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] 故事整理失敗:", msg);
    if (slot.id) await releaseReservedUsage(slot.id);
    await trackAiUsage({
      userId: user.id,
      service: "gemini_text",
      model: "unknown",
      endpoint: ASK_ENDPOINT,
      success: false,
      errorMessage: msg.slice(0, 500),
      metadata: { mode: "story_write" },
    }).catch(() => undefined);
    return NextResponse.json({ error: "暖暖這次沒整理好，請再按一次" }, { status: 502 });
  }
}
