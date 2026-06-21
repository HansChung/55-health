-- ────────────────────────────────────────────────
-- IoT 感測整合（LifeSmart 等環境偵測裝置）
-- 地基：與來源無關。先用模擬器，未來換成 LifeSmart adapter 即可。
-- 在 Supabase Dashboard → SQL Editor 執行
-- ────────────────────────────────────────────────

-- 1. 裝置
create table if not exists iot_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,  -- 長輩
  external_id text,                 -- 來源端的裝置 ID（如 LifeSmart device id）
  kind text not null check (kind in ('presence', 'bed', 'sos', 'env')),
  name text not null,
  room text,
  source text not null default 'mock' check (source in ('mock', 'lifesmart')),
  last_state jsonb default '{}',
  last_event_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists iot_devices_user_idx on iot_devices (user_id, created_at desc);

-- 2. 感測事件
create table if not exists iot_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  device_id uuid references iot_devices on delete set null,
  event_kind text not null check (event_kind in (
    'activity', 'fall', 'sos', 'leave_bed', 'in_bed', 'environment'
  )),
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  data jsonb default '{}',          -- 例如 {temp, humidity, aqi} 或 {duration_min}
  occurred_at timestamptz default now(),
  source text not null default 'mock',
  created_at timestamptz default now()
);

create index if not exists iot_events_user_idx on iot_events (user_id, occurred_at desc);

-- ────────────────────────────────────────────────
-- RLS：長輩本人 + 被授權家人可讀；寫入由服務端（service role）負責
-- ────────────────────────────────────────────────
alter table iot_devices enable row level security;
alter table iot_events enable row level security;

drop policy if exists "user reads own iot devices" on iot_devices;
create policy "user reads own iot devices" on iot_devices
  for select using (auth.uid() = user_id);

drop policy if exists "family reads iot devices" on iot_devices;
create policy "family reads iot devices" on iot_devices
  for select using (
    exists (select 1 from family_links f
      where f.owner_id = iot_devices.user_id and f.family_user_id = auth.uid()
        and f.status = 'accepted'
        and coalesce((f.permissions->>'alerts')::boolean, false) = true)
  );

drop policy if exists "user reads own iot events" on iot_events;
create policy "user reads own iot events" on iot_events
  for select using (auth.uid() = user_id);

drop policy if exists "family reads iot events" on iot_events;
create policy "family reads iot events" on iot_events
  for select using (
    exists (select 1 from family_links f
      where f.owner_id = iot_events.user_id and f.family_user_id = auth.uid()
        and f.status = 'accepted'
        and coalesce((f.permissions->>'alerts')::boolean, false) = true)
  );

-- ────────────────────────────────────────────────
-- 擴充 alerts.alert_type，讓 IoT 事件也能寫進既有警報系統
-- （這樣感測異常會出現在「守護紀錄」並通知家人，完全複用現有管線）
-- ────────────────────────────────────────────────
alter table alerts drop constraint if exists alerts_alert_type_check;
alter table alerts add constraint alerts_alert_type_check check (alert_type in (
  'inactivity', 'blood_pressure', 'blood_glucose', 'weight_change', 'missed_medication',
  'fall', 'sos', 'leave_bed', 'environment'
));
