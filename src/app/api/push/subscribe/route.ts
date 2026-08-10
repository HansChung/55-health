import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const PostSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(200),
  }),
  userAgent: z.string().max(400).optional(),
});

const DeleteSchema = z.object({
  endpoint: z.string().url().max(2000),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: z.infer<typeof PostSchema>;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      user_agent: body.userAgent ?? null,
      updated_at: now,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("[api] push subscribe:", error);
    const missing =
      error.code === "42P01" ||
      /push_subscriptions|schema cache|does not exist/i.test(error.message ?? "");
    if (missing) {
      return NextResponse.json(
        { error: "推播功能尚未啟用，請管理員執行 add-push-subscriptions.sql" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: z.infer<typeof DeleteSchema>;
  try {
    body = DeleteSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "送出的資料格式有誤" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", body.endpoint);

  if (error) {
    console.error("[api] push unsubscribe:", error);
    return NextResponse.json({ error: "伺服器忙線中，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
