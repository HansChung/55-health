-- ────────────────────────────────────────────────
-- 研學團（第一階段）：活動、站點（QR 集章）、報名（名額＋候補）、集章
--
-- 設計：
--   - 所有讀寫都走伺服器 API（service role）；前端不能直接讀 study_tours / study_tour_stops，
--     因為站點的 stamp_token（印在 QR Code 上）必須保密，否則在家就能蓋章。
--   - 報名、取消、蓋章都用下面的 SQL 函式，在「鎖住該活動」的交易裡完成，
--     兩個人同時搶最後一個名額也不會超賣。
--   - 候補遞補：依報名先後，能放得下的就轉正取（一組 4 人放不下時，後面 1 人的可以先補上）。
--   - 不收費：費用只是文字（fee_text），由旅行社另外收。
--
-- 可重複執行。
-- ────────────────────────────────────────────────

create table if not exists study_tours (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  description text not null default '',
  organizer_name text not null default '',
  cover_image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meeting_point text not null default '',
  fee_text text not null default '',
  capacity int not null default 20 check (capacity between 1 and 500),
  -- 走路量：1＝輕鬆（少走路）、2＝適中、3＝較多
  walking_level smallint not null default 1 check (walking_level between 1 and 3),
  accessibility_note text not null default '',
  contact_phone text not null default '',
  registration_deadline timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_tours_time_order check (ends_at >= starts_at)
);

create index if not exists study_tours_status_starts on study_tours (status, starts_at);

create table if not exists study_tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references study_tours on delete cascade,
  position int not null default 0,
  name text not null,
  description text not null default '',
  -- 蓋章後才給長輩看的小知識
  fun_fact text not null default '',
  stamp_emoji text not null default '🏮',
  -- 印在 QR Code 上的隨機代碼（伺服器產生）；外洩時後台可以換一組
  stamp_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists study_tour_stops_tour on study_tour_stops (tour_id, position);

