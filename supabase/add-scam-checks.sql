-- ────────────────────────────────────────────────
-- 這則訊息可疑嗎？：長輩把可疑訊息（截圖或文字）給暖暖看，暖暖列出詐騙疑點
-- 這裡只存暖暖的判斷和「訊息大意」（帳號、驗證碼已遮住），不存截圖、不存完整原文
-- 長輩按「通知家人」才給家人看（shared_at）；90 天後由每天的清理排程刪掉
-- 只有伺服器（service role）讀寫，沒有給前端的 policy
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists scam_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  verdict text not null check (verdict in ('danger', 'suspicious', 'unsure', 'likely_ok')),
  -- { title, kind, signals[], advice[], verify, excerpt }
  result jsonb not null,
  -- 長輩給了什麼：截圖、文字或兩個都有
  input_kind text not null check (input_kind in ('image', 'text', 'both')),
  shared_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists scam_checks_user on scam_checks (user_id, created_at desc);
create index if not exists scam_checks_shared on scam_checks (user_id, shared_at desc) where shared_at is not null;

alter table scam_checks enable row level security;
grant all on scam_checks to service_role;
