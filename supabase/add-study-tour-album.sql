-- ────────────────────────────────────────────────
-- 研學團共享相簿：同一團的人一起放照片，結束後一鍵做成全團遊記影片
-- 需要先跑過 add-study-tours.sql、add-travel-video-yearly.sql
-- 照片放私人 bucket study-tour-photos（網址由伺服器簽發）；只有這一團的參加者（和幫他報名的家人）看得到
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists study_tour_photos (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references study_tours on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  path text not null,
  width int not null default 0,
  height int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists study_tour_photos_tour on study_tour_photos (tour_id, created_at) where deleted_at is null;
create index if not exists study_tour_photos_user on study_tour_photos (tour_id, user_id) where deleted_at is null;
-- 只給伺服器讀寫（照片網址要先檢查是不是同一團）
alter table study_tour_photos enable row level security;
grant all on study_tour_photos to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-tour-photos', 'study-tour-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- 全團遊記影片（kind = 'tour'，和年度回憶影片同一套剪輯）
alter table travel_videos drop constraint if exists travel_videos_kind_check;
alter table travel_videos add constraint travel_videos_kind_check check (kind in ('single', 'montage', 'mv', 'yearly', 'tour'));
