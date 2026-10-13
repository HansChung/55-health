-- ────────────────────────────────────────────────
-- 回診提醒：記下回診（或領慢性處方箋藥）的日子，前一天晚上、當天早上推播提醒；可以選也告訴家人
-- 只有伺服器（service role）讀寫，沒有給前端的 policy
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists clinic_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- visit＝回診；refill＝領慢性處方箋的藥
  kind text not null default 'visit' check (kind in ('visit', 'refill')),
  appt_date date not null,
  -- 台北時間 HH:MM（不知道幾點可以不填）
  appt_time text check (appt_time is null or appt_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  hospital text check (hospital is null or char_length(hospital) <= 40),
  department text check (department is null or char_length(department) <= 40),
  note text check (note is null or char_length(note) <= 200),
  notify_family boolean not null default true,
  -- 提醒過了（先記再推播：排程重跑也不會重複發）
  reminded_day_before_at timestamptz,
  reminded_same_day_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinic_appointments_user on clinic_appointments (user_id, appt_date);
create index if not exists clinic_appointments_day on clinic_appointments (appt_date);

alter table clinic_appointments enable row level security;
grant all on clinic_appointments to service_role;
