-- Shift Database Schema

-- ============================================
-- TABLE: users
-- Stores user profiles created during onboarding
-- ============================================
create table users (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  city text,
  commute_type text,
  commute_distance_miles numeric,
  diet_pattern text,
  living_situation text,
  primary_barrier text,
  primary_motivation text,
  ai_profile_summary text,
  top_impact_areas text[],
  estimated_annual_footprint_kg numeric,
  lat numeric,
  lng numeric,
  electricity_zone text,
  car_co2_kg_per_trip numeric,
  transit_co2_kg_per_trip numeric,
  daily_savings_if_switched numeric,
  created_at timestamptz default now()
);

-- Index for fast session lookups
create index idx_users_session_id on users(session_id);

-- ============================================
-- TABLE: actions
-- Stores daily micro-actions generated for users
-- ============================================
create table actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  action_date date not null,
  category text,
  title text,
  description text,
  anchor_habit text,
  co2_savings_kg numeric,
  dollar_savings numeric,
  time_required_minutes integer,
  difficulty_level text,
  behavioral_frame text,
  equivalency_label text,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, action_date)
);

-- Index for user's recent actions lookup
create index idx_actions_user_date on actions(user_id, action_date desc);

-- ============================================
-- TABLE: streaks
-- Tracks user streaks for gamification
-- ============================================
create table streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_action_date date,
  streak_freeze_available boolean default true
);

-- ============================================
-- TABLE: impact_totals
-- Aggregated impact metrics for each user
-- ============================================
create table impact_totals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  total_co2_saved_kg numeric default 0,
  total_dollar_saved numeric default 0,
  total_actions_completed integer default 0
);

-- ============================================
-- FUNCTION: update_streak
-- Atomically updates a user's streak when they complete an action
-- Call with: select update_streak('user-uuid-here');
-- ============================================
create or replace function update_streak(p_user_id uuid)
returns void language plpgsql as $$
declare
  v_last_date date;
  v_current integer;
  v_longest integer;
begin
  -- Get current streak data
  select last_action_date, current_streak, longest_streak
  into v_last_date, v_current, v_longest
  from streaks where user_id = p_user_id;

  -- Handle case where no streak record exists
  if v_current is null then
    insert into streaks (user_id, current_streak, longest_streak, last_action_date)
    values (p_user_id, 1, 1, current_date);
    return;
  end if;

  if v_last_date = current_date - 1 then
    -- Consecutive day - increment streak
    v_current := v_current + 1;
  elsif v_last_date = current_date then
    -- Already updated today - no change
    return;
  else
    -- Streak broken - reset to 1
    v_current := 1;
  end if;

  -- Update longest streak if current exceeds it
  if v_current > v_longest then
    v_longest := v_current;
  end if;

  -- Update the streak record
  update streaks
  set current_streak = v_current,
      longest_streak = v_longest,
      last_action_date = current_date
  where user_id = p_user_id;
end;
$$;

-- ============================================
-- Row Level Security (RLS) Policies
-- For MVP, these are permissive. Tighten in production.
-- ============================================

-- Enable RLS on all tables
alter table users enable row level security;
alter table actions enable row level security;
alter table streaks enable row level security;
alter table impact_totals enable row level security;

-- Allow all operations for now (MVP - no auth)
-- In production, replace with proper user-based policies
create policy "Allow all for users" on users for all using (true);
create policy "Allow all for actions" on actions for all using (true);
create policy "Allow all for streaks" on streaks for all using (true);
create policy "Allow all for impact_totals" on impact_totals for all using (true);
