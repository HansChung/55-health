-- ────────────────────────────────────────────────
-- 權限補強（2026-10-24 掃描發現；正式環境已在 10-27 跑過，可重複執行）
-- 1. profiles：方案、管理員、Stripe 欄位只有伺服器（service_role）能改；會員改了會被還原
--    （"users update own profile" 沒限欄位 → 任何人能用公開的 anon key ＋自己的登入憑證把自己改成專業版或管理員）
-- 2. meal-photos：拿掉「誰都能列出檔案」的規則；公開網址照樣能看（餐點、藥袋照片不能再被整批列出下載）
-- 3. api_configs、subscription_plans：開 RLS、不給任何使用者規則（只有伺服器讀寫）
-- 4. family_links：使用者只能建立「等待中、還沒有家人」的邀請；接受邀請由 /api/family/accept 用 service role 做
-- 需要 add-stripe-customer.sql 先跑過（觸發器會用到 stripe_customer_id）
-- ────────────────────────────────────────────────

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_admin := false;
      new.subscription_tier := 'free';
      new.subscription_expires_at := null;
      new.stripe_customer_id := null;
    else
      new.is_admin := old.is_admin;
      new.subscription_tier := old.subscription_tier;
      new.subscription_expires_at := old.subscription_expires_at;
      new.stripe_customer_id := old.stripe_customer_id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

drop policy if exists "public read meal photos" on storage.objects;

alter table public.api_configs enable row level security;
alter table public.subscription_plans enable row level security;

drop policy if exists "users insert own family" on public.family_links;
create policy "users insert own family" on public.family_links for insert
  with check (auth.uid() = owner_id and family_user_id is null and status = 'pending');
