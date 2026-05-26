-- 為 profiles 加上 notification_settings 欄位
alter table profiles
  add column if not exists notification_settings jsonb default '{
    "meal_breakfast": {"on": true, "time": "07:00"},
    "meal_lunch": {"on": true, "time": "12:00"},
    "meal_dinner": {"on": true, "time": "18:00"},
    "water": {"on": true, "interval_hours": 2},
    "walk": {"on": true, "time": "15:00"},
    "blood_pressure": {"on": false, "times": ["08:00", "20:00"]},
    "family_alerts": {"on": true}
  }'::jsonb;
