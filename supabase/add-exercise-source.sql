-- 運動記錄來源標記 + 去重（為了串接 Apple 健康 / Google Health Connect 自動匯入）
-- source：資料來源（manual=使用者手動、health=從健康平台同步）
-- external_id：健康平台上該筆運動的唯一 ID，用來避免同一筆運動被重複匯入

alter table exercises add column if not exists source text not null default 'manual'
  check (source in ('manual', 'health'));
alter table exercises add column if not exists external_id text;

-- 同一個使用者、同一個 external_id 只能存在一筆 → 重複同步時直接被 DB 擋掉
create unique index if not exists exercises_user_external_idx
  on exercises (user_id, external_id)
  where external_id is not null;
