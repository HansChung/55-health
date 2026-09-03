-- ────────────────────────────────────────────────
-- 章節內容覆蓋（chapter_content）— 後台可編輯的書本練習內容
-- 在 Supabase Dashboard → SQL Editor 執行
--
-- 設計：章節預設內容仍在程式碼；這張表只存「管理員改過的欄位」。
-- 沒有資料列 → 畫面用預設值。等於一層安全的覆蓋，改錯也不會讓章節消失。
-- ────────────────────────────────────────────────

create table if not exists chapter_content (
  chapter_id text primary key,
  overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null,
  constraint chapter_content_chapter_id_check check (chapter_id ~ '^[0-9]{4}$')
);

alter table chapter_content enable row level security;

-- 章節內容是公開的：任何人（含未登入）都可讀，畫面載入時用
drop policy if exists "anyone reads chapter content" on chapter_content;
create policy "anyone reads chapter content"
  on chapter_content for select using (true);

-- 寫入不開放給一般用戶；只由後台 API 以 service role 執行（並先驗證管理員）
