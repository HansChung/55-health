-- 常吃餐點：讓用戶不用每次拍照，也能快速記錄固定餐點
create table if not exists favorite_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  items jsonb not null default '[]',
  total_cal int default 0,
  protein_g numeric(6,2) default 0,
  carb_g numeric(6,2) default 0,
  fat_g numeric(6,2) default 0,
  created_at timestamptz default now()
);

create index if not exists favorite_meals_user_idx on favorite_meals (user_id, created_at desc);

alter table favorite_meals enable row level security;

drop policy if exists "users read own favorite meals" on favorite_meals;
create policy "users read own favorite meals" on favorite_meals
  for select using (auth.uid() = user_id);

drop policy if exists "users insert own favorite meals" on favorite_meals;
create policy "users insert own favorite meals" on favorite_meals
  for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own favorite meals" on favorite_meals;
create policy "users delete own favorite meals" on favorite_meals
  for delete using (auth.uid() = user_id);
