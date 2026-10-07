-- ────────────────────────────────────────────────
-- 照片直傳 Supabase（不經過 Vercel）：私人暫存區 user-uploads
-- 手機只能把照片傳到自己的資料夾 {user id}/…；讀取、搬移、刪除都由伺服器（service role）做
-- 超過一天的檔案由 /api/cron/cleanup-uploads 每天清掉
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-uploads', 'user-uploads', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 這個人過去一天傳了幾張（直傳不經過 API 的流量限制，所以在這裡限量；只算自己的）
create or replace function public.user_uploads_today()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from storage.objects
  where bucket_id = 'user-uploads'
    and name like auth.uid()::text || '/%'
    and created_at > now() - interval '1 day';
$$;

revoke all on function public.user_uploads_today() from public, anon;
grant execute on function public.user_uploads_today() to authenticated, service_role;

-- 只准登入的人傳到自己的資料夾、每天最多 300 張（不給讀、不給刪：照片只給伺服器看）
drop policy if exists "user uploads: insert own folder" on storage.objects;
create policy "user uploads: insert own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.user_uploads_today() < 300
  );

-- 列出超過一天的暫存照片（給清理用；只有 service role 能呼叫）
create or replace function public.stale_user_uploads(max_rows int default 1000)
returns setof text
language sql
security definer
set search_path = ''
as $$
  select name from storage.objects
  where bucket_id = 'user-uploads' and created_at < now() - interval '1 day'
  order by created_at
  limit greatest(1, least(max_rows, 5000));
$$;

revoke all on function public.stale_user_uploads(int) from public, anon, authenticated;
grant execute on function public.stale_user_uploads(int) to service_role;
