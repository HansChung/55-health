-- ────────────────────────────────────────────────
-- 個人化異常預警閾值（profiles.alert_thresholds）
-- 在 Supabase Dashboard → SQL Editor 執行
-- 空物件 = 使用系統預設；可依慢性病自動建議後再微調
-- ────────────────────────────────────────────────

alter table profiles
  add column if not exists alert_thresholds jsonb not null default '{}'::jsonb;

comment on column profiles.alert_thresholds is
  '異常預警閾值覆寫，例如 {"glucoseFastingHigh":200,"bpSystolicHigh":150}';
