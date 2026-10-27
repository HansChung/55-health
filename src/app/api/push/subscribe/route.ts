import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

/** 推播服務一定是 https 的公開網址（伺服器會 POST 過去，不能讓人填內網位址） */
const PushEndpoint = z.string().url().max(2000).refine((u) => {
  try {
    const { protocol, hostname } = new URL(u);
    return protocol === "https:" && hostname.includes(".") && !/^[\d.]+$/.test(hostname) && !hostname.includes(":") && hostname !== "localhost";
  } catch {
    return false;
  }
});

const PostSchema = z.object({
  endpoint: PushEndpoint,
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

  // 用 service role 寫：同一支手機換人登入時，這台裝置的訂閱要改綁到現在登入的人
  // （用使用者身分 upsert 會卡在別人那一筆的 RLS → 新登入的人收不到、前一個人的通知還一直跳在這支手機）
  const now = new Date().toISOString();
  const { error } = await createSupabaseAdmin().from("push_subscriptions").upsert(
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
