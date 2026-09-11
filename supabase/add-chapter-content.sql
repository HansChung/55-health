-- ────────────────────────────────────────────────
-- 書本練習內容（chapter_content）— 後台可編輯／可新增的章節內容
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行，不會壞資料）
--
-- 兩種資料列：
--   1. 程式碼內建章節的「覆蓋」（is_custom = false）：只存管理員改過的欄位，
--      沒有資料列 → 畫面用程式碼預設值。改錯也不會讓章節消失。
--   2. 後台新增的章節（is_custom = true）：整章內容都在這裡；
--      published = false 為草稿，只有管理員預覽看得到。
-- ────────────────────────────────────────────────

create table if not exists chapter_content (
  chapter_id text primary key,
  overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null,
  constraint chapter_content_chapter_id_check check (chapter_id ~ '^[0-9]{4}$')
);

-- 新增章節用的欄位（第一版沒有，這裡補上）
alter table chapter_content add column if not exists is_custom boolean not null default false;
alter table chapter_content add column if not exists published boolean not null default true;
alter table chapter_content add column if not exists created_at timestamptz not null default now();

alter table chapter_content enable row level security;

-- 公開可讀：內建章節的覆蓋，以及「已發布」的新章節；草稿不外流
drop policy if exists "anyone reads chapter content" on chapter_content;
create policy "anyone reads chapter content"
  on chapter_content for select
  using (not is_custom or published);

-- 寫入不開放給一般用戶；只由後台 API 以 service role 執行（並先驗證管理員）
