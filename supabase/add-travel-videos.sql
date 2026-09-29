-- ────────────────────────────────────────────────
-- 出遊回憶影片（邁笙 lk888 平台 × MiniMax 海螺 H3 圖轉影片，10 秒）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- 需搭配 Vercel 環境變數 LK888_API_KEY
-- ────────────────────────────────────────────────

-- 1. ai_usage 允許新服務 minimax_video（admin 用量／成本統計）
alter table ai_usage drop constraint if exists ai_usage_service_check;
alter table ai_usage add constraint ai_usage_service_check
  check (service in ('gemini_vision', 'gemini_text', 'openai_realtime', 'openai_chat', 'minimax_video'));

-- 2. 各方案每月可做幾支影片（邁笙 minimax-h3 768P：一支 10 秒 ≈ 0.95 算力）
alter table subscription_plans add column if not exists ai_video_quota int;
update subscription_plans set ai_video_quota = 0 where id = 'free'  and ai_video_quota is null;
update subscription_plans set ai_video_quota = 2 where id = 'basic' and ai_video_quota is null;
update subscription_plans set ai_video_quota = 6 where id = 'pro'   and ai_video_quota is null;

-- 3. 影片任務
create table if not exists travel_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  style text not null,
  place text,
  prompt text not null,
  model text not null,
  task_id text,                 -- 影片平台（lk888）task_id
  photo_path text,              -- travel-videos bucket 內路徑
  video_path text,
  error_message text,           -- 只給管理員看，不回傳前端
  cost_usd numeric(10,6),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,
  deleted_at timestamptz        -- 軟刪除：保留列才能正確計算配額
);

create index if not exists travel_videos_user_idx
  on travel_videos (user_id, created_at desc);

-- 平台完成回呼用 task_id 找影片
create index if not exists travel_videos_task_idx
  on travel_videos (task_id);

alter table travel_videos enable row level security;

-- 使用者只能讀自己的；新增／更新／刪除一律走伺服器（service role）
drop policy if exists "users read own travel videos" on travel_videos;
create policy "users read own travel videos"
  on travel_videos for select using (auth.uid() = user_id);

grant select on travel_videos to authenticated;
grant all on travel_videos to service_role;

-- 4. Storage bucket（公開讀取，路徑含隨機 UUID；上傳／刪除只由伺服器做）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'travel-videos',
  'travel-videos',
  true,
  52428800,                      -- 50 MB
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
