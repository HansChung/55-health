// ────────────────────────────────────────────────
// 這則訊息可疑嗎？
// GET  → { checks, quota }（自己最近問過的，新的在前）
// POST { photoPath? | imageBase64?+mimeType?, text?, source? } → { check, quota }
//   截圖已直傳 Supabase 暫存區（看完不另外保存）；每天幾次照後台「方案與次數」，失敗不算
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { imageFromRequest, UserUploadError } from "@/lib/ai/user-uploads-server";
import { resolveGeminiConfig } from "@/lib/ai/gemini";
import { checkScamMessage } from "@/lib/ai/scam-check";
import { loadAsker } from "@/lib/ai/ask-quota-server";
import { finishReservedUsage, releaseReservedUsage, reserveDailySlot, trackAiUsage } from "@/lib/ai/usage-tracker";
import { taipeiDayStartIso } from "@/lib/ask";
import { SCAM_NOTE_MAX, SCAM_TEXT_MAX, sanitizeScamText } from "@/lib/scam-check";
import { toClientScamCheck, type ScamCheckRow } from "@/lib/scam-check-server";
import { blockedResponse } from "@/lib/plan-access-server";

// 看圖模型實測約 10～15 秒，預留空間
export const maxDuration = 60;

const ENDPOINT = "/api/scam-check";

const PostSchema = z.object({
  photoPath: z.string().max(200).optional(),
  imageBase64: z.string().min(100).max(8_000_000).optional(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  text: z.string().max(SCAM_TEXT_MAX * 2).optional(),
  source: z.string().max(SCAM_NOTE_MAX * 2).optional(),
});

async function usedToday(userId: string): Promise<number> {
  const { count } = await createSupabaseAdmin()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", ENDPOINT)
    .eq("success", true)
    .gte("created_at", taipeiDayStartIso());
  return count ?? 0;
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  const [{ data, error }, used, { access }] = await Promise.all([
    admin.from("scam_checks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    usedToday(user.id),
    loadAsker(user.id, user.email),
  ]);
  if (error) console.warn("[api] scam-check GET:", error.message); // 還沒跑 SQL：當作沒有紀錄
  const checks = ((data ?? []) as ScamCheckRow[]).map(toClientScamCheck).filter((c) => c !== null);
  return NextResponse.json({ checks, quota: { used, limit: access.limit("scam_check_daily") } });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const body = parsed.data;
  const text = sanitizeScamText(body.text, SCAM_TEXT_MAX);
  const source = sanitizeScamText(body.source, SCAM_NOTE_MAX).replace(/\n/g, " ");
  const hasImage = Boolean(body.photoPath || body.imageBase64);
  if (!hasImage && !text) return NextResponse.json({ error: "請先附上截圖，或把訊息貼上來" }, { status: 400 });

  const admin = createSupabaseAdmin();
  // 先拿到截圖（路徑不對、找不到就 400，不佔次數）
  let image: { base64: string; mimeType: string } | undefined;
  if (hasImage) {
    try {
      const img = await imageFromRequest(admin, user.id, body);
      image = { base64: img.base64, mimeType: img.mimeType };
    } catch (e) {
      if (e instanceof UserUploadError) return NextResponse.json({ error: e.message }, { status: 400 });
      throw e;
    }
  }

  const { tier, access } = await loadAsker(user.id, user.email);
  const blocked = blockedResponse(access, "scam_check");
  if (blocked) return blocked;
  const dailyLimit = access.limit("scam_check_daily");
  let slot: { id: string | null; used: number } = { id: null, used: 0 };
  if (tier !== "admin") {
    try {
      // 記成 gemini_text：看圖的用量會算進每月拍照次數，防詐不該吃掉拍照次數
      slot = await reserveDailySlot({ userId: user.id, service: "gemini_text", endpoint: ENDPOINT, sinceIso: taipeiDayStartIso(), limit: dailyLimit });
    } catch (e) {
      console.error("[api] scam-check daily slot:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!slot.id) {
      return NextResponse.json(
        {
          error: `今天的 ${dailyLimit} 次問完了。著急的話請直接打 165 反詐騙專線（免費）`,
          quota: { used: dailyLimit, limit: dailyLimit },
        },
        { status: 429 }
      );
    }
  }

  const inputKind = image && text ? "both" : image ? "image" : "text";
  try {
    const { result, usage } = await checkScamMessage({ image, text: text || undefined, source: source || undefined });
    const metadata = { provider: usage.provider, verdict: result.verdict, input: inputKind };
    if (slot.id) {
      await finishReservedUsage(slot.id, { model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, metadata });
    } else {
      await trackAiUsage({ userId: user.id, service: "gemini_text", model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, endpoint: ENDPOINT, success: true, metadata });
    }
    const { verdict, ...rest } = result;
    const { data: row, error } = await admin
      .from("scam_checks")
      .insert({ user_id: user.id, verdict, result: rest, input_kind: inputKind })
      .select("*")
      .single();
    if (error) console.warn("[api] scam-check save:", error.message); // 沒存到也照樣回答（只是不能通知家人）
    const check = row
      ? toClientScamCheck(row as ScamCheckRow)
      : { ...result, id: "", created_at: new Date().toISOString(), shared_at: null };
    return NextResponse.json({
      check,
      quota: { used: slot.id ? slot.used : 0, limit: dailyLimit },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (slot.id) await releaseReservedUsage(slot.id); // 沒看成功不算次數
    const vision = resolveGeminiConfig();
    await trackAiUsage({ userId: user.id, service: "gemini_text", model: vision.model, endpoint: ENDPOINT, success: false, errorMessage: msg, metadata: { provider: vision.provider, input: inputKind } });
    console.error("[api] scam-check failed:", msg);
    return NextResponse.json(
      { error: "暖暖這次沒看清楚，請再試一次。著急的話請直接打 165 反詐騙專線（免費）" },
      { status: msg.includes("429") ? 429 : 500 }
    );
  }
}
