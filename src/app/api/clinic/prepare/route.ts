// ────────────────────────────────────────────────
// 看診小幫手：回診前整理看診小卡
// POST { department?, symptoms, since?, questions? } → { visit, quota }
// 暖暖整理說的話（和問暖暖共用每天的題數）；目前吃的藥、最近 30 天量的血壓血糖由伺服器直接帶，不靠模型
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { ASK_ENDPOINT, loadAsker } from "@/lib/ai/ask-quota-server";
import { finishReservedUsage, releaseReservedUsage, reserveDailySlot, trackAiUsage } from "@/lib/ai/usage-tracker";
import { askDailyLimit, conditionLabels, taipeiDayStartIso } from "@/lib/ask";
import { writeClinicCard } from "@/lib/ai/clinic";
import {
  CLINIC_DEPARTMENT_MAX,
  CLINIC_TEXT_MAX,
  sanitizeClinicText,
  summarizeMetrics,
  type ClinicMed,
  type ClinicPrepInput,
} from "@/lib/clinic";
import { taipeiToday, toClientVisit, type ClinicVisitRow } from "@/lib/clinic-server";

export const maxDuration = 60;

const Schema = z.object({
  department: z.string().max(CLINIC_DEPARTMENT_MAX * 2).optional(),
  symptoms: z.string().max(CLINIC_TEXT_MAX * 2),
  since: z.string().max(40).optional(),
  questions: z.string().max(CLINIC_TEXT_MAX * 2).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "送出的內容格式有誤" }, { status: 400 });
  const input: ClinicPrepInput = {
    department: sanitizeClinicText(parsed.data.department, CLINIC_DEPARTMENT_MAX).replace(/\n/g, " "),
    symptoms: sanitizeClinicText(parsed.data.symptoms),
    since: sanitizeClinicText(parsed.data.since, 40).replace(/\n/g, " "),
    questions: sanitizeClinicText(parsed.data.questions),
  };
  if (!input.symptoms && !input.questions) {
    return NextResponse.json({ error: "寫一下哪裡不舒服，或想問醫生什麼" }, { status: 400 });
  }
  if (!isGeminiConfigured()) return NextResponse.json({ error: "暖暖暫時休息中，請稍後再試" }, { status: 503 });

  const admin = createSupabaseAdmin();
  const { profile, tier } = await loadAsker(user.id, user.email);
  const limit = askDailyLimit(tier);
  let slot: { id: string | null; used: number } = { id: null, used: 0 };
  if (tier !== "admin") {
    try {
      slot = await reserveDailySlot({ userId: user.id, service: "gemini_text", endpoint: ASK_ENDPOINT, sinceIso: taipeiDayStartIso(), limit });
    } catch (e) {
      console.error("[api] clinic prepare quota:", e);
      return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
    }
    if (!slot.id) {
      return NextResponse.json({ error: `今天的 ${limit} 題用完了，明天再整理吧`, quota: { used: limit, limit } }, { status: 429 });
    }
  }

  // 目前吃的藥（個人資料）、最近 30 天量的數值
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [{ data: prof }, { data: metricRows }] = await Promise.all([
    admin.from("profiles").select("medications").eq("id", user.id).maybeSingle(),
    admin
      .from("health_metrics")
      .select("metric_type, measured_at, systolic, diastolic, glucose_mg_dl, glucose_context, weight_kg")
      .eq("user_id", user.id)
      .gte("measured_at", since30)
      .limit(500),
  ]);
  const meds: ClinicMed[] = ((prof as { medications?: unknown } | null)?.medications as { name?: string; dose?: string; time?: string }[] | undefined ?? [])
    .filter((m) => m && typeof m.name === "string" && m.name.trim())
    .slice(0, 20)
    .map((m) => ({ name: m.name!.trim().slice(0, 40), dose: m.dose?.trim().slice(0, 30) || null, time: m.time?.trim().slice(0, 30) || null }));
  const metrics = summarizeMetrics((metricRows ?? []) as Parameters<typeof summarizeMetrics>[0]);

  try {
    const { card, usage } = await writeClinicCard(input, { age: profile?.age, conditions: conditionLabels(profile?.chronic_conditions) });
    const meta = { provider: usage.provider, feature: "clinic_card" };
    if (slot.id) await finishReservedUsage(slot.id, { model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, metadata: meta });
    else await trackAiUsage({ userId: user.id, service: "gemini_text", model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, endpoint: ASK_ENDPOINT, success: true, metadata: meta });

    const { data, error } = await admin
      .from("clinic_visits")
      .insert({
        user_id: user.id,
        visit_date: taipeiToday(),
        department: input.department || null,
        prep: { input, card, meds, metrics },
      })
      .select("*")
      .single();
    if (error || !data) {
      console.error("[api] clinic prepare save:", error);
      return NextResponse.json({ error: "存不進去，請再試一次" }, { status: 500 });
    }
    return NextResponse.json({ visit: toClientVisit(data as ClinicVisitRow), quota: { used: slot.used, limit } });
  } catch (e) {
    if (slot.id) await releaseReservedUsage(slot.id);
    console.error("[api] clinic prepare:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "暖暖這次沒整理好，請再按一次" }, { status: 500 });
  }
}
