-- ────────────────────────────────────────────────
-- 看診小幫手：每次看診一筆（回診前的看診小卡、看完診的檢驗報告說明、醫生交代的話）
-- 檢驗報告只存暖暖抄下來的項目與說明，不存照片
-- 只有伺服器（service role）讀寫，沒有給前端的 policy
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists clinic_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  visit_date date not null default ((now() at time zone 'Asia/Taipei')::date),
  department text check (department is null or char_length(department) <= 40),
  -- { input, card, meds, metrics }
  prep jsonb,
  -- { title, date, items[], summary, ask_doctor[] }
  report jsonb,
  doctor_notes text check (doctor_notes is null or char_length(doctor_notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinic_visits_user on clinic_visits (user_id, visit_date desc, created_at desc);

alter table clinic_visits enable row level security;
grant all on clinic_visits to service_role;
