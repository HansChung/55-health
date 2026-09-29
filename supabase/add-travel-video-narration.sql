-- ────────────────────────────────────────────────
-- 出遊回憶影片：口白＋字幕（AI 配音 gem-3.1-tts，字幕燒進影片）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）；需先跑過 add-travel-videos.sql
-- ────────────────────────────────────────────────

-- 1. ai_usage 允許配音服務 gemini_tts
alter table ai_usage drop constraint if exists ai_usage_service_check;
alter table ai_usage add constraint ai_usage_service_check
  check (service in ('gemini_vision', 'gemini_text', 'openai_realtime', 'openai_chat', 'minimax_video', 'gemini_tts'));

-- 2. 影片的口白資訊（沒選口白的影片這些欄位都是 null）
alter table travel_videos add column if not exists narration_text text;
alter table travel_videos add column if not exists narration_voice text;
alter table travel_videos add column if not exists narration_path text;       -- travel-videos bucket 內的口白音檔
alter table travel_videos add column if not exists narration_seconds numeric(5,2);
alter table travel_videos add column if not exists duration_seconds int;      -- 有口白時影片長度依口白而定（4～15 秒）

-- 3. Storage 允許放口白音檔（wav）
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/wav']
where id = 'travel-videos';
