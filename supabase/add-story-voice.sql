-- ────────────────────────────────────────────────
-- 我的故事集：用自己的聲音念（專業版）
-- 需要先跑過 add-life-stories.sql、add-story-audio.sql、add-narration-voices.sql
-- 用「我的聲音」把整篇故事念成一個錄音，存在 story-audio：{user}/{story}/voice-{hash}.m4a
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

-- 念好的錄音：{ "path", "seconds", "text_hash", "clone_id", "created_at" }
alter table life_stories add column if not exists voice_reading jsonb;
-- 正在念的時候先占住（同一篇同時只念一次，連按兩下不會付兩次）
alter table life_stories add column if not exists voice_reading_lease timestamptz;
