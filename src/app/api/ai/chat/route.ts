// ────────────────────────────────────────────────
// 打字問暖暖（文字對話）：所有人都能用，每天限題數（ASK_DAILY_LIMITS）
// GET  → { quota }
// POST { messages, mode?, chapterId?, chapterTitle?, guide? } → { reply, quota }
// 對話不存伺服器：前端每次把這段對話帶過來（最多 ASK_HISTORY_MAX 則）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { askNuannuan } from "@/lib/ai/ask-chat";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import {
  countEndpointSuccessSince,
  finishReservedUsage,
  releaseReservedUsage,
  reserveDailySlot,
  trackAiUsage,
} from "@/lib/ai/usage-tracker";
import {
  ASK_CHAPTER_TITLE_MAX,
  ASK_GUIDE_MAX,
  ASK_HISTORY_MAX,
  ASK_MESSAGE_MAX,
  askDailyLimit,
  taipeiDayStartIso,
  trimAskHistory,
} from "@/lib/ask";

export const maxDuration = 60;

const ENDPOINT = "/api/ai/chat";

const Schema = z.object({
  // 前端只帶最近 ASK_HISTORY_MAX 則；舊版前端可能帶整段，放寬一點再由 trimAskHistory 截
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(ASK_MESSAGE_MAX * 2) }))
    .min(1)
    .max(ASK_HISTORY_MAX * 5),
  mode: z.enum(["chat", "guided", "summary", "story"]).default("chat"),
  chapterId: z.string().regex(/^\d{4}$/).nullish(),
  chapterTitle: z.string().max(ASK_CHAPTER_TITLE_MAX * 2).nullish(),
  guide: z.object({ label: z.string().max(40), text: z.string().max(ASK_GUIDE_MAX * 2) }).nullish(),
});

async function quotaFor(userId: string, tier: string) {
  const used = await countEndpointSuccessSince(userId, ENDPOINT, taipeiDayStartIso());
  return { used, limit: askDailyLimit(tier) };
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { tier } = await loadAsker(user.id, user.email);
  try {
    return NextResponse.json({ quota: await quotaFor(user.id, tier) });
  } catch (e) {
    console.error("[api] ask quota:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const body = parsed.data;
  const messages = trimAskHistory(body.messages);
  if (messages.length === 0) return NextResponse.json({ error: "請先寫下想問的話" }, { status: 400 });
  if (body.mode !== "summary" && messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "請先寫下想問的話" }, { status: 400 });
  }
  if (!isGeminiConfigured()) {
    console.error("[api] 問暖暖：LK888_API_KEY / GEMINI_API_KEY 未設定");
    return NextResponse.json({ error: "暖暖暫時休息中，請稍後再試" }, { status: 503 });
  }

  const { profile, tier } = await loadAsker(user.id, user.email);
  const limit = askDailyLimit(tier);
  // 先佔一格（同時送出好幾則也不會超過每天的題數）；管理員不限，不用佔
  let slot: { id: string | null; used: number } = { id: null, used: 0 };
  if (tier !== "admin") {
    try {
      slot = await reserveDailySlot({ userId: user.id, service: "gemini_text", endpoint: ENDPOINT, sinceIso: taipeiDayStartIso(), limit });
    } catch (e) {
      console.error("[api] ask quota:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!slot.id) {
      return NextResponse.json(
        {
          error: `今天的 ${limit} 題問完了，明天再來問暖暖吧`,
          quota: { used: limit, limit },
          ...(tier === "free" || tier === "basic" ? { upgradeUrl: "/pricing" } : {}),
        },
        { status: 429 }
      );
    }
  }

  const chapterTitle = body.chapterTitle ? [...body.chapterTitle.trim()].slice(0, ASK_CHAPTER_TITLE_MAX).join("") : null;
  const guide = body.guide?.text.trim()
    ? { label: body.guide.label.trim().slice(0, 40), text: [...body.guide.text.trim()].slice(0, ASK_GUIDE_MAX).join("") }
    : null;
  try {
    const { reply, usage } = await askNuannuan(messages, {
      displayName: profile?.display_name,
      age: profile?.age,
      conditions: profile?.chronic_conditions,
      tone: profile?.voice_tone,
      mode: body.mode,
      chapterTitle,
      guide,
    });
    const metadata = { provider: usage.provider, mode: body.mode, chapter: body.chapterId ?? null, turns: messages.length };
    if (slot.id) {
      await finishReservedUsage(slot.id, { model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, metadata });
    } else {
      await trackAiUsage({
        userId: user.id,
        service: "gemini_text",
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        endpoint: ENDPOINT,
        success: true,
        metadata,
      });
    }
    return NextResponse.json({ reply, quota: { used: slot.id ? slot.used : 0, limit } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] 問暖暖失敗:", msg);
    if (slot.id) await releaseReservedUsage(slot.id); // 沒問成功不算題數
    await trackAiUsage({
      userId: user.id,
      service: "gemini_text",
      model: "unknown",
      endpoint: ENDPOINT,
      success: false,
      errorMessage: msg.slice(0, 500),
      metadata: { mode: body.mode, chapter: body.chapterId ?? null },
    }).catch(() => undefined);
    return NextResponse.json({ error: "暖暖這次沒想好，請再問一次" }, { status: 502 });
  }
}
