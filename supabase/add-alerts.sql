-- ────────────────────────────────────────────────
-- 異常預警記錄表（暖暖「主動守護」功能）
-- 在 Supabase Dashboard → SQL Editor 執行
-- ────────────────────────────────────────────────

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references auth.users on delete cascade not null,  -- 長輩（被監測者）
  alert_type text not null check (alert_type in (
    'inactivity', 'blood_pressure', 'blood_glucose', 'weight_change', 'missed_medication'
  )),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  title text not null,
  message text not null,
  metadata jsonb default '{}',           -- 觸發時的數值，例如 {"systolic": 165, "diastolic": 105}
  notified_family jsonb default '[]',    -- 通知了哪些家人 [{family_id, email, sent_at}]
  resolved boolean default false,        -- 子女可標記「已處理」
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists alerts_elder_type_idx
  on alerts (elder_id, alert_type, created_at desc);

create index if not exists alerts_elder_unresolved_idx
  on alerts (elder_id, resolved, created_at desc);

-- ────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────
alter table alerts enable row level security;

-- 長輩本人能看自己的警報
drop policy if exists "elder reads own alerts" on alerts;
create policy "elder reads own alerts"
  on alerts for select using (auth.uid() = elder_id);

-- 被授權（accepted + alerts 權限）的家人能看
drop policy if exists "family reads linked alerts" on alerts;
create policy "family reads linked alerts"
  on alerts for select using (
    exists (
      select 1 from family_links
      where family_links.owner_id = alerts.elder_id
        and family_links.family_user_id = auth.uid()
        and family_links.status = 'accepted'
        and coalesce((family_links.permissions->>'alerts')::boolean, false) = true
    )
  );

-- 長輩 / 家人可標記已處理（update resolved）
drop policy if exists "elder updates own alerts" on alerts;
create policy "elder updates own alerts"
  on alerts for update using (auth.uid() = elder_id);

drop policy if exists "family updates linked alerts" on alerts;
create policy "family updates linked alerts"
  on alerts for update using (
    exists (
      select 1 from family_links
      where family_links.owner_id = alerts.elder_id
        and family_links.family_user_id = auth.uid()
        and family_links.status = 'accepted'
        and coalesce((family_links.permissions->>'alerts')::boolean, false) = true
    )
  );

-- 注意：不開放一般用戶 INSERT。寫入只由 cron（service role）執行，繞過 RLS。