create table if not exists study_tour_registrations (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references study_tours on delete cascade,
  -- 參加的人（集章記在這個帳號）
  user_id uuid not null references auth.users on delete cascade,
  -- 誰按的報名（家人幫長輩報名時是家人的帳號）
  registered_by uuid references auth.users on delete set null,
  participant_name text not null,
  participant_phone text not null default '',
  -- 含本人的人數（本人＋同行家人）
  party_size smallint not null default 1 check (party_size between 1 and 4),
  note text not null default '',
  status text not null check (status in ('confirmed', 'waitlisted', 'cancelled')),
  -- app＝事先報名；onsite＝當天沒報名、掃 QR 時自動補登記
  source text not null default 'app' check (source in ('app', 'onsite')),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 同一個人同一團只能有一筆「有效」報名（取消後可以再報）
create unique index if not exists study_tour_registrations_one_active
  on study_tour_registrations (tour_id, user_id) where status <> 'cancelled';
create index if not exists study_tour_registrations_tour_status
  on study_tour_registrations (tour_id, status, created_at);
create index if not exists study_tour_registrations_user
  on study_tour_registrations (user_id, created_at desc);
create index if not exists study_tour_registrations_registered_by
  on study_tour_registrations (registered_by, created_at desc);

create table if not exists study_tour_stamps (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references study_tours on delete cascade,
  stop_id uuid not null references study_tour_stops on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  stamped_at timestamptz not null default now(),
  unique (stop_id, user_id)
);

create index if not exists study_tour_stamps_user_tour on study_tour_stamps (user_id, tour_id);

-- ── RLS：活動與站點只給伺服器讀；報名與集章本人可讀（成就統計用） ──
alter table study_tours enable row level security;
alter table study_tour_stops enable row level security;
alter table study_tour_registrations enable row level security;
alter table study_tour_stamps enable row level security;

drop policy if exists "users read own study tour registrations" on study_tour_registrations;
create policy "users read own study tour registrations"
  on study_tour_registrations for select using (auth.uid() = user_id);

drop policy if exists "users read own study tour stamps" on study_tour_stamps;
create policy "users read own study tour stamps"
  on study_tour_stamps for select using (auth.uid() = user_id);

grant select on study_tour_registrations to authenticated;
grant select on study_tour_stamps to authenticated;
grant all on study_tours, study_tour_stops, study_tour_registrations, study_tour_stamps to service_role;

-- ── 候補遞補：依報名先後，放得下就轉正取；回傳這次轉正的報名 id ──
-- 呼叫前要先鎖住活動（下面的函式都會先 select ... for update）
create or replace function study_tour_promote_waitlist(p_tour_id uuid)
returns setof uuid
language plpgsql
set search_path = public
as $$
declare
  v_capacity int;
  v_used int;
  w record;
begin
  select capacity into v_capacity from study_tours where id = p_tour_id;
  if not found then
    return;
  end if;

  select coalesce(sum(party_size), 0) into v_used
    from study_tour_registrations
   where tour_id = p_tour_id and status = 'confirmed';

  for w in
    select id, party_size
      from study_tour_registrations
     where tour_id = p_tour_id and status = 'waitlisted'
     order by created_at, id
  loop
    exit when v_used >= v_capacity;
    if v_used + w.party_size <= v_capacity then
      update study_tour_registrations
         set status = 'confirmed', updated_at = now()
       where id = w.id;
      v_used := v_used + w.party_size;
      return next w.id;
    end if;
  end loop;
end;
$$;

-- ── 報名：先排進候補，再跑一次遞補 → 有位子就直接正取，沒位子就候補 ──
-- 錯誤訊息（前端依此顯示中文）：tour_not_found / tour_not_open / registration_closed / already_registered
create or replace function study_tour_register(
  p_tour_id uuid,
  p_user_id uuid,
  p_registered_by uuid,
  p_participant_name text,
  p_participant_phone text,
  p_party_size int,
  p_note text
)
returns study_tour_registrations
language plpgsql
set search_path = public
as $$
declare
  v_tour study_tours;
  v_reg study_tour_registrations;
begin
  select * into v_tour from study_tours where id = p_tour_id for update;
  if not found then
    raise exception 'tour_not_found';
  end if;
  if v_tour.status <> 'published' then
    raise exception 'tour_not_open';
  end if;
  if now() > coalesce(v_tour.registration_deadline, v_tour.starts_at) then
    raise exception 'registration_closed';
  end if;
  if exists (
    select 1 from study_tour_registrations
     where tour_id = p_tour_id and user_id = p_user_id and status <> 'cancelled'
  ) then
    raise exception 'already_registered';
  end if;

  insert into study_tour_registrations (
    tour_id, user_id, registered_by, participant_name, participant_phone,
    party_size, note, status, source
  ) values (
    p_tour_id, p_user_id, p_registered_by, p_participant_name, coalesce(p_participant_phone, ''),
    p_party_size, coalesce(p_note, ''), 'waitlisted', 'app'
  )
  returning * into v_reg;

  perform study_tour_promote_waitlist(p_tour_id);

  select * into v_reg from study_tour_registrations where id = v_reg.id;
  return v_reg;
end;
$$;

-- ── 取消：標記取消後遞補候補；回傳被遞補的報名 id（伺服器拿去發推播） ──
-- 權限（本人／幫忙報名的家人／管理員）由 API 先檢查
create or replace function study_tour_cancel(p_registration_id uuid)
returns setof uuid
language plpgsql
set search_path = public
as $$
declare
  v_reg study_tour_registrations;
begin
  select * into v_reg from study_tour_registrations where id = p_registration_id;
  if not found then
    raise exception 'registration_not_found';
  end if;

  -- 先鎖活動，再重讀報名，避免和同時進行的報名／取消互相踩到
  perform 1 from study_tours where id = v_reg.tour_id for update;
  select * into v_reg from study_tour_registrations where id = p_registration_id;
  if v_reg.status = 'cancelled' then
    return;
  end if;

  update study_tour_registrations
     set status = 'cancelled', cancelled_at = now(), updated_at = now()
   where id = p_registration_id;

  return query select * from study_tour_promote_waitlist(v_reg.tour_id);
end;
$$;

-- ── 後台改了名額：鎖住活動後遞補（名額變多時候補的人自動轉正） ──
create or replace function study_tour_refill(p_tour_id uuid)
returns setof uuid
language plpgsql
set search_path = public
as $$
begin
  perform 1 from study_tours where id = p_tour_id for update;
  return query select * from study_tour_promote_waitlist(p_tour_id);
end;
$$;

-- ── 掃 QR 蓋章 ──
-- 規則：
--   - 活動要是「已發布」，而且在「出發前 3 小時～結束後 12 小時」內（管理員測試可略過時間）
--   - 沒報名的人當天掃碼 → 自動補一筆 onsite 報名（人都到了）；候補中的人掃碼 → 轉正取
--   - 同一站重複掃不會重複蓋章
--   - 集滿所有站 → 記下 completed_at（結業）
-- 錯誤訊息：invalid_token / tour_not_open / stamp_too_early / stamp_too_late
create or replace function study_tour_stamp(
  p_token text,
  p_user_id uuid,
  p_participant_name text,
  p_ignore_window boolean default false
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_stop study_tour_stops;
  v_tour study_tours;
  v_reg study_tour_registrations;
  v_stamp_id uuid;
  v_stamped int;
  v_total int;
  v_just_completed boolean := false;
begin
  select * into v_stop from study_tour_stops where stamp_token = p_token;
  if not found then
    raise exception 'invalid_token';
  end if;

  select * into v_tour from study_tours where id = v_stop.tour_id for update;
  if v_tour.status <> 'published' then
    raise exception 'tour_not_open';
  end if;
  if not coalesce(p_ignore_window, false) then
    if now() < v_tour.starts_at - interval '3 hours' then
      raise exception 'stamp_too_early';
    end if;
    if now() > v_tour.ends_at + interval '12 hours' then
      raise exception 'stamp_too_late';
    end if;
  end if;

  select * into v_reg
    from study_tour_registrations
   where tour_id = v_tour.id and user_id = p_user_id and status <> 'cancelled';

  if not found then
    insert into study_tour_registrations (
      tour_id, user_id, registered_by, participant_name, party_size, status, source
    ) values (
      v_tour.id, p_user_id, p_user_id, coalesce(nullif(trim(p_participant_name), ''), '暖暖會員'), 1, 'confirmed', 'onsite'
    )
    returning * into v_reg;
  elsif v_reg.status = 'waitlisted' then
    update study_tour_registrations
       set status = 'confirmed', updated_at = now()
     where id = v_reg.id
    returning * into v_reg;
  end if;

  insert into study_tour_stamps (tour_id, stop_id, user_id)
  values (v_tour.id, v_stop.id, p_user_id)
  on conflict (stop_id, user_id) do nothing
  returning id into v_stamp_id;

  select count(*) into v_total from study_tour_stops where tour_id = v_tour.id;
  select count(*) into v_stamped
    from study_tour_stamps s
    join study_tour_stops st on st.id = s.stop_id
   where s.tour_id = v_tour.id and s.user_id = p_user_id;

  if v_stamped >= v_total and v_reg.completed_at is null then
    update study_tour_registrations
       set completed_at = now(), updated_at = now()
     where id = v_reg.id
    returning * into v_reg;
    v_just_completed := true;
  end if;

  return jsonb_build_object(
    'tour_id', v_tour.id,
    'stop_id', v_stop.id,
    'registration_id', v_reg.id,
    'newly_stamped', v_stamp_id is not null,
    'stamped_count', v_stamped,
    'total_stops', v_total,
    'completed', v_reg.completed_at is not null,
    'just_completed', v_just_completed
  );
end;
$$;

-- ── 後台新增／刪除站點後：重新判斷誰「集滿」 ──
-- 加了新站 → 原本結業的人要補蓋新站才算；刪了站 → 剩下的都蓋過的人自動結業
create or replace function study_tour_sync_completion(p_tour_id uuid)
returns int
language plpgsql
set search_path = public
as $$
declare
  v_total int;
  v_changed int := 0;
  v_n int;
begin
  perform 1 from study_tours where id = p_tour_id for update;
  select count(*) into v_total from study_tour_stops where tour_id = p_tour_id;

  update study_tour_registrations r
     set completed_at = null, updated_at = now()
   where r.tour_id = p_tour_id
     and r.completed_at is not null
     and (
       v_total = 0
       or (select count(*) from study_tour_stamps s where s.tour_id = p_tour_id and s.user_id = r.user_id) < v_total
     );
  get diagnostics v_n = row_count;
  v_changed := v_changed + v_n;

  update study_tour_registrations r
     set completed_at = now(), updated_at = now()
   where r.tour_id = p_tour_id
     and r.completed_at is null
     and r.status <> 'cancelled'
     and v_total > 0
     and (select count(*) from study_tour_stamps s where s.tour_id = p_tour_id and s.user_id = r.user_id) >= v_total;
  get diagnostics v_n = row_count;
  v_changed := v_changed + v_n;

  return v_changed;
end;
$$;

-- 只給伺服器（service role）呼叫
revoke all on function study_tour_promote_waitlist(uuid) from public, anon, authenticated;
revoke all on function study_tour_register(uuid, uuid, uuid, text, text, int, text) from public, anon, authenticated;
revoke all on function study_tour_cancel(uuid) from public, anon, authenticated;
revoke all on function study_tour_refill(uuid) from public, anon, authenticated;
revoke all on function study_tour_stamp(text, uuid, text, boolean) from public, anon, authenticated;
revoke all on function study_tour_sync_completion(uuid) from public, anon, authenticated;
grant execute on function study_tour_promote_waitlist(uuid) to service_role;
grant execute on function study_tour_register(uuid, uuid, uuid, text, text, int, text) to service_role;
grant execute on function study_tour_cancel(uuid) to service_role;
grant execute on function study_tour_refill(uuid) to service_role;
grant execute on function study_tour_stamp(text, uuid, text, boolean) to service_role;
grant execute on function study_tour_sync_completion(uuid) to service_role;
