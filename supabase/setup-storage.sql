-- 建立餐點照片 Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  true,                          -- 公開讀取（用 URL 直接顯示）
  5242880,                       -- 5 MB 上限
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- RLS 政策：用戶只能上傳/讀/刪自己的照片
drop policy if exists "users upload own meal photos" on storage.objects;
create policy "users upload own meal photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users read own meal photos" on storage.objects;
create policy "users read own meal photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public read meal photos" on storage.objects;
create policy "public read meal photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'meal-photos');

drop policy if exists "users delete own meal photos" on storage.objects;
create policy "users delete own meal photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
