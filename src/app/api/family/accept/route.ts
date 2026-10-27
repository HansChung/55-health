// ────────────────────────────────────────────────
// 家人輸入邀請碼，連上長輩
// POST { code } → { elderName }
// family_links 沒有讓使用者改的 RLS → 用 service role，條件更新（還是 pending、還沒有家人）才算數，同時按也只有一個人連得上
// ────────────────────────────────────────────────
import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { checkInvite, normalizeInviteCode } from "@/lib/family-invite";
import { sendPushToUser } from "@/lib/push/send";

const Body = z.object({ code: z.string().min(1).max(40) });

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  const code = parsed.success ? normalizeInviteCode(parsed.data.code) : null;
  if (!code) return NextResponse.json({ error: "邀請碼是 8 個數字，請再看一次" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: link, error } = await admin
    .from("family_links")
    .select("id, owner_id, status, family_user_id, invite_expires_at, relationship")
    .eq("invite_code", code)
    .maybeSingle();
  if (error) {
    console.error("[family/accept] read:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  if (!link) return NextResponse.json({ error: "找不到這個邀請碼，請再看一次數字" }, { status: 404 });

  const check = checkInvite(link, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  // 已經是這位長輩的家人 → 不再多一筆（舊的那筆會照常顯示）
  const { data: existing } = await admin
    .from("family_links")
    .select("id")
    .eq("owner_id", link.owner_id)
    .eq("family_user_id", user.id)
    .eq("status", "accepted")
    .limit(1);
  if (existing?.length) return NextResponse.json({ error: "你已經是這位長輩的家人了" }, { status: 409 });

  const { data: claimed, error: updErr } = await admin
    .from("family_links")
    .update({ family_user_id: user.id, status: "accepted", invite_code: null })
    .eq("id", link.id)
    .eq("status", "pending")
    .is("family_user_id", null)
    .select("id")
    .maybeSingle();
  if (updErr) {
    console.error("[family/accept] update:", updErr);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  if (!claimed) return NextResponse.json({ error: "這個邀請碼已經用過了，請長輩重新產生一個" }, { status: 409 });

  const { data: names } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", [link.owner_id, user.id]);
  const nameOf = (id: string) =>
    ((names ?? []) as { id: string; display_name: string | null }[]).find((p) => p.id === id)?.display_name;
  const elderName = nameOf(link.owner_id) || "長輩";
  const familyName = nameOf(user.id) || link.relationship || "家人";

  // 告訴長輩：家人連上了（推不到也沒關係，「家人共享」頁會顯示已加入）
  after(() =>
    sendPushToUser(link.owner_id, {
      title: "家人加入了 🤝",
      body: `${familyName} 已經用邀請碼連上你的暖暖，可以在「家人共享」調整要分享什麼`,
      url: "/",
      tag: `family-accepted-${link.id}`,
    }).then(() => undefined).catch((e) => console.warn("[family/accept] push:", e))
  );

  return NextResponse.json({ elderName });
}
