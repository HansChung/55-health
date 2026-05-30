-- 緊急聯絡人欄位（SOS 按鈕用）
-- 在 Supabase SQL Editor 貼上整段，按 Run。看到 Success 就完成。

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS emergency_contact jsonb;

-- 格式範例（程式會自動寫入，這裡只是說明）：
-- { "name": "大兒子", "phone": "0912345678" }

COMMENT ON COLUMN profiles.emergency_contact IS '緊急聯絡人 { name, phone }，給首頁 SOS 求助按鈕使用';
