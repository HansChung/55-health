-- ────────────────────────────────────────────────
-- 數位名片的樣子：配色（theme）＋直式／橫式（layout）
-- 要先跑過 add-business-cards.sql
-- 沒跑這個檔：名片照常運作，只是一律是原本的樣子（暖橘、直式），選了也存不起來
-- 選項清單在程式裡（CARD_THEMES／CARD_LAYOUTS，src/lib/business-card.ts）；不認得的值一律當預設，所以這裡只限長度
-- 在 Supabase Dashboard → SQL Editor 執行（可重複執行）
-- ────────────────────────────────────────────────

alter table business_cards add column if not exists theme text not null default 'warm';
alter table business_cards add column if not exists layout text not null default 'vertical';

alter table business_cards drop constraint if exists business_cards_theme_len;
alter table business_cards add constraint business_cards_theme_len check (char_length(theme) <= 20);
alter table business_cards drop constraint if exists business_cards_layout_len;
alter table business_cards add constraint business_cards_layout_len check (char_length(layout) <= 20);

-- 讓 PostgREST 馬上看到新欄位
notify pgrst, 'reload schema';
