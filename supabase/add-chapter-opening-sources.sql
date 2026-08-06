-- 書本輕耦合：smart_sparks.source 允許任意章節開篇 chapterXXXX
-- （保留 spark_card / chapter3 / chapter0100；新增 chapter0102…chapter0211 等）
-- 在 Supabase SQL Editor 執行

alter table smart_sparks drop constraint if exists smart_sparks_source_check;
alter table smart_sparks add constraint smart_sparks_source_check
  check (
    source in ('spark_card', 'chapter3')
    or source ~ '^chapter[0-9]{4}$'
  );
