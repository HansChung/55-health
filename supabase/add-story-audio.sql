-- ────────────────────────────────────────────────
-- 我的故事集：聲音故事（長輩在 App 裡錄，或上傳手機裡的錄音檔，像自己的 podcast）
-- 需要先跑過 add-life-stories.sql
-- 錄音放私人 bucket story-audio：瀏覽器用伺服器給的簽名網址直接上傳到 {user}/pending/，
-- 存故事時伺服器搬到 {user}/{story}/audio.*（App 裡錄的 webm 先轉成 m4a，iPhone 才放得出來）；
-- 沒存成故事的暫存檔，每天的清理排程刪掉（stale_story_audio）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

-- 聲音：{ "path": "{user}/{story}/audio.m4a", "seconds": 192, "mime": "audio/mp4", "bytes": 1534000 }
alter table life_stories add column if not exists audio jsonb;

-- 有聲音的故事可以不寫文字（原本內容至少 1 個字）
alter table life_stories drop constraint if exists life_stories_body_check;
alter table life_stories add constraint life_stories_body_check check (char_length(body) <= 3000);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'life_stories_body_or_audio') then
    alter table life_stories add constraint life_stories_body_or_audio check (char_length(body) > 0 or audio is not null);
  end if;
end $$;

-- 錄音：私人 bucket（網址由伺服器簽發，1 小時有效）；單檔 50MB（Supabase 免費方案上限）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-audio', 'story-audio', false, 52428800,
  array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/webm', 'audio/ogg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 沒存成故事、超過一天的暫存錄音（每天的清理排程用）
create or replace function public.stale_story_audio(max_rows int default 1000)
returns setof text
language sql
security definer
set search_path = storage, public
as $$
  select name from storage.objects
  where bucket_id = 'story-audio'
    and name like '%/pending/%'
    and created_at < now() - interval '1 day'
  order by created_at
  limit max_rows;
$$;

-- 今天已經拿過幾次上傳網址（防止一直上傳大檔案塞滿空間）
create or replace function public.story_audio_uploads_today(p_user uuid)
returns int
language sql
security definer
set search_path = storage, public
as $$
  select count(*)::int from storage.objects
  where bucket_id = 'story-audio'
    and name like p_user::text || '/%'
    and created_at > now() - interval '1 day';
$$;

revoke all on function public.stale_story_audio(int) from public, anon, authenticated;
revoke all on function public.story_audio_uploads_today(uuid) from public, anon, authenticated;
grant execute on function public.stale_story_audio(int) to service_role;
grant execute on function public.story_audio_uploads_today(uuid) to service_role;
