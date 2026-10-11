// ────────────────────────────────────────────────
// 家人看長輩請你看的可疑訊息（長輩按了「通知家人」的，最近 30 天）
// GET → { elders: [{ elder_id, name, checks }] }
// ────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { toClientScamCheck, type ScamCheckRow } from "@/lib/scam-check-server";
import type { ScamCheck } from "@/lib/scam-check";

const SHOW_DAYS = 30;

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const admin = createSupabaseAdmin();
  const { data: links } = await admin
    .from("family_links")
    .select("owner_id")
    .eq("family_user_id", user.id)
    .eq("status", "accepted");
  const owners = [...new Set(((links ?? []) as { owner_id: string }[]).map((l) => l.owner_id))];
  if (owners.length === 0) return NextResponse.json({ elders: [] });

  const since = new Date(Date.now() - SHOW_DAYS * 24 * 3600 * 1000).toISOString();
  const [{ data: profiles }, { data: rows, error }] = await Promise.all([
    admin.from("profiles").select("id, display_name").in("id", owners),
    admin
      .from("scam_checks")
      .select("*")
      .in("user_id", owners)
      .not("shared_at", "is", null)
      .gte("shared_at", since)
      .order("shared_at", { ascending: false })
      .limit(50),
  ]);
  if (error) {
    console.warn("[api] family scam-checks:", error.message);
    return NextResponse.json({ elders: [] });
  }
  const names = new Map(((profiles ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name?.trim() || "長輩"]));
  const all = (rows ?? []) as ScamCheckRow[];
  const elders = owners
    .map((id) => ({
      elder_id: id,
      name: names.get(id) ?? "長輩",
      checks: all.filter((r) => r.user_id === id).map(toClientScamCheck).filter((c): c is ScamCheck => c !== null),
    }))
    .filter((e) => e.checks.length > 0);
  return NextResponse.json({ elders });
}
