-- 健康指標追蹤（體重 / 血壓 / 血糖）
create table if not exists health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  metric_type text not null check (metric_type in ('weight', 'blood_pressure', 'blood_glucose')),
  measured_at timestamptz default now(),

  -- 體重（公斤）
  weight_kg numeric(5,2),

  -- 血壓（mmHg）
  systolic int,        -- 收縮壓（高壓）
  diastolic int,       -- 舒張壓（低壓）
  pulse int,           -- 脈搏（可選）

  -- 血糖（mg/dL）
  glucose_mg_dl int,
  glucose_context text check (
    glucose_context is null or
    glucose_context in ('fasting', 'before_meal', 'after_meal', 'bedtime')
  ),

  notes text,
  created_at timestamptz default now()
);

create index if not exists health_metrics_user_type_idx
  on health_metrics (user_id, metric_type, measured_at desc);

-- RLS
alter table health_metrics enable row level security;

drop policy if exists "users read own health metrics" on health_metrics;
create policy "users read own health metrics"
  on health_metrics for select using (auth.uid() = user_id);

drop policy if exists "users insert own health metrics" on health_metrics;
create policy "users insert own health metrics"
  on health_metrics for insert with check (auth.uid() = user_id);

drop policy if exists "users update own health metrics" on health_metrics;
create policy "users update own health metrics"
  on health_metrics for update using (auth.uid() = user_id);

drop policy if exists "users delete own health metrics" on health_metrics;
create policy "users delete own health metrics"
  on health_metrics for delete using (auth.uid() = user_id);
