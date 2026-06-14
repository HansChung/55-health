import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { computeWeeklyReport } from "@/lib/reports/weekly";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const report = await computeWeeklyReport(supabase, user.id);
  if (!report) {
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
  return NextResponse.json({ report });
}
