-- ── Beauty Garden: Body / Water / Exercise / Supplement Migration ──
-- Run this in your Supabase SQL editor

-- 1. body_logs: one row per user per day
create table if not exists body_logs (
  id         uuid     primary key default gen_random_uuid(),
  user_id    uuid     references auth.users not null,
  log_date   date     not null,
  weight     numeric(5,2),
  body_fat   numeric(5,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, log_date)
);
alter table body_logs enable row level security;
drop policy if exists "Users own body_logs" on body_logs;
create policy "Users own body_logs" on body_logs
  for all using (auth.uid() = user_id);

-- 2. water_logs: cumulative ml per day
create table if not exists water_logs (
  id         uuid    primary key default gen_random_uuid(),
  user_id    uuid    references auth.users not null,
  log_date   date    not null,
  total_ml   integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, log_date)
);
alter table water_logs enable row level security;
drop policy if exists "Users own water_logs" on water_logs;
create policy "Users own water_logs" on water_logs
  for all using (auth.uid() = user_id);

-- 3. exercise_logs: individual entries (multiple per day allowed)
create table if not exists exercise_logs (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    references auth.users not null,
  log_date      date    not null,
  exercise_type text    not null default '',
  sub_type      text    default '',
  duration_min  integer default 30,
  intensity     text    default 'moderate',
  created_at    timestamptz default now()
);
alter table exercise_logs enable row level security;
drop policy if exists "Users own exercise_logs" on exercise_logs;
create policy "Users own exercise_logs" on exercise_logs
  for all using (auth.uid() = user_id);

-- 4. supplement_logs: daily check-ins per supplement name
create table if not exists supplement_logs (
  id               uuid  primary key default gen_random_uuid(),
  user_id          uuid  references auth.users not null,
  log_date         date  not null,
  supplement_name  text  not null,
  created_at       timestamptz default now(),
  unique(user_id, log_date, supplement_name)
);
alter table supplement_logs enable row level security;
drop policy if exists "Users own supplement_logs" on supplement_logs;
create policy "Users own supplement_logs" on supplement_logs
  for all using (auth.uid() = user_id);

-- 5. Extend user_settings with new columns
alter table user_settings
  add column if not exists supplement_names    text[]       default '{}',
  add column if not exists water_goal_ml       integer      default 2000,
  add column if not exists water_quick_amounts integer[]    default '{200,350,500}',
  add column if not exists body_goal_weight    numeric(5,2),
  add column if not exists body_goal_fat       numeric(5,2);
