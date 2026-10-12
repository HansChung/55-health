// ────────────────────────────────────────────────
// 看診小幫手：看懂檢驗報告
// POST /api/clinic/<id>/report { photoPath | imageBase64+mimeType } → { visit }（id 用 "new" 就新增一次看診）
// 照片直傳 Supabase 暫存區，看完不保存；只存暖暖抄下來的項目與白話說明
// 免費會員每天 CLINIC_REPORT_FREE_DAILY 張；標準版以上和拍照記餐共用每月拍照次數
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { imageFromRequest, UserUploadError } from "@/lib/ai/user-uploads-server";
import { resolveGeminiConfig } from "@/lib/ai/gemini";
import { readLabReport } from "@/lib/ai/clinic";
import { checkUserQuota, finishReservedUsage, releaseReservedUsage, reserveDailySlot, trackAiUsage } from "@/lib/ai/usage-tracker";
import { taipeiDayStartIso } from "@/lib/ask";
import { CLINIC_REPORT_FREE_DAILY } from "@/lib/clinic";
import { ownVisit, taipeiToday, toClientVisit, type ClinicVisitRow } from "@/lib/clinic-server";

export const maxDuration = 60;
const ENDPOINT = "/api/clinic/report";

const Schema = z.object({
  photoPath: z.string().max(200).optional(),
  imageBase64: z.string().min(100).max(8_000_000).optional(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { id } = await ctx.params;
  const existing = id === "new" ? null : await ownVisit(admin, user.id, id);
  if (id !== "new" && !existing) return NextResponse.json({ error: "找不到這次看診" }, { status: 404 });

  let image: { base64: string; mimeType: string };
  try {
    image = await imageFromRequest(admin, user.id, parsed.data);
  } catch (e) {
    if (e instanceof UserUploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  // 次數：和「拍照問暖暖」一樣——免費每天幾張；付費和拍照記餐共用每月拍照次數
  const quota = await checkUserQuota(user.id, "photo");
  let slot: { id: string | null; used: number } | null = null;
  if (quota.tier === "free") {
    try {
      slot = await reserveDailySlot({ userId: user.id, service: "gemini_vision", endpoint: ENDPOINT, sinceIso: taipeiDayStartIso(), limit: CLINIC_REPORT_FREE_DAILY });
    } catch (e) {
      console.error("[api] clinic report quota:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!slot.id) {
      return NextResponse.json(
        { error: `免費會員每天可以看 ${CLINIC_REPORT_FREE_DAILY} 張報告，明天再來`, upgradeUrl: "/pricing" },
        { status: 429 }
      );
    }
  } else if (!quota.allowed) {
    return NextResponse.json({ error: "本月拍照次數已用完", upgradeUrl: "/pricing" }, { status: 429 });
  }

  try {
    const { report, usage } = await readLabReport(image);
    const meta = { provider: usage.provider, items: report.items.length };
    if (slot?.id) await finishReservedUsage(slot.id, { model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, metadata: meta });
    else await trackAiUsage({ userId: user.id, service: "gemini_vision", model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, endpoint: ENDPOINT, success: true, metadata: meta });

    const now = new Date().toISOString();
    const write = existing
      ? admin.from("clinic_visits").update({ report, updated_at: now }).eq("id", existing.id).select("*").single()
      : admin.from("clinic_visits").insert({ user_id: user.id, visit_date: taipeiToday(), report }).select("*").single();
    const { data, error } = await write;
    if (error || !data) {
      console.error("[api] clinic report save:", error);
      return NextResponse.json({ error: "存不進去，請再試一次" }, { status: 500 });
    }
    return NextResponse.json({ visit: toClientVisit(data as ClinicVisitRow) });
  } catch (e) {
    if (slot?.id) await releaseReservedUsage(slot.id);
    const msg = e instanceof Error ? e.message : String(e);
    const cfg = resolveGeminiConfig();
    await trackAiUsage({ userId: user.id, service: "gemini_vision", model: cfg.model, endpoint: ENDPOINT, success: false, errorMessage: msg, metadata: { provider: cfg.provider } });
    console.error("[api] clinic report:", msg);
    return NextResponse.json({ error: "暖暖這次沒看清楚，請拍清楚一點（整張報告、光線充足）再試一次" }, { status: 500 });
  }
}
