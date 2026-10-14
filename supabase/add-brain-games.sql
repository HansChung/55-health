-- ────────────────────────────────────────────────
-- 腦力小遊戲：每天一題，一天一筆（台北日期），算連續天數、健康成就徽章
-- 題目是程式用日期算出來的（全台同一題），這裡只記有沒有玩、答對沒有
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

create table if not exists brain_game_plays (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  kind text not null check (kind in ('money', 'memory', 'odd', 'idiom', 'sequence')),
  correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table brain_game_plays enable row level security;
grant all on brain_game_plays to service_role;
