import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { campaignCreateSchema, type CampaignPatch } from "@/lib/partner-campaigns";

interface PartnerCampaignRow {
  id: string;
  [key: string]: unknown;
}



export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const { data: campaigns, error } = await supabase
    .from("partner_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }

  const rows = (campaigns ?? []) as PartnerCampaignRow[];
  const ids = rows.map((campaign) => campaign.id);
  const metrics = new Map<string, { impressions: number; clicks: number }>();
  if (ids.length > 0) {
    const { data: events } = await supabase
      .from("partner_campaign_events")
      .select("campaign_id, event_type")
      .in("campaign_id", ids);
    for (const event of events ?? []) {
      const current = metrics.get(event.campaign_id) ?? { impressions: 0, clicks: 0 };
      if (event.event_type === "impression") current.impressions++;
      if (event.event_type === "click") current.clicks++;
      metrics.set(event.campaign_id, current);
    }
  }

  return NextResponse.json({
    campaigns: rows.map((campaign) => ({
      ...campaign,
      metrics: metrics.get(campaign.id) ?? { impressions: 0, clicks: 0 },
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body: CampaignPatch & { title: string; description: string; partner_name: string };
  try {
    body = campaignCreateSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e); return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("partner_campaigns")
    .insert({
      ...body,
      cta_url: body.cta_url || null,
      image_url: body.image_url || null,
      cta_label: body.cta_label || "了解更多",
      starts_at: body.starts_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ campaign: data });
}
