-- ────────────────────────────────────────────────
-- 章節開篇私人草稿（chapter_drafts）
-- 在 Supabase Dashboard → SQL Editor 執行
-- 用途：0207 食譜卡、1201 生命資產清單等「本頁卡片」登入後私人回看
-- 不讀取使用者雲端硬碟、不搬檔；僅保存使用者主動填寫的文字
-- ────────────────────────────────────────────────

create table if not exists chapter_drafts (
  user_id uuid references auth.users on delete cascade not null,
  chapter_id text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id),
  constraint chapter_drafts_chapter_id_check check (chapter_id ~ '^[0-9]{4}$')
);

create index if not exists chapter_drafts_user_updated_idx
  on chapter_drafts (user_id, updated_at desc);

alter table chapter_drafts enable row level security;

drop policy if exists "users read own chapter drafts" on chapter_drafts;
create policy "users read own chapter drafts"
  on chapter_drafts for select using (auth.uid() = user_id);

drop policy if exists "users insert own chapter drafts" on chapter_drafts;
create policy "users insert own chapter drafts"
  on chapter_drafts for insert with check (auth.uid() = user_id);

drop policy if exists "users update own chapter drafts" on chapter_drafts;
create policy "users update own chapter drafts"
  on chapter_drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own chapter drafts" on chapter_drafts;
create policy "users delete own chapter drafts"
  on chapter_drafts for delete using (auth.uid() = user_id);
