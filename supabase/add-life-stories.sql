-- ────────────────────────────────────────────────
-- 我的故事集：長輩把人生故事說給暖暖聽（暖暖一題一題問），整理成一篇篇文章，可配照片、印成小書
-- 每篇自己決定給不給家人看（預設給）；家人可以按讚、留言
-- 只有伺服器（service role）讀寫，沒有給前端的 policy
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists life_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  -- 年代或時間（例如「民國 60 年代」「我 20 歲那年」），可空
  era text check (era is null or char_length(era) <= 30),
  body text not null check (char_length(body) between 1 and 3000),
  -- 照片（最多 3 張）：[{ "path": "{user}/{story}/photo-0.jpg", "width": 1280, "height": 960 }]，放在私人 bucket life-stories
  photos jsonb not null default '[]'::jsonb,
  -- 和暖暖的問答（留著，之後想重寫還找得到原話）
  interview jsonb not null default '[]'::jsonb,
  share_with_family boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists life_stories_user on life_stories (user_id, created_at desc) where deleted_at is null;

alter table life_stories enable row level security;
grant all on life_stories to service_role;

-- 家人的按讚、留言（和出遊影片一樣：表情或文字二選一）
create table if not exists life_story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references life_stories on delete cascade,
  author_id uuid not null references auth.users on delete cascade,
  emoji text check (emoji in ('❤️', '👍', '😂', '🥹', '👏')),
  body text check (char_length(body) between 1 and 100),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint life_story_comments_kind check ((emoji is null) <> (body is null))
);

create index if not exists life_story_comments_story on life_story_comments (story_id, created_at);
create unique index if not exists life_story_comments_one_reaction
  on life_story_comments (story_id, author_id, emoji)
  where emoji is not null and deleted_at is null;

alter table life_story_comments enable row level security;
grant all on life_story_comments to service_role;

-- 故事的照片：私人 bucket（網址由伺服器簽發，1 小時有效）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('life-stories', 'life-stories', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
