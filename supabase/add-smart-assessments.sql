-- ────────────────────────────────────────────────
-- SMART RADAR 五大構面 + SHI 智慧幸福指數 檢測記錄
-- 在 Supabase Dashboard → SQL Editor 執行
-- ────────────────────────────────────────────────

create table if not exists smart_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  score_s int not null,   -- 0-100
  score_m int not null,
  score_a int not null,
  score_r int not null,
  score_t int not null,
  shi int not null,        -- 0-100 綜合分數
  answers jsonb default '[]',  -- 原始 15 題答案（1-5），供日後重新分析
  created_at timestamptz default now()
);

create index if not exists smart_assessments_user_idx
  on smart_assessments (user_id, created_at desc);

alter table smart_assessments enable row level security;

drop policy if exists "users read own assessments" on smart_assessments;
create policy "users read own assessments"
  on smart_assessments for select using (auth.uid() = user_id);

drop policy if exists "users insert own assessments" on smart_assessments;
create policy "users insert own assessments"
  on smart_assessments for insert with check (auth.uid() = user_id);

-- 家人若有 alerts 權限也能看（與健康警報一致，可選）
drop policy if exists "family reads linked assessments" on smart_assessments;
create policy "family reads linked assessments"
  on smart_assessments for select using (
    exists (
      select 1 from family_links
      where family_links.owner_id = smart_assessments.user_id
        and family_links.family_user_id = auth.uid()
        and family_links.status = 'accepted'
        and coalesce((family_links.permissions->>'alerts')::boolean, false) = true
    )
  );
