import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/study-tours";
import { broadcastToTour } from "@/lib/study-tours-server";

/** 集合廣播：推播給這團正取的人，並存一筆紀錄（長輩的活動頁也看得到） */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "找不到這個研學團" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { message?: unknown } | null;

  try {
    const result = await broadcastToTour(createSupabaseAdmin(), id, String(body?.message ?? ""), admin.id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[study-tours] broadcast failed:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試（若是第一次使用，請先執行 supabase/add-study-tour-day-ops.sql）" }, { status: 500 });
  }
}
