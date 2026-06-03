// ────────────────────────────────────────────────
// Resend 寄信工具（跟 Supabase auth 寄信分開）
// 需要環境變數 RESEND_API_KEY（re_xxx）
// 拿 key: https://resend.com/api-keys
// ────────────────────────────────────────────────

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  ok: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY 未設定，跳過寄信");
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "暖暖 <noreply@nuan55.com>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[email] 寄信失敗:", err);
      return { ok: false, error: err };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[email] 寄信例外:", e);
    return { ok: false, error: String(e) };
  }
}
