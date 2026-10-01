-- ────────────────────────────────────────────────
-- 出遊影片：語音留言（家人、長輩都可以錄一段話當留言）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）；需先跑過 add-travel-video-comments.sql
-- ────────────────────────────────────────────────

-- 1. 留言多一種：語音（travel-videos bucket 內的 m4a）
alter table travel_video_comments add column if not exists audio_path text;
alter table travel_video_comments add column if not exists audio_seconds numeric(5,2);

-- 按讚、文字、語音三選一
alter table travel_video_comments drop constraint if exists travel_video_comments_kind;
alter table travel_video_comments add constraint travel_video_comments_kind
  check (num_nonnulls(emoji, body, audio_path) = 1);

-- 2. Storage 允許放語音留言（m4a = audio/mp4）；原本沒限制格式的就不用改
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'audio/mp4')
where id = 'travel-videos'
  and allowed_mime_types is not null
  and not ('audio/mp4' = any(allowed_mime_types));
