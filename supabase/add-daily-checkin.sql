-- ────────────────────────────────────────────────
-- 每日平安打卡：長輩每天按一下「我今天很好」；到了自己選的時間還沒按，先提醒長輩，再過一小時通知家人
-- 設定放在 profiles.notification_settings.daily_checkin = { on, deadline }（9／12／15／18 點，不用改表）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

-- 每天一筆（台北日期）；只給伺服器讀寫
create table if not exists daily_checkins (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  checked_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table daily_checkins enable row level security;
grant all on daily_checkins to service_role;

-- 今天已經提醒過長輩／通知過家人（先記再推播：排程重跑也不會重複發）
alter table profiles add column if not exists checkin_reminded_on date;
alter table profiles add column if not exists checkin_alerted_on date;
