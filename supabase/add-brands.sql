-- ────────────────────────────────────────────────
-- 白標模式（White-label）
-- 一個合作夥伴 = 一筆 brand + 一個網域，不用重新部署即可換品牌
-- 在 Supabase Dashboard → SQL Editor 執行
-- ────────────────────────────────────────────────

create table if not exists brands (
  id text primary key,                       -- slug，例如 'default'、'xyz-pharmacy'
  host text unique,                          -- 對應網域，例如 'health.xyz.com'
  app_name text not null default '暖暖',
  tagline text default '陪 55+ 健康變老',
  primary_color text not null default '#E8845A',
  primary_deep text not null default '#C95E36',
  primary_soft text not null default '#FBE6D4',
  logo_emoji text default '🐻',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 預設品牌（暖暖本尊）
insert into brands (id, host, app_name, tagline)
values ('default', 'nuan55.com', '暖暖', '陪 55+ 健康變老的 AI 管家')
on conflict (id) do nothing;

-- 任何人都能讀「啟用中」的品牌（網站載入時解析）
alter table brands enable row level security;

drop policy if exists "anyone reads active brands" on brands;
create policy "anyone reads active brands"
  on brands for select using (active = true);

-- 寫入只由管理員（service role）處理，不開放一般用戶
