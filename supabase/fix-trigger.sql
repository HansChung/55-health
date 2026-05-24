-- ────────────────────────────────────────────────
-- 修正：新用戶註冊時無法自動建立 profile
-- 原因：RLS + trigger 權限衝突
-- ────────────────────────────────────────────────

-- 1. 移除舊的 trigger 與 function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user() cascade;
drop function if exists public.handle_new_user() cascade;

-- 2. 重建 function（指定 search_path 並用 SECURITY DEFINER 繞過 RLS）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
exception
  -- 即使 profile 建立失敗也不要擋住用戶註冊
  when others then
    raise warning 'handle_new_user failed: %', sqlerrm;
    return new;
end;
$$;

-- 3. 給 function 必要權限
grant execute on function public.handle_new_user() to postgres, service_role, authenticated, anon;

-- 4. 重新掛上 trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. 補一條 INSERT 政策：允許 trigger（service_role）寫入 profiles
drop policy if exists "service role insert profiles" on public.profiles;
create policy "service role insert profiles"
  on public.profiles for insert
  to service_role
  with check (true);
