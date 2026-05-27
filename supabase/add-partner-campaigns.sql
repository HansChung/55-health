-- 合作活動推薦：以健康友善活動/廣告為主，並記錄曝光與點擊成效
create table if not exists partner_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  partner_name text not null,
  cta_label text default '了解更多',
  cta_url text,
  image_url text,
  tags text[] default '{}',
  priority int default 0,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  active boolean default true,
  disclaimer text default '合作活動資訊，非醫療建議，請自行評估。',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists partner_campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references partner_campaigns on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  event_type text not null check (event_type in ('impression', 'click')),
  created_at timestamptz default now()
);

create index if not exists partner_campaigns_active_idx
  on partner_campaigns (active, priority desc, starts_at desc);
create index if not exists partner_campaign_events_campaign_idx
  on partner_campaign_events (campaign_id, event_type, created_at desc);

alter table partner_campaigns enable row level security;
alter table partner_campaign_events enable row level security;

drop policy if exists "anyone read active partner campaigns" on partner_campaigns;
create policy "anyone read active partner campaigns" on partner_campaigns
  for select using (
    active = true
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "users insert partner campaign events" on partner_campaign_events;
create policy "users insert partner campaign events" on partner_campaign_events
  for insert with check (auth.uid() = user_id or user_id is null);
