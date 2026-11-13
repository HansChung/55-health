-- ────────────────────────────────────────────────
-- 記住每位會員「現在綁的那一份」Stripe 訂閱（可重複執行；需要 add-stripe-customer.sql、fix-privilege-escalation.sql 先跑過）
-- 用途：只有這一份訂閱結束才降級（升級／降級時舊的那份被取消，不會把正在付錢的人打回免費版）；
--      已經在訂閱的人再按方案 → 送去 Stripe 的訂閱管理頁改方案，不會多開一份重複扣款
-- ────────────────────────────────────────────────

alter table profiles
  add column if not exists stripe_subscription_id text;

create index if not exists profiles_stripe_subscription_idx
  on profiles (stripe_subscription_id);

-- 會員自己不能改這個欄位（和方案、管理員、Stripe 客戶一樣，只有伺服器能改）
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_admin := false;
      new.subscription_tier := 'free';
      new.subscription_expires_at := null;
      new.stripe_customer_id := null;
      new.stripe_subscription_id := null;
    else
      new.is_admin := old.is_admin;
      new.subscription_tier := old.subscription_tier;
      new.subscription_expires_at := old.subscription_expires_at;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
    end if;
  end if;
  return new;
end $$;
