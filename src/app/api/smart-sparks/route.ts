// ────────────────────────────────────────────────
// SMART 圓夢藍圖 — 日常光點
// GET  → 列出光點（新到舊）+ 各軸計數
// POST → 新增一筆光點
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import {
  CHECKLIST_ITEMS,
  countSparksByDimension,
  scoresFromSparkCounts,
  type SmartSpark,
} from "@/lib/smart-blueprint";
import { isSparkSource } from "@/lib/chapter-opening";

const checklistIds = CHECKLIST_ITEMS.map((c) => c.id) as [string, ...string[]];

const PostSchema = z.object({
  dimension: z.enum(["S", "M", "A", "R", "T"]),
  action_text: z.string().trim().min(1).max(200),
  feeling_text: z.string().trim().min(1).max(200),
  checklist: z.array(z.enum(checklistIds)).max(10).optional(),
  source: z
    .string()
    .refine((v) => isSparkSource(v), { message: "invalid spark source" })
    .optional(),
});

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { data, error } = await supabase
    .from("smart_sparks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[api] smart_sparks GET:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  const sparks = (data ?? []) as SmartSpark[];
  const counts = countSparksByDimension(sparks);
  const scores = scoresFromSparkCounts(counts);

  return NextResponse.json({ sparks, counts, scores });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch (e) {
    console.error("[api] smart_sparks 格式錯誤:", e);
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("smart_sparks")
    .insert({
      user_id: user.id,
      dimension: body.dimension,
      action_text: body.action_text,
      feeling_text: body.feeling_text,
      checklist: body.checklist ?? [],
      source: body.source ?? "spark_card",
    })
    .select()
    .single();

  if (error) {
    console.error("[api] smart_sparks POST:", error);
    // 表尚未建立時給可理解提示
    if (error.message?.includes("smart_sparks") || error.code === "42P01") {
      return NextResponse.json(
        { error: "光點功能尚未啟用，請管理員先在資料庫執行 add-smart-sparks.sql" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({ spark: data });
}
