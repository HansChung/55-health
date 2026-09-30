-- ────────────────────────────────────────────────
-- 研學團「出發當天」：報到名單、行前提醒、集合廣播
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）；需先跑過 add-study-tours.sql
-- ────────────────────────────────────────────────

-- 1. 報名：報到時間（第一次掃碼蓋章自動記；沒手機的長輩由領隊在後台按報到）
--    與行前提醒寄過了沒（每種提醒每人只推一次，排程重跑也不會重複）
alter table study_tour_registrations add column if not exists checked_in_at timestamptz;
alter table study_tour_registrations add column if not exists reminded_day_before_at timestamptz;
alter table study_tour_registrations add column if not exists reminded_same_day_at timestamptz;

-- 2. 蓋章時自動報到（用 trigger，不必改蓋章函式）
create or replace function study_tour_stamp_checkin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update study_tour_registrations
     set checked_in_at = coalesce(checked_in_at, new.stamped_at),
         updated_at = now()
   where tour_id = new.tour_id
     and user_id = new.user_id
     and status <> 'cancelled'
     and checked_in_at is null;
  return new;
end;
$$;

drop trigger if exists study_tour_stamps_checkin on study_tour_stamps;
create trigger study_tour_stamps_checkin
  after insert on study_tour_stamps
  for each row execute function study_tour_stamp_checkin();

-- 已經蓋過章的舊資料補上報到時間
update study_tour_registrations r
   set checked_in_at = s.first_stamp
  from (
    select tour_id, user_id, min(stamped_at) as first_stamp
      from study_tour_stamps
     group by tour_id, user_id
  ) s
 where r.tour_id = s.tour_id
   and r.user_id = s.user_id
   and r.status <> 'cancelled'
   and r.checked_in_at is null;

revoke all on function study_tour_stamp_checkin() from public, anon, authenticated;

-- 3. 集合廣播紀錄（後台按一下推播全團；長輩的活動頁也看得到，沒開推播的人不會漏掉）
create table if not exists study_tour_broadcasts (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references study_tours on delete cascade,
  message text not null check (char_length(message) between 1 and 120),
  sent_by uuid references auth.users on delete set null,
  recipients int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists study_tour_broadcasts_tour on study_tour_broadcasts (tour_id, created_at desc);

-- 只給伺服器讀寫（長輩透過 /api/study-tours 拿自己報名那團的廣播）
alter table study_tour_broadcasts enable row level security;
grant all on study_tour_broadcasts to service_role;
