-- ────────────────────────────────────────────────
-- 暖暖 55+ 資料庫 Schema
-- 在 Supabase Dashboard → SQL Editor 執行
-- ────────────────────────────────────────────────

-- 1. 使用者個人資料（auth.users 之外的擴充資料）
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  age int,
  gender text check (gender in ('male', 'female', 'other')),
  height_cm int,
  weight_kg numeric(5,2),
  calorie_goal int default 1800,
  voice_tone text default 'warm' check (voice_tone in ('warm', 'strict', 'grandchild')),
  font_scale text default 'base' check (font_scale in ('base', 'lg')),
  high_contrast boolean default false,
  chronic_conditions text[] default '{}',
  medications jsonb default '[]',
  subscription_tier text default 'free' check (subscription_tier in ('free', 'basic', 'pro')),
  subscription_expires_at timestamptz,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 用餐記錄
create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  eaten_at timestamptz default now(),
  photo_url text,
  items jsonb not null default '[]',
  total_cal int default 0,
  protein_g numeric(6,2) default 0,
  carb_g numeric(6,2) default 0,
  fat_g numeric(6,2) default 0,
  portion numeric(3,1) default 1,
  notes text,
  ai_analysis_id uuid,
  created_at timestamptz default now()
);

create index if not exists meals_user_eaten_idx on meals (user_id, eaten_at desc);

-- 3. 運動記錄
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  exercise_type text not null,
  minutes int not null,
  kcal_burned int default 0,
  performed_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists exercises_user_perf_idx on exercises (user_id, performed_at desc);

-- 4. AI 用量記錄（Token 計費追蹤）
create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  service text not null check (service in ('gemini_vision', 'gemini_text', 'openai_realtime', 'openai_chat')),
  model text not null,
  input_tokens int default 0,
  output_tokens int default 0,
  audio_seconds numeric(8,2) default 0,
  cost_usd numeric(10,6) default 0,
  endpoint text,
  success boolean default true,
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists ai_usage_user_idx on ai_usage (user_id, created_at desc);
create index if not exists ai_usage_service_idx on ai_usage (service, created_at desc);

-- 5. 家人共享關係
create table if not exists family_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null,
  family_user_id uuid references auth.users on delete cascade,
  family_name text not null,
  relationship text not null,
  invite_code text unique,
  invite_expires_at timestamptz,
  permissions jsonb default '{"calories": true, "alerts": true, "diary": true, "voice": false}',
  status text default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz default now()
);

-- 6. 對話歷史（語音 / 文字 chat）
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  audio_url text,
  ai_usage_id uuid references ai_usage(id),
  session_id uuid,
  created_at timestamptz default now()
);

create index if not exists conv_user_session_idx on conversations (user_id, session_id, created_at);

-- 7. API Key 設定（管理員用，允許切換多家 AI provider）
create table if not exists api_configs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('gemini', 'openai', 'anthropic')),
  api_key_encrypted text not null,
  model_default text,
  enabled boolean default true,
  monthly_budget_usd numeric(10,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. 訂閱方案配額
create table if not exists subscription_plans (
  id text primary key,
  display_name text not null,
  price_monthly_twd int,
  ai_photo_quota int,
  ai_voice_minutes int,
  features jsonb default '[]',
  active boolean default true
);

insert into subscription_plans (id, display_name, price_monthly_twd, ai_photo_quota, ai_voice_minutes, features) values
  ('free',  '免費版', 0,    10,  5,  '["基本記錄"]'),
  ('basic', '標準版', 199,  100, 30, '["基本記錄", "AI 拍照", "AI 語音"]'),
  ('pro',   '專業版', 399,  500, 120,'["全部功能", "家人共享", "進階分析"]')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────
-- Row Level Security (RLS) — 確保用戶只能讀寫自己的資料
-- ────────────────────────────────────────────────
alter table profiles enable row level security;
alter table meals enable row level security;
alter table exercises enable row level security;
alter table ai_usage enable row level security;
alter table family_links enable row level security;
alter table conversations enable row level security;

create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "users read own meals" on meals for select using (auth.uid() = user_id);
create policy "users insert own meals" on meals for insert with check (auth.uid() = user_id);
create policy "users update own meals" on meals for update using (auth.uid() = user_id);
create policy "users delete own meals" on meals for delete using (auth.uid() = user_id);

create policy "users read own exercises" on exercises for select using (auth.uid() = user_id);
create policy "users insert own exercises" on exercises for insert with check (auth.uid() = user_id);

create policy "users read own ai_usage" on ai_usage for select using (auth.uid() = user_id);

create policy "users read own family" on family_links for select using (auth.uid() = owner_id or auth.uid() = family_user_id);
create policy "users insert own family" on family_links for insert with check (auth.uid() = owner_id);

create policy "users read own conversations" on conversations for select using (auth.uid() = user_id);
create policy "users insert own conversations" on conversations for insert with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────
-- 自動建立 profile trigger（用戶註冊時）
-- ────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
