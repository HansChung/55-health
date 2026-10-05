-- ────────────────────────────────────────────────
-- 出遊影片「家人看過了」：家人播放過長輩的影片就記一筆（每人每支一筆，記最後一次）
-- 只在長輩自己的畫面顯示，不推播。只有伺服器（service role）讀寫，沒有給前端的 policy
-- ────────────────────────────────────────────────
create table if not exists travel_video_views (
  video_id uuid not null references travel_videos(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key (video_id, viewer_id)
);

alter table travel_video_views enable row level security;

grant all on travel_video_views to service_role;
