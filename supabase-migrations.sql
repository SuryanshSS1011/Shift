-- Migration: Add Points, SDG Tags, AI Cost, and Category Streaks
-- Run this in the Supabase SQL Editor before testing

-- 1. Add new columns to actions table
ALTER TABLE actions ADD COLUMN IF NOT EXISTS sdg_tags integer[] DEFAULT '{}';
ALTER TABLE actions ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS ai_cost_co2_grams numeric DEFAULT 0;

-- 2. Add total_points to impact_totals
ALTER TABLE impact_totals ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0;

-- 3. Create category_streaks table for per-category streak tracking
CREATE TABLE IF NOT EXISTS category_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_action_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_streaks_user_id ON category_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_category_streaks_category ON category_streaks(category);

-- 4. Create eco_llm_calls table for tracking AI inference costs
CREATE TABLE IF NOT EXISTS eco_llm_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  model text NOT NULL,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  energy_wh numeric DEFAULT 0,
  co2_grams numeric DEFAULT 0,
  water_ml numeric DEFAULT 0,
  was_cache_hit boolean DEFAULT false,
  co2_saved numeric DEFAULT 0,
  source text DEFAULT 'other', -- 'action_generation' | 'gemini_prompt' | 'other'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eco_llm_calls_session_id ON eco_llm_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_eco_llm_calls_source ON eco_llm_calls(source);
CREATE INDEX IF NOT EXISTS idx_eco_llm_calls_created_at ON eco_llm_calls(created_at);

-- 5. Verify the columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'actions'
  AND column_name IN ('sdg_tags', 'points', 'ai_cost_co2_grams');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'impact_totals'
  AND column_name = 'total_points';

-- 6. Show tables created
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('category_streaks', 'eco_llm_calls');
