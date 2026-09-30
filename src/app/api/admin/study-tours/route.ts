import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildTourPatch, tourCreateSchema, tourTimeProblem } from "@/lib/study-tours";
import { loadAdminTours } from "@/lib/study-tours-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  try {
    const tours = await loadAdminTours(createSupabaseAdmin());
    return NextResponse.json({ tours });
  } catch (e) {
    console.error("[api] DB error:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試（若是第一次使用，請先執行 supabase/add-study-tours.sql）" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "權限不足" }, { status: 403 });

  let body;
  try {
    body = tourCreateSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] 格式錯誤:", e);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }
  const problem = tourTimeProblem(body);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("study_tours")
    .insert({ status: "draft", ...buildTourPatch(body) })
    .select()
    .single();
  if (error) { console.error("[api] DB error:", error); return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 }); }
  return NextResponse.json({ tour: data });
}
