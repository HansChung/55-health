-- ────────────────────────────────────────────────
-- 出遊影片口白：選口音、用自己的聲音念（聲音複製，專業版）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）；需先跑過 add-travel-video-narration.sql
-- ────────────────────────────────────────────────

-- 1. ai_usage 允許「我的聲音」的配音／複製（邁笙 speech-2.8）
alter table ai_usage drop constraint if exists ai_usage_service_check;
alter table ai_usage add constraint ai_usage_service_check
  check (service in ('gemini_vision', 'gemini_text', 'openai_realtime', 'openai_chat', 'minimax_video', 'gemini_tts', 'minimax_tts'));

-- 2. 影片口白的口音（taiwan／taigi／hakka／cantonese／sichuan／shandong；用自己的聲音時是 null）
alter table travel_videos add column if not exists narration_accent text;

-- 3. 我的聲音：平台上複製好的音色（我們不保存原始錄音）
--    新音色 7 天內沒用就失效；第一次用來配音時平台收一次啟用費，之後永久有效（activated_at）
create table if not exists voice_clones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  provider_voice_id text not null,
  model text not null default 'speech-2.8',
  sample_seconds numeric(5,2),
  demo_url text,
  consent_text text not null,                 -- 本人勾選同意的文字
  consented_at timestamptz not null default now(),
  activated_at timestamptz,
  activating_until timestamptz,               -- 第一次配音進行中（避免同時送兩次被收兩次啟用費）
  expires_at timestamptz,
  deleted_at timestamptz,                     -- 使用者刪除／重錄（平台沒有刪除 API，停用後不會再被使用）
  created_at timestamptz not null default now()
);

-- 一個人同時只有一個能用的聲音
create unique index if not exists voice_clones_one_active_per_user on voice_clones (user_id) where deleted_at is null;
create index if not exists voice_clones_user_created on voice_clones (user_id, created_at desc);

-- 只給伺服器讀寫（音色 id 不給前端）
alter table voice_clones enable row level security;
grant all on voice_clones to service_role;
