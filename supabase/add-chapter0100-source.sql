-- 章節開篇 0100：smart_sparks.source 新增 chapter0100
-- 若表已存在且只有 spark_card / chapter3，在 Supabase SQL Editor 執行

alter table smart_sparks drop constraint if exists smart_sparks_source_check;
alter table smart_sparks add constraint smart_sparks_source_check
  check (source in ('spark_card', 'chapter3', 'chapter0100'));
