-- ────────────────────────────────────────────────
-- 數位名片：每人一張（名字、稱呼、大頭照、一句自我介紹、興趣、聯絡方式、精選作品）
-- 分享頁 /c/<slug>：長輩按「開始分享」（is_public）才看得到；slug 是隨機的，「換新連結」會換掉
-- 聯絡方式預設都不公開（show_* = false），長輩一項一項打開
-- 只由伺服器（service role）讀寫：沒有任何給 client 的 policy
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists business_cards (
  user_id uuid primary key references auth.users on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]{10,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 20),
  nickname text not null default '' check (char_length(nickname) <= 20),
  intro text not null default '' check (char_length(intro) <= 100),
  interests text not null default '' check (char_length(interests) <= 60),
  -- 大頭照：公開 bucket business-cards 裡的 {user}/{uuid}.jpg（路徑隨機，換照片就刪舊的）
  photo_path text,
  phone text not null default '' check (char_length(phone) <= 20),
  line_id text not null default '' check (char_length(line_id) <= 80),
  email text not null default '' check (char_length(email) <= 80),
  show_phone boolean not null default false,
  show_line boolean not null default false,
  show_email boolean not null default false,
  -- 精選作品（最多 3 件）：[{ "kind": "video" | "story", "id": "<uuid>" }]，顯示時再確認還在、還是本人的
  works jsonb not null default '[]'::jsonb check (jsonb_typeof(works) = 'array' and jsonb_array_length(works) <= 3),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table business_cards enable row level security;
grant all on business_cards to service_role;

-- 大頭照（公開讀取，給分享頁和 LINE 預覽用；上傳／刪除只由伺服器做，不加 select policy＝不能列出檔案）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-cards', 'business-cards', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
