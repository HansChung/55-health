-- ────────────────────────────────────────────────
-- 新增 profiles.stripe_customer_id 欄位
-- 用途：Stripe 退訂 webhook 可用 customer id 直接對應用戶，
--      不必再用 email + listUsers(1000) 比對（用戶量大會漏降級）。
-- 在 Supabase SQL Editor 貼上整段，按 Run。
-- ────────────────────────────────────────────────

alter table profiles
  add column if not exists stripe_customer_id text;

create index if not exists profiles_stripe_customer_idx
  on profiles (stripe_customer_id);
