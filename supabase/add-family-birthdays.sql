-- ────────────────────────────────────────────────
-- 家人生日提醒：記下家人、朋友的生日（國曆或農曆），3 天前和當天早上推播提醒
-- 只有伺服器（service role）讀寫，沒有給前端的 policy
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists family_birthdays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  -- 女兒、孫子、朋友…（可以不填）
  relation text check (relation is null or char_length(relation) <= 10),
  -- solar＝國曆；lunar＝農曆（month／day 就是農曆的月、日）
  calendar text not null default 'solar' check (calendar in ('solar', 'lunar')),
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  -- 西元出生年（可以不填；有填才算得出幾歲）
  birth_year smallint check (birth_year is null or birth_year between 1900 and 2200),
  remind boolean not null default true,
  -- 提醒過的那一天（台北日期；先記再推播：排程重跑也不會重複發）
  reminded_ahead_on date,
  reminded_day_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_birthdays_user on family_birthdays (user_id);
-- 排程每天用「曆法＋月＋日」找今天、3 天後生日的人
create index if not exists family_birthdays_day on family_birthdays (calendar, month, day) where remind;

alter table family_birthdays enable row level security;
grant all on family_birthdays to service_role;
