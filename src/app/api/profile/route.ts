import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import { MedicationListSchema } from "@/lib/medication-schema";
import { mergeEmergencyPatch } from "@/lib/emergency-card";

const PatchSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  age: z.number().int().min(1).max(120).nullable().optional(),
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  height_cm: z.number().int().min(50).max(250).nullable().optional(),
  weight_kg: z.number().min(20).max(300).nullable().optional(),
  calorie_goal: z.number().int().min(800).max(5000).optional(),
  voice_tone: z.enum(["warm", "strict", "grandchild"]).optional(),
  font_scale: z.enum(["base", "lg"]).optional(),
  high_contrast: z.boolean().optional(),
  chronic_conditions: z.array(z.string()).optional(),
  medications: MedicationListSchema.optional(),
  notification_settings: z.record(z.string(), z.any()).optional(),
  alert_thresholds: z
    .object({
      inactivityDays: z.number().int().min(1).max(30).optional(),
      bpSystolicHigh: z.number().int().min(110).max(250).optional(),
      bpDiastolicHigh: z.number().int().min(70).max(150).optional(),
      bpSystolicLow: z.number().int().min(60).max(120).optional(),
      bpDiastolicLow: z.number().int().min(40).max(90).optional(),
      glucoseHigh: z.number().int().min(120).max(600).optional(),
      glucoseFastingHigh: z.number().int().min(100).max(400).optional(),
      glucoseLow: z.number().int().min(40).max(100).optional(),
      weightChangeKg: z.number().min(0.5).max(20).optional(),
      missedMedicationDays: z.number().int().min(1).max(14).optional(),
    })
    .partial()
    .optional(),
  // 緊急聯絡卡（聯絡人、血型、過敏、備註）：形狀和長度在 mergeEmergencyPatch 整理，這裡只擋太大的
  emergency_contact: z.record(z.string(), z.unknown()).nullable().optional()
    .refine((v) => v == null || JSON.stringify(v).length <= 2000, "太長了"),
});

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e); return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { ...body };
  if (body.emergency_contact !== undefined) {
    // 舊版程式只送 { name, phone }：只換第一位聯絡人，血型、過敏照舊（要先讀現在的）
    const { data: current } = await supabase.from("profiles").select("emergency_contact").eq("id", user.id).maybeSingle();
    patch.emergency_contact = mergeEmergencyPatch(current?.emergency_contact ?? null, body.emergency_contact);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ profile: data });
}
