-- 把免費版每月配額拉高（測試 / 朋友試用階段）
update subscription_plans
  set ai_photo_quota = 100,    -- 從 10 拉到 100
      ai_voice_minutes = 20    -- 從 5 拉到 20
  where id = 'free';

-- 順便把標準版/專業版也升級
update subscription_plans
  set ai_photo_quota = 500,    -- 從 100 拉到 500
      ai_voice_minutes = 60    -- 從 30 拉到 60
  where id = 'basic';

update subscription_plans
  set ai_photo_quota = 2000,   -- 從 500 拉到 2000
      ai_voice_minutes = 300   -- 從 120 拉到 300
  where id = 'pro';

-- 順便把你自己設為管理員（不受配額限制）
update profiles
  set is_admin = true
  where id in (
    select id from auth.users where email = 'sunboy1120@gmail.com'
  );
