import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";

/**
 * 管理員看所有用戶的對話
 *
 * GET ?days=7&limit=500   → 列 sessions（按 session_id 分組摘要）
 * GET ?session_id=xxx     → 看單一 session 全部訊息
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const sessionId = req.nextUrl.searchParams.get("session_id");

  // 模式 A：抓單一 session 全部訊息
  if (sessionId) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }

    // 帶上用戶 email
    const userId = data?.[0]?.user_id;
    let userEmail: string | null = null;
    let userName: string | null = null;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      userName = profile?.display_name ?? null;
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      userEmail = user?.email ?? null;
    }

    return NextResponse.json({ messages: data, user_email: userEmail, user_name: userName });
  }

  // 模式 B：列所有 sessions（最近 N 天）
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 1000), 5000);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: rows, error } = await supabase
    .from("conversations")
    .select("session_id, user_id, role, content, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }

  // 取所有出現過的 user_id 一次查回 email + display_name
  const userIds = Array.from(
    new Set((rows ?? []).map((r: { user_id: string }) => r.user_id).filter(Boolean))
  );
  const emailMap = new Map<string, string | null>();
  const nameMap = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      nameMap.set(p.id as string, (p.display_name as string) ?? null);
    }
    // 為了避免 N 次 API call，只取首 1000 個 user 查 email
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    for (const u of users) {
      if (userIds.includes(u.id)) emailMap.set(u.id, u.email ?? null);
    }
  }

  // 按 session_id 分組
  type Session = {
    session_id: string | null;
    user_id: string;
    user_email: string | null;
    user_name: string | null;
    started_at: string;
    latest_at: string;
    message_count: number;
    user_message_count: number;
    preview: string;
  };
  const sessionMap = new Map<string, Session>();
  // 從新到舊處理，但要記得 started_at = 最舊、latest_at = 最新
  // 用 ascending 順序處理比較好算 — 我們再 sort 一次
  const sortedAsc = [...(rows ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  for (const r of sortedAsc) {
    // null session_id 也歸成自己一組（用 record id 模擬，這裡只用 "null" 代表）
    const key = r.session_id ?? `lonely-${r.created_at}`;
    let s = sessionMap.get(key);
    if (!s) {
      s = {
        session_id: r.session_id,
        user_id: r.user_id,
        user_email: emailMap.get(r.user_id) ?? null,
        user_name: nameMap.get(r.user_id) ?? null,
        started_at: r.created_at,
        latest_at: r.created_at,
        message_count: 0,
        user_message_count: 0,
        preview: "",
      };
      sessionMap.set(key, s);
    }
    s.latest_at = r.created_at;
    s.message_count++;
    if (r.role === "user") {
      s.user_message_count++;
      if (!s.preview) s.preview = String(r.content).substring(0, 80);
    }
  }

  const sessions = Array.from(sessionMap.values())
    .sort((a, b) => b.latest_at.localeCompare(a.latest_at));

  return NextResponse.json({ sessions });
}
