-- ────────────────────────────────────────────────
-- 每天早上 7 點的天氣＋健康提醒（推播）
-- 設定放在 profiles.notification_settings.daily_weather = { on, county }（不用改表）；
-- 這裡只加「今天發過了沒」的記號：cron 先把它改成今天（搶到才發），同一天不會重複發
-- ────────────────────────────────────────────────
alter table profiles add column if not exists daily_weather_sent_on date;
