// ────────────────────────────────────────────────
// 出遊影片口白：AI 看照片幫長輩寫一句遊記（長輩可以再改）
// POST { image, place?, style } → { text }
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkUserQuota, trackAiUsage } from "@/lib/ai/usage-tracker";
import { getGeminiModel, isGeminiConfigured, parseModelJson, resolveGeminiConfig } from "@/lib/ai/gemini";
import {
  NARRATION_MAX_CHARS,
  TRAVEL_VIDEO_STYLES,
  TRAVEL_VIDEO_STYLE_IDS,
  sanitizeNarration,
  sanitizePlace,
} from "@/lib/travel-video";

export const maxDuration = 60;

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

const PostSchema = z.object({
  image: z.string().max(4_000_000).regex(IMAGE_DATA_URL),
  place: z.string().max(100).optional(),
  style: z.enum(TRAVEL_VIDEO_STYLE_IDS),
});

function buildScriptPrompt(place: string, styleLabel: string) {
  return (
    "你是幫台灣長輩寫出遊日記的小幫手。請看這張出遊照片，" +
    "用長輩第一人稱、口語、溫暖的語氣，寫一句 15～26 個字的繁體中文口白（台灣用語），" +
    `這句話會被念出來，也會當成影片字幕。影片感覺：${styleLabel}。` +
    (place ? `拍攝地點：${place}。` : "") +
    `不要超過 ${NARRATION_MAX_CHARS} 個字，不要用引號、表情符號或英文，不要提到「照片」或「影片」。` +
    '只回 JSON：{"text": "口白"}'
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "AI 暫時忙線，請自己寫一句試試" }, { status: 503 });
  }
  const quota = await checkUserQuota(user.id, "video");
  if (!quota.allowed) {
    return NextResponse.json({ error: "本月的影片次數用完了，下個月再來做吧" }, { status: 429 });
  }

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "照片格式不對，請換一張再試" }, { status: 400 });
  }
  const [, mime, b64] = body.image.match(IMAGE_DATA_URL)!;
  const styleLabel = TRAVEL_VIDEO_STYLES.find((s) => s.id === body.style)?.label ?? "";

  const config = resolveGeminiConfig();
  try {
    const { model } = getGeminiModel({ responseMimeType: "application/json", temperature: 0.8 });
    const result = await model.generateContent([
      { text: buildScriptPrompt(sanitizePlace(body.place), styleLabel) },
      { inlineData: { data: b64, mimeType: `image/${mime}` } },
    ]);
    const text = sanitizeNarration(parseModelJson<{ text?: string }>(result.response.text()).text);
    const usage = result.response.usageMetadata;
    await trackAiUsage({
      userId: user.id,
      service: "gemini_text", // 不算進「拍照辨識」次數
      model: config.model,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      endpoint: "/api/ai/travel-video/script",
      success: Boolean(text),
      metadata: { provider: config.provider },
    });
    if (!text) throw new Error("empty script");
    return NextResponse.json({ text });
  } catch (e) {
    console.error("[api] 口白稿生成失敗:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "AI 這次沒寫出來，請自己寫一句或再按一次" }, { status: 502 });
  }
}
