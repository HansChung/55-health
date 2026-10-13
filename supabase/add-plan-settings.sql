-- ────────────────────────────────────────────────
-- 後台「方案與次數」：功能開關、每個功能最低方案、各項次數上限、個別帳號開通
-- 沒跑這個 SQL 之前，程式用原本寫死的預設值（行為不變）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

-- 設定：key = 'plan' → { "features": { <功能>: { "enabled", "min_tier" } }, "limits": { <上限>: { "free", "basic", "pro" } } }
create table if not exists app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);
alter table app_settings enable row level security;
grant all on app_settings to service_role;

-- 個別帳號開通：這個人用某個功能時當作某個方案（次數也照那個方案算）
create table if not exists user_feature_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  feature text not null,
  tier text not null default 'pro' check (tier in ('free', 'basic', 'pro')),
  expires_at timestamptz,
  note text check (char_length(note) <= 200),
  granted_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, feature)
);
create index if not exists user_feature_grants_user on user_feature_grants (user_id);
alter table user_feature_grants enable row level security;
grant all on user_feature_grants to service_role;
