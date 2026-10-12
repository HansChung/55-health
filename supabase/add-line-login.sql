-- ────────────────────────────────────────────────
-- LINE 登入：哪個 LINE 帳號連到哪個暖暖帳號
-- 一個 LINE 只能連一個暖暖帳號、一個暖暖帳號只連一個 LINE
-- 只有伺服器（service role）讀寫，沒有給前端的 policy
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists line_accounts (
  -- LINE 的 user id（U 開頭，每個 LINE 頻道提供者底下固定）
  line_user_id text primary key,
  user_id uuid not null unique references auth.users on delete cascade,
  display_name text,
  picture_url text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table line_accounts enable row level security;
grant all on line_accounts to service_role;
