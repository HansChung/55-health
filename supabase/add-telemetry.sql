-- ────────────────────────────────────────────────
-- 輕量遙測：使用分析 + 錯誤監控（不需外部服務，存在自己的 Supabase）
-- 在 Supabase Dashboard → SQL Editor 執行
-- ────────────────────────────────────────────────

create table if not exists app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  kind text not null check (kind in ('usage', 'error')),
  name text not null,           -- 例如 'screen_view' / 'photo_analyze' / 'js_error'
  detail jsonb default '{}',
  path text,
  created_at timestamptz default now()
);

create index if not exists app_events_kind_idx on app_events (kind, created_at desc);
create index if not exists app_events_name_idx on app_events (name, created_at desc);

-- RLS：一般用戶不可讀（避免看到別人資料）；寫入由伺服端 service role 負責；admin 透過 service role 讀
alter table app_events enable row level security;
-- 不開放任何一般用戶的 select / insert policy（全部走 service role）
