-- ────────────────────────────────────────────────
-- 年度回憶影片（kind = 'yearly'）：一整年的遊記、出遊影片、故事集照片串成一支，伺服器自己剪，不花算力
-- 需要先跑過 add-travel-videos.sql、add-travel-video-montage.sql、add-travel-video-mv.sql
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

alter table travel_videos drop constraint if exists travel_videos_kind_check;
alter table travel_videos add constraint travel_videos_kind_check check (kind in ('single', 'montage', 'mv', 'yearly'));

-- 年度、標題、配樂、照片（複製到 {user}/{video}/photo-N.jpg）、每一段的片段
alter table travel_videos add column if not exists yearly jsonb;
