-- ────────────────────────────────────────────────
-- Web Push 訂閱（push_subscriptions）
-- 在 Supabase Dashboard → SQL Editor 執行
-- 家人開啟瀏覽器推播後，異常預警可即時推到裝置
-- ────────────────────────────────────────────────

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_idx
  on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "users read own push subs" on push_subscriptions;
create policy "users read own push subs"
  on push_subscriptions for select using (auth.uid() = user_id);

drop policy if exists "users insert own push subs" on push_subscriptions;
create policy "users insert own push subs"
  on push_subscriptions for insert with check (auth.uid() = user_id);

drop policy if exists "users update own push subs" on push_subscriptions;
create policy "users update own push subs"
  on push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own push subs" on push_subscriptions;
create policy "users delete own push subs"
  on push_subscriptions for delete using (auth.uid() = user_id);
