-- ────────────────────────────────────────────────
-- 正式站缺口一次修復（可重跑）
-- 在 Supabase SQL Editor 全選 → Run
-- 含：光點表／source 約束、章節草稿、alerts、Web Push、警戒閾值
-- 不要跑 add-chapter0100-source.sql 或 add-chapter-opening-sources.sql
-- ────────────────────────────────────────────────

-- ────────────────────────────────────────────────
-- SMART RADAR 圓夢藍圖 — 日常光點（smart_sparks）
-- 在 Supabase Dashboard → SQL Editor 執行
-- R 軸語意：安全（與 SHI 問卷的「韌性」並存於產品，藍圖專用此表）
-- ────────────────────────────────────────────────

create table if not exists smart_sparks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  dimension text not null check (dimension in ('S', 'M', 'A', 'R', 'T')),
  action_text text not null,
  feeling_text text not null,
  checklist jsonb default '[]'::jsonb,
  source text not null default 'spark_card'
    check (
      source in ('spark_card', 'chapter3', 'chapterp4-open')
      or source ~ '^chapter[0-9]{4}$'
    ),
  created_at timestamptz default now()
);

create index if not exists smart_sparks_user_idx
  on smart_sparks (user_id, created_at desc);

alter table smart_sparks enable row level security;

drop policy if exists "users read own sparks" on smart_sparks;
create policy "users read own sparks"
  on smart_sparks for select using (auth.uid() = user_id);

drop policy if exists "users insert own sparks" on smart_sparks;
create policy "users insert own sparks"
  on smart_sparks for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own sparks" on smart_sparks;
create policy "users delete own sparks"
  on smart_sparks for delete using (auth.uid() = user_id);
-- ────────────────────────────────────────────────
-- 修正 smart_sparks.source 檢查：允許全部章節 QR 與第四部開篇
-- 舊環境若只允許 spark_card / chapter3 / chapter0100，執行本檔即可
-- ────────────────────────────────────────────────

alter table smart_sparks drop constraint if exists smart_sparks_source_check;

alter table smart_sparks add constraint smart_sparks_source_check
  check (
    source in ('spark_card', 'chapter3', 'chapterp4-open')
    or source ~ '^chapter[0-9]{4}$'
  );
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
-- ────────────────────────────────────────────────
-- 異常預警記錄表（暖暖「主動守護」功能）
-- 在 Supabase Dashboard → SQL Editor 執行
-- ────────────────────────────────────────────────

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references auth.users on delete cascade not null,  -- 長輩（被監測者）
  alert_type text not null check (alert_type in (
    'inactivity', 'blood_pressure', 'blood_glucose', 'weight_change', 'missed_medication'
  )),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  title text not null,
  message text not null,
  metadata jsonb default '{}',           -- 觸發時的數值，例如 {"systolic": 165, "diastolic": 105}
  notified_family jsonb default '[]',    -- 通知了哪些家人 [{family_id, email, sent_at}]
  resolved boolean default false,        -- 子女可標記「已處理」
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists alerts_elder_type_idx
  on alerts (elder_id, alert_type, created_at desc);

create index if not exists alerts_elder_unresolved_idx
  on alerts (elder_id, resolved, created_at desc);

-- ────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────
alter table alerts enable row level security;

-- 長輩本人能看自己的警報
drop policy if exists "elder reads own alerts" on alerts;
create policy "elder reads own alerts"
  on alerts for select using (auth.uid() = elder_id);

-- 被授權（accepted + alerts 權限）的家人能看
drop policy if exists "family reads linked alerts" on alerts;
create policy "family reads linked alerts"
  on alerts for select using (
    exists (
      select 1 from family_links
      where family_links.owner_id = alerts.elder_id
        and family_links.family_user_id = auth.uid()
        and family_links.status = 'accepted'
        and coalesce((family_links.permissions->>'alerts')::boolean, false) = true
    )
  );

-- 長輩 / 家人可標記已處理（update resolved）
drop policy if exists "elder updates own alerts" on alerts;
create policy "elder updates own alerts"
  on alerts for update using (auth.uid() = elder_id);

drop policy if exists "family updates linked alerts" on alerts;
create policy "family updates linked alerts"
  on alerts for update using (
    exists (
      select 1 from family_links
      where family_links.owner_id = alerts.elder_id
        and family_links.family_user_id = auth.uid()
        and family_links.status = 'accepted'
        and coalesce((family_links.permissions->>'alerts')::boolean, false) = true
    )
  );

-- 注意：不開放一般用戶 INSERT。寫入只由 cron（service role）執行，繞過 RLS。
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
-- ────────────────────────────────────────────────
-- 個人化異常預警閾值（profiles.alert_thresholds）
-- 在 Supabase Dashboard → SQL Editor 執行
-- 空物件 = 使用系統預設；可依慢性病自動建議後再微調
-- ────────────────────────────────────────────────

alter table profiles
  add column if not exists alert_thresholds jsonb not null default '{}'::jsonb;

comment on column profiles.alert_thresholds is
  '異常預警閾值覆寫，例如 {"glucoseFastingHigh":200,"bpSystolicHigh":150}';

-- ────────────────────────────────────────────────
-- 驗證：四個表、source 約束、alert_thresholds 欄位
-- ────────────────────────────────────────────────
select
  to_regclass('public.smart_sparks') as smart_sparks,
  to_regclass('public.chapter_drafts') as chapter_drafts,
  to_regclass('public.alerts') as alerts,
  to_regclass('public.push_subscriptions') as push_subscriptions;

select pg_get_constraintdef(oid) as smart_sparks_source_check
from pg_constraint
where conname = 'smart_sparks_source_check';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'alert_thresholds';
