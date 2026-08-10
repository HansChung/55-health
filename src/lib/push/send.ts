import webpush from "web-push";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function configureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@nuan55.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export function isWebPushConfigured(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  return Boolean(publicKey && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
}

/** 對單一使用者的所有訂閱發送 Web Push；失效訂閱會自動刪除 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; removed: number }> {
  if (!configureVapid()) return { sent: 0, removed: 0 };

  const supabase = createSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("[push] 讀取訂閱失敗:", error);
    return { sent: 0, removed: 0 };
  }

  let sent = 0;
  let removed = 0;
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    tag: payload.tag || "nuannuan-alert",
  });

  for (const row of rows ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        body,
        { TTL: 60 * 60 * 12 }
      );
      sent += 1;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      // 410/404 = 訂閱失效
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", row.id);
        removed += 1;
      } else {
        console.warn("[push] 發送失敗:", status, e);
      }
    }
  }

  return { sent, removed };
}
