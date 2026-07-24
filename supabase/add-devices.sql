-- ────────────────────────────────────────────────
-- 陪伴機器人（ESP32-S3）裝置表
-- 在 Supabase Dashboard → SQL Editor 貼上整段，按 Run
-- ────────────────────────────────────────────────

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null default '暖暖機器人',
  -- 裝置長期 token 的 SHA-256 雜湊（原始 token 只在配對成功時回傳一次，不存明文）
  token_hash text unique,
  -- 6 位數配對碼（App 產生、機器人輸入後換 token；配對成功即清空）
  pairing_code text,
  pairing_expires_at timestamptz,
  paired_at timestamptz,
  last_seen_at timestamptz,
  fw_version text,
  created_at timestamptz default now()
);

create index if not exists devices_user_idx on devices (user_id, created_at desc);
create unique index if not exists devices_pairing_code_idx
  on devices (pairing_code) where pairing_code is not null;

-- RLS：用戶只能看/改/刪自己的裝置。
-- 機器人本身不走 Supabase auth，改由伺服器 service_role + token_hash 驗證（見 src/lib/device-guard.ts）
alter table devices enable row level security;

create policy "users read own devices" on devices for select using (auth.uid() = user_id);
create policy "users insert own devices" on devices for insert with check (auth.uid() = user_id);
create policy "users update own devices" on devices for update using (auth.uid() = user_id);
create policy "users delete own devices" on devices for delete using (auth.uid() = user_id);
