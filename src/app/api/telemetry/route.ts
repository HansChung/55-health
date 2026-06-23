// ────────────────────────────────────────────────
// 遙測接收端：使用事件 + 前端錯誤
// 設計原則：永不對前端丟錯（遙測失敗不能影響使用者）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

interface IncomingEvent {
  kind?: "usage" | "error";
  name?: string;
  detail?: Record<string, unknown>;
  path?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: IncomingEvent[] = Array.isArray(body?.events) ? body.events : [];
    if (events.length === 0) return NextResponse.json({ ok: true });

    // 取得使用者（可選；未登入也接受）
    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch { /* ignore */ }

    const rows = events.slice(0, 50).map((e) => ({
      user_id: userId,
      kind: e.kind === "error" ? "error" : "usage",
      name: String(e.name ?? "unknown").slice(0, 80),
      detail: e.detail ?? {},
      path: e.path ? String(e.path).slice(0, 200) : null,
    }));

    const admin = createSupabaseAdmin();
    await admin.from("app_events").insert(rows);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[telemetry] 寫入失敗:", e);
    return NextResponse.json({ ok: false }); // 仍回 200-ish，不影響前端
  }
}
