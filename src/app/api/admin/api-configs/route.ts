import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("api_configs")
    .select("id, provider, model_default, enabled, monthly_budget_usd, notes, updated_at")
    .order("provider");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configs: data });
}

const PostSchema = z.object({
  provider: z.enum(["gemini", "openai", "anthropic"]),
  api_key: z.string().min(10),
  model_default: z.string().optional(),
  monthly_budget_usd: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  // 簡易加密（生產環境建議用 Supabase Vault）
  const apiKeyEncrypted = Buffer.from(body.api_key).toString("base64");

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("api_configs")
    .insert({
      provider: body.provider,
      api_key_encrypted: apiKeyEncrypted,
      model_default: body.model_default,
      monthly_budget_usd: body.monthly_budget_usd,
      notes: body.notes,
    })
    .select("id, provider, model_default, enabled, monthly_budget_usd, notes, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}
