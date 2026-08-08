-- ────────────────────────────────────────────────
-- 修正 smart_sparks.source 檢查：允許全部章節 QR 與第四部開篇
-- 舊環境若只允許 spark_card / chapter3 / chapter0100，執行本檔即可
-- ────────────────────────────────────────────────

alter table smart_sparks drop constraint if exists smart_sparks_source_check;

alter table smart_sparks add constraint smart_sparks_source_check
  check (
    source in ('spark_card', 'chapter3', 'chapterp4-open')
    or source ~ '^chapter[0-9]{4}$'
  );
