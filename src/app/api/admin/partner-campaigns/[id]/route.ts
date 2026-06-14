import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

const PatchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  partner_name: z.string().min(1).max(100).optional(),
  cta_label: z.string().max(40).optional(),
  cta_url: z.string().url().optional().nullable().or(z.literal("")),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  priority: z.number().int().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().nullable().optional(),
  active: z.boolean().optional(),
  disclaimer: z.string().max(200).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body: z.infer<typeof PatchSchema>;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e); return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const { id } = await params;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("partner_campaigns")
    .update({
      ...body,
      cta_url: body.cta_url || null,
      image_url: body.image_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ campaign: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await params;
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("partner_campaigns")
    .delete()
    .eq("id", id);

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
