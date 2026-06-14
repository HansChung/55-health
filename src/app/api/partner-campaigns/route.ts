import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ campaigns: [] });

  const { data: profile } = await supabase
    .from("profiles")
    .select("chronic_conditions")
    .eq("id", user.id)
    .single();

  const tags = profile?.chronic_conditions ?? [];
  const { data, error } = await supabase
    .from("partner_campaigns")
    .select("id, title, description, partner_name, cta_label, cta_url, image_url, tags, disclaimer")
    .eq("active", true)
    .lte("starts_at", new Date().toISOString())
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }

  const scored = (data ?? [])
    .map((campaign) => ({
      ...campaign,
      score: campaign.tags?.some((tag: string) => tags.includes(tag)) ? 2 : 1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return NextResponse.json({ campaigns: scored });
}
