// ────────────────────────────────────────────────
// 遊記 MV：AI 依遊記的地點和每張照片那句話寫歌詞（長輩可以再改）
// POST { language, style } → { title, lyrics }
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { checkUserQuota, countMonthlyEndpointUsage, trackAiUsage } from "@/lib/ai/usage-tracker";
import { getGeminiModel, isGeminiConfigured, parseModelJson, resolveGeminiConfig } from "@/lib/ai/gemini";
import { loadMvSource } from "@/lib/ai/travel-mv-source";
import {
  MV_LANGUAGE_IDS,
  MV_STYLE_IDS,
  buildMvLyricsPrompt,
  sanitizeMvLyrics,
  sanitizeMvTitle,
} from "@/lib/travel-video";

const ENDPOINT = "/api/ai/travel-video/mv/lyrics";

export const maxDuration = 60;

const PostSchema = z.object({ language: z.enum(MV_LANGUAGE_IDS), style: z.enum(MV_STYLE_IDS) });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  if (!isGeminiConfigured()) return NextResponse.json({ error: "AI 暫時忙線，請自己寫寫看" }, { status: 503 });

  const quota = await checkUserQuota(user.id, "mv");
  if (quota.limit === 0) {
    return NextResponse.json({ error: "遊記 MV 是專業版功能，升級後就可以使用", upgradeUrl: "/pricing" }, { status: 403 });
  }
  // 寫歌詞不扣 MV 次數，但每月有上限（避免一直按）
  const cap = quota.limit >= 9999 ? Number.POSITIVE_INFINITY : Math.max(10, quota.limit * 5);
  if ((await countMonthlyEndpointUsage(user.id, ENDPOINT)) >= cap) {
    return NextResponse.json({ error: "本月 AI 寫歌詞的次數用完了，請自己寫寫看" }, { status: 429 });
  }

  const { id } = await ctx.params;
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!z.string().uuid().safeParse(id).success || !parsed.success) {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }
  const source = await loadMvSource(createSupabaseAdmin(), user.id, id);
  if (!source) return NextResponse.json({ error: "找不到這支遊記" }, { status: 404 });

  const config = resolveGeminiConfig();
  let tracked = false;
  try {
    const { model } = getGeminiModel({ responseMimeType: "application/json", temperature: 0.9 });
    const result = await model.generateContent(
      buildMvLyricsPrompt({
        language: parsed.data.language,
        style: parsed.data.style,
        place: source.place,
        lines: source.montage!.photos.map((p) => p.line),
      })
    );
    const raw = parseModelJson<{ title?: unknown; lyrics?: unknown }>(result.response.text());
    const title = sanitizeMvTitle(typeof raw.title === "string" ? raw.title : "");
    const lyrics = sanitizeMvLyrics(typeof raw.lyrics === "string" ? raw.lyrics.replace(/\\n/g, "\n") : "");
    const usage = result.response.usageMetadata;
    const ok = Boolean(title) && [...lyrics].length >= 20;
    await trackAiUsage({
      userId: user.id,
      service: "gemini_text",
      model: config.model,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      endpoint: ENDPOINT,
      success: ok,
      metadata: { provider: config.provider, language: parsed.data.language, style: parsed.data.style },
    });
    tracked = true;
    if (!ok) throw new Error("lyrics too short or missing title");
    return NextResponse.json({ title, lyrics });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] MV 歌詞生成失敗:", msg);
    if (!tracked) {
      await trackAiUsage({
        userId: user.id,
        service: "gemini_text",
        model: config.model,
        endpoint: ENDPOINT,
        success: false,
        errorMessage: msg,
        metadata: { provider: config.provider },
      });
    }
    return NextResponse.json({ error: "AI 這次沒寫出來，請再按一次" }, { status: 502 });
  }
}
