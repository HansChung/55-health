-- ────────────────────────────────────────────────
-- 多張照片遊記影片（3～5 張照片慢慢移動＋每張一句 AI 配音＋字幕，全部用 ffmpeg 在自己的伺服器做）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）；需先跑過
-- add-travel-videos.sql、add-travel-video-narration.sql
-- ────────────────────────────────────────────────

-- 1. 影片種類：single＝一張照片（AI 影片平台）、montage＝多張照片遊記
alter table travel_videos add column if not exists kind text not null default 'single';
alter table travel_videos drop constraint if exists travel_videos_kind_check;
alter table travel_videos add constraint travel_videos_kind_check check (kind in ('single', 'montage'));

-- 2. 遊記的製作進度（每張照片的路徑、那句話、配音、片段）
alter table travel_videos add column if not exists montage jsonb;

-- 3. 處理中的「租約」：同一支遊記同時只讓一個請求處理（畫面輪詢可能同時進來兩個）
alter table travel_videos add column if not exists lease_until timestamptz;

-- 4. 每人「每種」影片同時只能做一支（做遊記時不會被還在做的單張影片擋住）
drop index if exists travel_videos_one_pending_per_user;
create unique index if not exists travel_videos_one_pending_per_user_kind
  on travel_videos (user_id, kind)
  where status in ('queued', 'running') and deleted_at is null;
