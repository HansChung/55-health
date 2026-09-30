-- ────────────────────────────────────────────────
-- 研學團：天氣預報用哪個縣市（中央氣象署 36 小時預報）
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）；需先跑過 add-study-tours.sql
-- null＝從集合地點、活動名稱自動判斷
-- ────────────────────────────────────────────────
alter table study_tours add column if not exists weather_county text;
