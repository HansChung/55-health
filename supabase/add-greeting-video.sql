-- ────────────────────────────────────────────────
-- 節日、生日祝福影片（kind = 'greeting'，和年度回憶影片同一套剪輯，狀態放在 yearly 欄位）
-- 需要先跑過 add-travel-video-yearly.sql、add-study-tour-album.sql
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

alter table travel_videos drop constraint if exists travel_videos_kind_check;
alter table travel_videos add constraint travel_videos_kind_check check (kind in ('single', 'montage', 'mv', 'yearly', 'tour', 'greeting'));
