import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE, stopPatchSchema } from "@/lib/study-tours";
import { generateStampToken } from "@/lib/study-tours-server";

type Ctx = { params: Promise<{ id: string; stopId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body;
  try {
    body = stopPatchSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const { id, stopId } = await params;
  if (!UUID_RE.test(id) || !UUID_RE.test(stopId)) return NextResponse.json({ error: "找不到這個站點" }, { status: 404 });
  const { regenerate_token, ...fields } = body;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) patch[k] = v;
  // 換一組新代碼：舊的 QR Code 立刻失效（QR 外流時用）
  if (regenerate_token) patch.stamp_token = generateStampToken();
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "沒有要更新的內容" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("study_tour_stops")
    .update(patch)
    .eq("id", stopId)
    .eq("tour_id", id)
    .select()
    .maybeSingle();
  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  if (!data) return NextResponse.json({ error: "找不到這個站點" }, { status: 404 });
  return NextResponse.json({ stop: data });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  const { id, stopId } = await params;
  if (!UUID_RE.test(id) || !UUID_RE.test(stopId)) return NextResponse.json({ error: "找不到這個站點" }, { status: 404 });
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("study_tour_stops").delete().eq("id", stopId).eq("tour_id", id);
  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
