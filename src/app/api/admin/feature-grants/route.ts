// ────────────────────────────────────────────────
// 後台：個別帳號開通功能（例如送某位長輩專業版功能試用）
// GET → { grants }；POST { email, feature, tier, expiresAt?, note? } → { grant }；DELETE ?id= → { ok }
// 同一個人同一個功能只有一筆（再開通一次＝更新方案與到期日）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { FEATURE_KEYS, TIERS } from "@/lib/plan-settings";

const PostSchema = z.object({
  email: z.string().email().max(200),
  feature: z.enum(FEATURE_KEYS as [string, ...string[]]),
  tier: z.enum(TIERS as [string, ...string[]]).default("pro"),
  expiresAt: z.string().datetime({ offset: true }).nullish(),
  note: z.string().max(200).optional(),
});

interface GrantRow {
  id: string;
  user_id: string;
  feature: string;
  tier: string;
  expires_at: string | null;
  note: string | null;
  created_at: string;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_feature_grants")
    .select("id, user_id, feature, tier, expires_at, note, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ grants: [], ready: false });
  const rows = (data ?? []) as GrantRow[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const [{ data: profiles }, users] = await Promise.all([
    ids.length ? supabase.from("profiles").select("id, display_name, subscription_tier").in("id", ids) : Promise.resolve({ data: [] }),
    Promise.all(ids.map((id) => supabase.auth.admin.getUserById(id).then((r: { data: { user: { email?: string } | null } }) => [id, r.data.user?.email ?? null] as const))),
  ]);
  const emails = new Map(users);
  const prof = new Map(((profiles ?? []) as { id: string; display_name: string | null; subscription_tier: string | null }[]).map((p) => [p.id, p]));
  return NextResponse.json({
    ready: true,
    grants: rows.map((r) => ({
      ...r,
      email: emails.get(r.user_id) ?? null,
      display_name: prof.get(r.user_id)?.display_name ?? null,
      user_tier: prof.get(r.user_id)?.subscription_tier ?? "free",
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "格式錯誤（email、功能、到期日）" }, { status: 400 });
  const b = parsed.data;
  const supabase = createSupabaseAdmin();
  const email = b.email.trim().toLowerCase();
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  const target = (list.users as { id: string; email?: string }[]).find((u) => u.email?.toLowerCase() === email);
  if (!target) return NextResponse.json({ error: "找不到這個 email 的會員" }, { status: 404 });
  const { data, error } = await supabase
    .from("user_feature_grants")
    .upsert(
      {
        user_id: target.id,
        feature: b.feature,
        tier: b.tier,
        expires_at: b.expiresAt ?? null,
        note: b.note?.trim() || null,
        granted_by: admin.id,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,feature" }
    )
    .select("id, user_id, feature, tier, expires_at, note, created_at")
    .single();
  if (error || !data) {
    console.error("[api] grant feature:", error?.message);
    return NextResponse.json(
      { error: error && /user_feature_grants/.test(error.message) ? "請先在 Supabase 跑 add-plan-settings.sql" : "伺服器忙線中，請稍後再試" },
      { status: 500 }
    );
  }
  return NextResponse.json({ grant: { ...(data as GrantRow), email: target.email ?? null } });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  const { error } = await createSupabaseAdmin().from("user_feature_grants").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
