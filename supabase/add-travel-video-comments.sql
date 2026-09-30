-- ────────────────────────────────────────────────
-- 出遊影片：家人按讚、留言（長輩也可以回覆）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）；需先跑過 add-travel-videos.sql
-- 誰看得到：影片本人＋已接受的家人（family_links.permissions.videos 沒關掉；預設看得到）
-- ────────────────────────────────────────────────

create table if not exists travel_video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references travel_videos on delete cascade,
  author_id uuid not null references auth.users on delete cascade,
  -- 按讚（表情）或留言（文字），二選一
  emoji text check (emoji in ('❤️', '👍', '😂', '🥹', '👏')),
  body text check (char_length(body) between 1 and 100),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint travel_video_comments_kind check ((emoji is null) <> (body is null))
);

create index if not exists travel_video_comments_video on travel_video_comments (video_id, created_at);

-- 同一個人對同一支影片，同一種表情只算一次（再按一次＝收回）
create unique index if not exists travel_video_comments_one_reaction
  on travel_video_comments (video_id, author_id, emoji)
  where emoji is not null and deleted_at is null;

-- 只給伺服器讀寫（API 會先檢查是不是本人或看得到影片的家人）
alter table travel_video_comments enable row level security;
grant all on travel_video_comments to service_role;
