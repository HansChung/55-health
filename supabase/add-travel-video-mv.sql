-- ────────────────────────────────────────────────
-- 遊記 MV：把遊記寫成一首歌（邁笙 Suno v4.5），配上遊記的照片（專業版）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）；需先跑過 add-travel-video-montage.sql、add-narration-voices.sql
-- ────────────────────────────────────────────────

-- 1. 影片多一種：MV（一樣「每人每種同時只做一支」：沿用 travel_videos_one_pending_per_user_kind）
alter table travel_videos drop constraint if exists travel_videos_kind_check;
alter table travel_videos add constraint travel_videos_kind_check check (kind in ('single', 'montage', 'mv'));

-- 2. MV 的製作進度（歌名、歌詞、Suno 任務、做好的歌、剪輯片段）
alter table travel_videos add column if not exists mv jsonb;

-- 3. ai_usage 允許做歌（Suno）
alter table ai_usage drop constraint if exists ai_usage_service_check;
alter table ai_usage add constraint ai_usage_service_check
  check (service in ('gemini_vision', 'gemini_text', 'openai_realtime', 'openai_chat', 'minimax_video', 'gemini_tts', 'minimax_tts', 'suno_music'));
