import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { loadLinkedElders, loadStudyToursForUser } from "@/lib/study-tours-server";

export const dynamic = "force-dynamic";

/** 研學團畫面資料：可報名的活動＋我的報名與集章＋可以幫忙報名的長輩 */
export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const admin = createSupabaseAdmin();
  try {
    const [tours, elders] = await Promise.all([
      loadStudyToursForUser(admin, user.id),
      loadLinkedElders(admin, user.id),
    ]);
    return NextResponse.json({ tours, elders });
  } catch (e) {
    const code = (e as { code?: string }).code;
    // 資料表還沒建（SQL 還沒跑）→ 當作目前沒有活動，不要整頁壞掉
    if (code === "42P01" || code === "PGRST205") {
      console.warn("[study-tours] tables missing — run supabase/add-study-tours.sql");
      return NextResponse.json({ tours: [], elders: [] });
    }
    console.error("[study-tours] load failed:", e);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }
}
