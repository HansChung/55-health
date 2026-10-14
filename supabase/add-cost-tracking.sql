-- ────────────────────────────────────────────────
-- 後台「每月成本」：每天記一次 lk888 金鑰的累計用量和餘額（相減＝每個月實際扣了多少算力）
-- 固定費用、算力價格、匯率存在 app_settings（key = 'costs'，需要先跑過 add-plan-settings.sql）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists lk888_usage_snapshots (
  day date primary key,
  used numeric(14, 4) not null,
  balance numeric(14, 4) not null,
  updated_at timestamptz not null default now()
);

alter table lk888_usage_snapshots enable row level security;
grant all on lk888_usage_snapshots to service_role;
