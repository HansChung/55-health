// ────────────────────────────────────────────────
// 家人生日提醒的排程（Vercel Cron，見 vercel.json；CRON_SECRET 保護；需要 VAPID）
// 每天 23:00 UTC＝台北早上 7 點那一個小時：今天生日的（day）＋ 3 天後生日的（ahead），各推播一次給記下這筆的人
// 用「曆法＋月＋日」找人（birthdayKeysFor：農曆換算、2/29、小月的三十日都在那裡處理）；
// 每筆先「搶」記號（reminded_*_on＝今天）才發，重跑不會重複
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isWebPushConfigured, sendPushToUser } from "@/lib/push/send";
import { BIRTHDAY_AHEAD_DAYS, birthdayKeysFor, birthdayPush, nextBirthday, type BirthdayCalendar } from "@/lib/birthdays";
import { BIRTHDAY_COLUMNS, toClientBirthday } from "@/lib/birthdays-server";
import { taipeiDate } from "@/lib/clinic-appointments";
import { createDeadline, mapWithConcurrency } from "@/lib/concurrency";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONCURRENCY = 8;
const TIME_BUDGET_MS = 45_000;
const PAGE = 500;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isWebPushConfigured()) return NextResponse.json({ ok: true, skipped: "VAPID 金鑰沒設定" });

  const admin = createSupabaseAdmin();
  const today = taipeiDate();
  const deadline = createDeadline(TIME_BUDGET_MS);
  const result = { found: 0, day_notified: 0, ahead_notified: 0 };
  let skippedForTime = false;

  const steps = [
    { kind: "day" as const, target: today, col: "reminded_day_on" },
    { kind: "ahead" as const, target: taipeiDate(new Date(), BIRTHDAY_AHEAD_DAYS), col: "reminded_ahead_on" },
  ];
  for (const step of steps) {
    const keys = birthdayKeysFor(step.target);
    const groups: { calendar: BirthdayCalendar; month: number; days: number[] }[] = [{ calendar: "solar", ...keys.solar }];
    if (keys.lunar) groups.push({ calendar: "lunar", ...keys.lunar });
    for (const g of groups) {
      // 每一輪拿還沒提醒的前 PAGE 筆；處理完都會搶走記號，所以下一輪從頭拿就是下一批
      while (!deadline.expired) {
        const { data, error } = await admin
          .from("family_birthdays")
          .select(`${BIRTHDAY_COLUMNS}, user_id`)
          .eq("remind", true)
          .eq("calendar", g.calendar)
          .eq("month", g.month)
          .in("day", g.days)
          .or(`${step.col}.is.null,${step.col}.neq.${today}`)
          .order("id")
          .limit(PAGE);
        if (error) {
          console.error("[cron] birthday-reminders load:", error);
          return NextResponse.json({ error: "讀取失敗（add-family-birthdays.sql 跑了嗎？）" }, { status: 500 });
        }
        const rows = (data ?? []) as (Record<string, unknown> & { user_id: string })[];
        if (rows.length === 0) break;
        result.found += rows.length;
        let claimedAny = false;

        await mapWithConcurrency(rows, CONCURRENCY, async (row) => {
          if (deadline.expired) {
            skippedForTime = true;
            return;
          }
          const { data: claimed, error: claimErr } = await admin
            .from("family_birthdays")
            .update({ [step.col]: today })
            .eq("id", row.id as string)
            .or(`${step.col}.is.null,${step.col}.neq.${today}`)
            .select("id");
          if (claimErr || !claimed?.length) {
            if (claimErr) console.warn("[cron] birthday-reminders claim:", claimErr.message);
            return;
          }
          claimedAny = true;
          const b = toClientBirthday(row, today);
          // 再用同一套規則確認一次：真的是今天／3 天後才發（對不上就不發，記號已經記了不會一直重試）
          const next = nextBirthday(b, today);
          if (!next || next.date !== step.target) return;
          const res = await sendPushToUser(row.user_id, { ...birthdayPush(b, next), url: "/?open=birthdays", tag: `birthday-${b.id}-${step.kind}` }).catch((e) => {
            console.warn("[cron] birthday-reminders push:", e);
            return { sent: 0 };
          });
          if (res.sent > 0) result[step.kind === "day" ? "day_notified" : "ahead_notified"]++;
        });
        // 這一輪一筆都沒搶到（都被別的執行搶走、或資料庫出錯）：不要一直重拿同一批
        if (!claimedAny) break;
      }
    }
  }
  if (deadline.expired) skippedForTime = true;
  if (skippedForTime) console.error(`[cron] 生日提醒時間不足（${today}），沒處理到的這次收不到`);

  return NextResponse.json({ ok: true, day: today, ...result, skipped_for_time: skippedForTime, took_ms: deadline.elapsedMs });
}
