import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { campaignPatchSchema, buildCampaignPatch, type CampaignPatch } from "@/lib/partner-campaigns";



export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body: CampaignPatch;
  try {
    body = campaignPatchSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e); return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const { id } = await params;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("partner_campaigns")
    .update(buildCampaignPatch(body))
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
