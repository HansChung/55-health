// ────────────────────────────────────────────────
// 警報 Email 模板（暖暖品牌色）
// ────────────────────────────────────────────────

export interface AlertPayload {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface BuildAlertEmailParams {
  familyName: string;
  elderName: string;
  alert: AlertPayload;
}

const SEVERITY_STYLE: Record<string, { color: string; icon: string; label: string }> = {
  critical: { color: "#C95B6E", icon: "🚨", label: "需要注意" },
  warning: { color: "#D9A441", icon: "⚠️", label: "溫馨提醒" },
  info: { color: "#7AA779", icon: "💚", label: "近況通知" },
};

export function buildAlertEmail({
  familyName,
  elderName,
  alert,
}: BuildAlertEmailParams): string {
  const style = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.warning;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF5EC;font-family:'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FAF5EC;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background:${style.color};padding:32px 24px;text-align:center;">
          <div style="font-size:44px;line-height:1;">${style.icon}</div>
          <h1 style="margin:10px 0 0;color:#FFFFFF;font-size:22px;font-weight:800;">暖暖健康提醒</h1>
          <p style="margin:6px 0 0;color:#FFFFFF;font-size:13px;opacity:0.9;">${style.label}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 24px;color:#3D2E20;">
          <p style="margin:0 0 6px;font-size:16px;">${escapeHtml(familyName)} 您好，</p>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#6B5848;">
            關於 <strong style="color:#3D2E20;">${escapeHtml(elderName)}</strong> 的健康狀況，我們想讓您知道：
          </p>

          <div style="background:#FAF5EC;border-left:4px solid ${style.color};border-radius:10px;padding:18px 20px;margin:0 0 22px;">
            <p style="margin:0 0 8px;font-weight:700;font-size:17px;color:#3D2E20;">${escapeHtml(alert.title)}</p>
            <p style="margin:0;font-size:15px;line-height:1.65;color:#6B5848;">${escapeHtml(alert.message)}</p>
          </div>

          <div style="text-align:center;">
            <a href="https://nuan55.com" style="display:inline-block;background:#E8845A;color:#FFFFFF;text-decoration:none;padding:15px 40px;border-radius:999px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(232,132,90,0.3);">
              打開暖暖查看
            </a>
          </div>

          <p style="margin:22px 0 0;font-size:12px;color:#A89580;line-height:1.6;text-align:center;">
            ※ 本提醒僅供參考，不能取代專業醫療診斷。<br>如有健康疑慮，請諮詢醫師或就近就醫。
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #F2E8D5;padding:18px 24px;text-align:center;background:#FAF5EC;">
          <p style="margin:0 0 4px;font-size:12px;color:#6B5848;">暖暖團隊 ❤️</p>
          <p style="margin:0;font-size:11px;color:#A89580;line-height:1.6;">
            <a href="https://nuan55.com" style="color:#A89580;text-decoration:none;">nuan55.com</a><br>
            您收到此信是因為您是 ${escapeHtml(elderName)} 的家人並開啟了健康提醒<br>
            可在暖暖 App 的「家人共享」中關閉此通知
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ────────────────────────────────────────────────
// 每週健康報告 Email
// ────────────────────────────────────────────────
interface BuildWeeklyEmailParams {
  recipientName: string;
  elderName: string;
  /** 收件者是否為家人（決定用「家人摘要」還是「給長者的提醒」） */
  forFamily: boolean;
  report: {
    meals: { days_logged: number; meals_count: number; avg_calories: number };
    exercise: { minutes: number };
    tips: string[];
    family_summary: string[];
  };
}

export function buildWeeklyReportEmail({
  recipientName,
  elderName,
  forFamily,
  report,
}: BuildWeeklyEmailParams): string {
  const points = forFamily ? report.family_summary : report.tips;
  const intro = forFamily
    ? `這是 <strong style="color:#3D2E20;">${escapeHtml(elderName)}</strong> 這週的健康摘要：`
    : `這是您這週的健康回顧：`;

  const listItems = points
    .map(
      (p) =>
        `<li style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#6B5848;">${escapeHtml(p)}</li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF5EC;font-family:'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FAF5EC;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <tr><td style="background:#E8845A;padding:24px 28px;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#FFFFFF;">🍊 暖暖每週報告</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 6px;font-size:16px;">${escapeHtml(recipientName)} 您好，</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#6B5848;">${intro}</p>
          <table role="presentation" width="100%" style="background:#FFF8EE;border-radius:14px;margin:0 0 18px;">
            <tr><td style="padding:16px 18px;font-size:15px;color:#3D2E20;line-height:1.8;">
              📋 飲食記錄：<strong>${report.meals.days_logged}</strong> 天、共 <strong>${report.meals.meals_count}</strong> 餐<br>
              🔥 平均每天約 <strong>${report.meals.avg_calories}</strong> 大卡<br>
              🚶 運動累積 <strong>${report.exercise.minutes}</strong> 分鐘
            </td></tr>
          </table>
          <ul style="margin:0 0 8px;padding-left:20px;">${listItems}</ul>
        </td></tr>
        <tr><td style="padding:16px 28px 28px;border-top:1px solid #ECDFC8;">
          <p style="margin:0;font-size:12px;color:#A89580;line-height:1.6;">
            本報告由暖暖自動產生，僅供參考，非醫療診斷。如有健康疑慮請諮詢醫師。
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ────────────────────────────────────────────────
// 每日關懷問候 Email
// ────────────────────────────────────────────────
interface BuildDailyCareParams {
  name: string;
  greeting: string; // 早安 / 午安
  lines: string[]; // 個人化問候內容（已組好）
  tip: string; // 今日小叮嚀
}

export function buildDailyCareEmail({ name, greeting, lines, tip }: BuildDailyCareParams): string {
  const body = lines
    .map((l) => `<p style="margin:0 0 8px;font-size:16px;line-height:1.7;color:#3D2E20;">${escapeHtml(l)}</p>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF5EC;font-family:'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAF5EC;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#FFD4A8 0%,#E8845A 100%);padding:28px 24px;text-align:center;">
          <div style="font-size:44px;line-height:1;">🐻</div>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">${escapeHtml(greeting)}，${escapeHtml(name)}</h1>
        </td></tr>
        <tr><td style="padding:28px 24px;">
          ${body}
          <div style="background:#FFF8EE;border-radius:12px;padding:14px 16px;margin:16px 0 0;">
            <p style="margin:0;font-size:15px;color:#6B5848;line-height:1.6;">💡 今日小叮嚀：${escapeHtml(tip)}</p>
          </div>
          <div style="text-align:center;margin-top:22px;">
            <a href="https://nuan55.com" style="display:inline-block;background:#E8845A;color:#fff;text-decoration:none;padding:14px 36px;border-radius:999px;font-weight:700;font-size:16px;">打開暖暖記錄今天</a>
          </div>
        </td></tr>
        <tr><td style="border-top:1px solid #F2E8D5;padding:16px 24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#A89580;line-height:1.6;">
            暖暖每天陪您 ❤️ · <a href="https://nuan55.com" style="color:#A89580;">nuan55.com</a><br>
            不想收到每日問候？可在 App 的「提醒通知」中關閉。
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// 防 XSS：使用者填的名字可能含特殊字元
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
