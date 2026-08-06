-- ────────────────────────────────────────────────
-- SMART RADAR 圓夢藍圖 — 日常光點（smart_sparks）
-- 在 Supabase Dashboard → SQL Editor 執行
-- R 軸語意：安全（與 SHI 問卷的「韌性」並存於產品，藍圖專用此表）
-- ────────────────────────────────────────────────

create table if not exists smart_sparks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  dimension text not null check (dimension in ('S', 'M', 'A', 'R', 'T')),
  action_text text not null,
  feeling_text text not null,
  checklist jsonb default '[]'::jsonb,
  source text not null default 'spark_card'
    check (source in ('spark_card', 'chapter3', 'chapter0100')),
  created_at timestamptz default now()
);

create index if not exists smart_sparks_user_idx
  on smart_sparks (user_id, created_at desc);

alter table smart_sparks enable row level security;

drop policy if exists "users read own sparks" on smart_sparks;
create policy "users read own sparks"
  on smart_sparks for select using (auth.uid() = user_id);

drop policy if exists "users insert own sparks" on smart_sparks;
create policy "users insert own sparks"
  on smart_sparks for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own sparks" on smart_sparks;
create policy "users delete own sparks"
  on smart_sparks for delete using (auth.uid() = user_id);
